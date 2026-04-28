import * as vscode from 'vscode';
import {
    PbContainerKind,
    PbImplementationKind,
    PbSymbol,
    PbSymbolKind,
} from '../models/pbSymbol';
import {
    PowerScriptDocumentModelCache,
    PowerScriptDocumentStatement,
    mapStatementOffsetToPosition,
} from '../document/powerScriptDocumentModel';
import {
    END_EVENT_PATTERN,
    END_FORWARD_PATTERN,
    END_FUNCTION_PATTERN,
    END_ON_PATTERN,
    END_PROTOTYPES_PATTERN,
    END_SUBROUTINE_PATTERN,
    END_TYPE_PATTERN,
    END_VARIABLES_PATTERN,
    EVENT_PATTERN,
    EXTERNAL_CALLABLE_ALIAS_PATTERN,
    EXTERNAL_CALLABLE_LIBRARY_PATTERN,
    FORWARD_PROTOTYPES_START_PATTERN,
    FORWARD_START_PATTERN,
    FUNCTION_PATTERN,
    IDENTIFIER_SOURCE,
    isExternalCallableDeclaration,
    NESTED_TYPE_PATTERN,
    OBJECT_INSTANCE_PATTERN,
    ON_EVENT_PATTERN,
    QUALIFIED_EVENT_PATTERN,
    ROOT_TYPE_PATTERN,
    SIMPLE_TYPE_PATTERN,
    STRUCTURE_PATTERN,
    SUBROUTINE_PATTERN,
    TYPE_PROTOTYPES_START_PATTERN,
    TYPE_VARIABLES_START_PATTERN,
    VARIABLE_PATTERN,
    isIgnorablePowerScriptStatement,
    parseInlineAccessModifier,
    parseVariableAccessLabel,
} from '../grammar/pbLanguageGrammar';

interface ParserState {
    rootObjectName?: string;
    rootImplementationActive: boolean;
    inForwardDeclarations: boolean;
    inForwardPrototypes: boolean;
    inTypeVariables: boolean;
    inTypePrototypes: boolean;
    currentVariableAccess?: string;
    frameStack: ParserFrame[];
}

interface ParserFrame {
    kind: PbContainerKind;
    symbol: PbSymbol;
}

interface SignatureInfo {
    signature: string;
    parameterCount: number;
}

interface ParsedCallableSymbol {
    symbol: PbSymbol;
    parameters: PbSymbol[];
    trackBody: boolean;
}

interface ExternalCallableMetadata {
    libraryName: string;
    externalName?: string;
}

const NON_DECLARATION_START_KEYWORDS = new Set([
    'if',
    'elseif',
    'else',
    'for',
    'next',
    'do',
    'loop',
    'try',
    'catch',
    'finally',
    'choose',
    'case',
    'return',
    'event',
    'on',
    'function',
    'subroutine',
    'type',
    'forward',
    'create',
    'destroy',
    'call',
    'open',
    'close',
    'end',
    'throw',
    'throws',
    'continue',
    'exit',
    'halt',
]);

export class PbDocumentParser {
    parse(document: vscode.TextDocument): PbSymbol[] {
        const symbols: PbSymbol[] = [];

        const state: ParserState = {
            rootImplementationActive: false,
            inForwardDeclarations: false,
            inForwardPrototypes: false,
            inTypeVariables: false,
            inTypePrototypes: false,
            frameStack: [],
        };

        const containerMap = new Map<string, PbSymbol>();
        const model = PowerScriptDocumentModelCache.getInstance().getModel(document);

        for (const statement of model.statements) {
            const text = statement.text.trim();

            if (!text || isIgnorablePowerScriptStatement(text)) {
                continue;
            }

            if (this.handleSectionTransitions(statement, text, state)) {
                continue;
            }

            const objectInstanceMatch = text.match(OBJECT_INSTANCE_PATTERN);

            if (
                objectInstanceMatch &&
                state.rootObjectName &&
                objectInstanceMatch[1].toLowerCase() === state.rootObjectName.toLowerCase() &&
                objectInstanceMatch[2].toLowerCase() === state.rootObjectName.toLowerCase()
            ) {
                state.rootImplementationActive = true;
                continue;
            }

            if (state.inForwardDeclarations) {
                continue;
            }

            const typeSymbol = this.tryParseTypeSymbol(
                document.uri,
                statement,
                text,
                state,
                containerMap,
            );

            if (typeSymbol) {
                symbols.push(typeSymbol);
                containerMap.set(typeSymbol.name, typeSymbol);

                if (typeSymbol.parent) {
                    this.attachChild(containerMap, typeSymbol.parent, typeSymbol);
                }

                state.frameStack.push({
                    kind: typeSymbol.kind === 'structure'
                        ? 'structure'
                        : typeSymbol.containerKind === 'file-object'
                            ? 'file-object'
                            : 'type',
                    symbol: typeSymbol,
                });
                continue;
            }

            if (state.inTypeVariables) {
                const accessLabel = parseVariableAccessLabel(text);

                if (accessLabel) {
                    state.currentVariableAccess = accessLabel;
                    continue;
                }

                const variableSymbol = this.tryParseVariable(
                    document.uri,
                    statement,
                    text,
                    state,
                    containerMap,
                    true,
                );

                if (variableSymbol) {
                    symbols.push(variableSymbol);
                    this.attachChild(containerMap, variableSymbol.parent, variableSymbol);
                }

                continue;
            }

            if (state.inForwardPrototypes || state.inTypePrototypes) {
                const prototypeResult = this.tryParseCallableSymbol(
                    document.uri,
                    statement,
                    state,
                    containerMap,
                    true,
                );

                if (prototypeResult) {
                    const prototypeSymbol: PbSymbol = prototypeResult.symbol;
                    symbols.push(prototypeSymbol);
                    this.attachChild(containerMap, prototypeSymbol.parent, prototypeSymbol);
                }

                continue;
            }

            const callableResult = this.tryParseCallableSymbol(
                document.uri,
                statement,
                state,
                containerMap,
                false,
            );

            if (callableResult) {
                symbols.push(callableResult.symbol);
                this.attachChild(containerMap, callableResult.symbol.parent, callableResult.symbol);

                for (const parameterSymbol of callableResult.parameters) {
                    symbols.push(parameterSymbol);
                    this.attachChildToSymbol(callableResult.symbol, parameterSymbol);
                }

                if (callableResult.trackBody) {
                    state.frameStack.push({
                        kind: this.getCallableContainerKind(callableResult.symbol),
                        symbol: callableResult.symbol,
                    });
                }

                continue;
            }

            const standaloneVariableSymbol = this.tryParseVariable(
                document.uri,
                statement,
                text,
                state,
                containerMap,
                false,
            );

            if (standaloneVariableSymbol) {
                symbols.push(standaloneVariableSymbol);

                const currentContainer = this.getCurrentContainerSymbol(state);

                if (
                    currentContainer &&
                    standaloneVariableSymbol.parent &&
                    currentContainer.name.toLowerCase() === standaloneVariableSymbol.parent.toLowerCase()
                ) {
                    this.attachChildToSymbol(currentContainer, standaloneVariableSymbol);
                } else {
                    this.attachChild(containerMap, standaloneVariableSymbol.parent, standaloneVariableSymbol);
                }
            }
        }

        return symbols;
    }

    private handleSectionTransitions(
        statement: PowerScriptDocumentStatement,
        text: string,
        state: ParserState,
    ): boolean {
        if (FORWARD_PROTOTYPES_START_PATTERN.test(text)) {
            state.inForwardPrototypes = true;
            state.inTypePrototypes = false;
            return true;
        }

        if (END_PROTOTYPES_PATTERN.test(text)) {
            if (state.inForwardPrototypes) {
                state.inForwardPrototypes = false;
                return true;
            }

            if (state.inTypePrototypes) {
                state.inTypePrototypes = false;
                return true;
            }
        }

        if (TYPE_PROTOTYPES_START_PATTERN.test(text)) {
            state.inTypePrototypes = true;
            return true;
        }

        if (FORWARD_START_PATTERN.test(text)) {
            state.inForwardDeclarations = true;
            return true;
        }

        if (END_FORWARD_PATTERN.test(text)) {
            state.inForwardDeclarations = false;
            return true;
        }

        if (TYPE_VARIABLES_START_PATTERN.test(text)) {
            state.inTypeVariables = true;
            state.currentVariableAccess = undefined;
            return true;
        }

        if (END_VARIABLES_PATTERN.test(text)) {
            state.inTypeVariables = false;
            state.currentVariableAccess = undefined;
            return true;
        }

        if (END_TYPE_PATTERN.test(text)) {
            const closed = this.closeFrame(
                state,
                ['file-object', 'type', 'structure'],
                statement,
            );

            if (
                closed &&
                state.rootObjectName &&
                closed.name.toLowerCase() === state.rootObjectName.toLowerCase()
            ) {
                state.rootImplementationActive = false;
            }

            return true;
        }

        if (END_FUNCTION_PATTERN.test(text)) {
            this.closeFrame(state, ['function'], statement);
            return true;
        }

        if (END_SUBROUTINE_PATTERN.test(text)) {
            this.closeFrame(state, ['subroutine'], statement);
            return true;
        }

        if (END_EVENT_PATTERN.test(text)) {
            this.closeFrame(state, ['event'], statement);
            return true;
        }

        if (END_ON_PATTERN.test(text)) {
            this.closeFrame(state, ['event'], statement);
            return true;
        }

        return false;
    }

    private tryParseTypeSymbol(
        uri: vscode.Uri,
        statement: PowerScriptDocumentStatement,
        text: string,
        state: ParserState,
        containerMap: Map<string, PbSymbol>,
    ): PbSymbol | undefined {
        const structureMatch = text.match(STRUCTURE_PATTERN);

        if (structureMatch) {
            const structureName = structureMatch[1];
            const explicitParent = structureMatch[2];
            const parentName =
                explicitParent ??
                this.getCurrentContainerName(state);

            const isRootStructure = text.match(ROOT_TYPE_PATTERN) !== null;

            if (isRootStructure && !state.rootObjectName) {
                state.rootObjectName = structureName;
            }

            return this.createContainerSymbol({
                name: structureName,
                kind: 'structure',
                uri,
                statement,
                detail: 'from structure',
                baseTypeName: 'structure',
                parent: parentName,
                containerName: parentName ?? structureName,
                containerKind: parentName
                    ? this.resolveContainerKind(parentName, containerMap, state)
                    : isRootStructure
                        ? 'file-object'
                        : undefined,
                fileObjectName: isRootStructure
                    ? structureName
                    : state.rootObjectName,
            });
        }

        const rootTypeMatch = text.match(ROOT_TYPE_PATTERN);

        if (rootTypeMatch) {
            const typeName = rootTypeMatch[1];
            const baseType = this.normalizeType(rootTypeMatch[2]);

            if (!state.rootObjectName) {
                state.rootObjectName = typeName;
            }

            if (containerMap.has(typeName)) {
                return undefined;
            }

            return this.createContainerSymbol({
                name: typeName,
                kind: 'type',
                uri,
                statement,
                detail: `from ${baseType}`,
                baseTypeName: baseType,
                parent: undefined,
                containerName: typeName,
                containerKind: 'file-object',
                fileObjectName: typeName,
            });
        }

        const nestedTypeMatch = text.match(NESTED_TYPE_PATTERN);

        if (nestedTypeMatch) {
            const typeName = nestedTypeMatch[1];
            const baseType = this.normalizeType(nestedTypeMatch[2]);
            const parentName = nestedTypeMatch[3];

            return this.createContainerSymbol({
                name: typeName,
                kind: 'type',
                uri,
                statement,
                detail: `from ${baseType}`,
                baseTypeName: baseType,
                parent: parentName,
                containerName: parentName,
                containerKind: this.resolveContainerKind(
                    parentName,
                    containerMap,
                    state,
                ),
                fileObjectName: state.rootObjectName,
            });
        }

        const simpleTypeMatch = text.match(SIMPLE_TYPE_PATTERN);

        if (simpleTypeMatch) {
            const typeName = simpleTypeMatch[1];
            const baseType = this.normalizeType(simpleTypeMatch[2]);
            const parentName = this.getCurrentContainerName(state);

            return this.createContainerSymbol({
                name: typeName,
                kind: 'type',
                uri,
                statement,
                detail: `from ${baseType}`,
                baseTypeName: baseType,
                parent: parentName,
                containerName: parentName ?? typeName,
                containerKind: parentName
                    ? this.resolveContainerKind(parentName, containerMap, state)
                    : undefined,
                fileObjectName: parentName
                    ? state.rootObjectName
                    : undefined,
            });
        }

        return undefined;
    }

    private tryParseCallableSymbol(
        uri: vscode.Uri,
        statement: PowerScriptDocumentStatement,
        state: ParserState,
        containerMap: Map<string, PbSymbol>,
        isPrototype: boolean,
    ): ParsedCallableSymbol | undefined {
        const text = statement.text.trim();

        let match = text.match(FUNCTION_PATTERN);

        if (match) {
            const access = match[1]?.toLowerCase();
            const returnType = this.normalizeType(match[2]);
            const name = match[3];
            const parameters = match[4] ?? '';
            const parentName = this.getCurrentContainerName(state);
            const externalMetadata = this.parseExternalCallableMetadata(text);

            const signatureInfo = this.buildFunctionSignature(
                returnType,
                name,
                parameters,
            );

            const kind: PbSymbolKind =
                !parentName && (access === 'global' || !!externalMetadata)
                    ? 'global-function'
                    : 'function';

            const symbol = this.createMemberSymbol({
                name,
                kind,
                uri,
                statement,
                parent: parentName,
                access,
                returnType,
                signature: signatureInfo.signature,
                parameterCount: signatureInfo.parameterCount,
                fileObjectName: state.rootImplementationActive
                    ? state.rootObjectName
                    : undefined,
                containerName: parentName,
                containerKind: this.resolveContainerKind(
                    parentName,
                    containerMap,
                    state,
                ),
                isPrototype,
                implementationKind: isPrototype
                    ? 'prototype'
                    : 'implementation',
                isExternal: !!externalMetadata,
                externalLibraryName: externalMetadata?.libraryName,
                externalName: externalMetadata?.externalName,
            });

            return {
                symbol,
                parameters: isPrototype || !!externalMetadata
                    ? []
                    : this.createParameterSymbols(uri, statement, parameters, symbol, state),
                trackBody: !isPrototype && !externalMetadata,
            };
        }

        match = text.match(SUBROUTINE_PATTERN);

        if (match) {
            const access = match[1]?.toLowerCase();
            const name = match[2];
            const parameters = match[3] ?? '';
            const parentName = this.getCurrentContainerName(state);
            const externalMetadata = this.parseExternalCallableMetadata(text);

            const signatureInfo = this.buildSubroutineSignature(
                name,
                parameters,
            );

            const symbol = this.createMemberSymbol({
                name,
                kind: 'subroutine',
                uri,
                statement,
                parent: parentName,
                access,
                signature: signatureInfo.signature,
                parameterCount: signatureInfo.parameterCount,
                fileObjectName: state.rootImplementationActive
                    ? state.rootObjectName
                    : undefined,
                containerName: parentName,
                containerKind: this.resolveContainerKind(
                    parentName,
                    containerMap,
                    state,
                ),
                isPrototype,
                implementationKind: isPrototype
                    ? 'prototype'
                    : 'implementation',
                isExternal: !!externalMetadata,
                externalLibraryName: externalMetadata?.libraryName,
                externalName: externalMetadata?.externalName,
            });

            return {
                symbol,
                parameters: isPrototype || !!externalMetadata
                    ? []
                    : this.createParameterSymbols(uri, statement, parameters, symbol, state),
                trackBody: !isPrototype && !externalMetadata,
            };
        }

        match = text.match(QUALIFIED_EVENT_PATTERN);

        if (match) {
            const ownerName = match[1];
            const eventName = match[2];
            const parameters = match[3] ?? '';

            const signatureInfo = this.buildEventSignature(
                eventName,
                parameters,
            );

            const symbol = this.createMemberSymbol({
                name: eventName,
                kind: 'event',
                uri,
                statement,
                parent: ownerName,
                detail: `${ownerName}::${eventName}`,
                signature: signatureInfo.signature,
                parameterCount: signatureInfo.parameterCount,
                fileObjectName: state.rootImplementationActive
                    ? state.rootObjectName
                    : undefined,
                containerName: ownerName,
                containerKind: this.resolveContainerKind(
                    ownerName,
                    containerMap,
                    state,
                ),
                isPrototype,
                implementationKind: isPrototype
                    ? 'prototype'
                    : 'qualified-event',
                ownerName,
                preferLastOccurrence: true,
            });

            return {
                symbol,
                parameters: isPrototype
                    ? []
                    : this.createParameterSymbols(uri, statement, parameters, symbol, state),
                trackBody: !isPrototype,
            };
        }

        match = text.match(EVENT_PATTERN);

        if (match) {
            const name = match[1];
            const parameters = match[2] ?? '';
            const parentName = this.getCurrentContainerName(state);

            const signatureInfo = this.buildEventSignature(
                name,
                parameters,
            );

            const symbol = this.createMemberSymbol({
                name,
                kind: 'event',
                uri,
                statement,
                parent: parentName,
                signature: signatureInfo.signature,
                parameterCount: signatureInfo.parameterCount,
                fileObjectName: state.rootImplementationActive
                    ? state.rootObjectName
                    : undefined,
                containerName: parentName,
                containerKind: this.resolveContainerKind(
                    parentName,
                    containerMap,
                    state,
                ),
                isPrototype,
                implementationKind: isPrototype
                    ? 'prototype'
                    : 'implementation',
            });

            return {
                symbol,
                parameters: isPrototype
                    ? []
                    : this.createParameterSymbols(uri, statement, parameters, symbol, state),
                trackBody: !isPrototype,
            };
        }

        match = text.match(ON_EVENT_PATTERN);

        if (match) {
            const ownerName = match[1];
            const eventName = match[2];

            const signatureInfo = this.buildEventSignature(
                eventName,
                '',
            );

            const symbol = this.createMemberSymbol({
                name: eventName,
                kind: 'event',
                uri,
                statement,
                parent: ownerName,
                detail: `on ${ownerName}.${eventName}`,
                signature: signatureInfo.signature,
                parameterCount: signatureInfo.parameterCount,
                fileObjectName: state.rootImplementationActive
                    ? state.rootObjectName
                    : undefined,
                containerName: ownerName,
                containerKind: this.resolveContainerKind(
                    ownerName,
                    containerMap,
                    state,
                ),
                isPrototype: false,
                implementationKind: 'on-handler',
                ownerName,
                preferLastOccurrence: true,
            });

            return {
                symbol,
                parameters: [],
                trackBody: false,
            };
        }

        return undefined;
    }

    private tryParseVariable(
        uri: vscode.Uri,
        statement: PowerScriptDocumentStatement,
        text: string,
        state: ParserState,
        containerMap: Map<string, PbSymbol>,
        isTypeVariablesSection: boolean,
    ): PbSymbol | undefined {
        const match = text.match(VARIABLE_PATTERN);

        if (!match) {
            return undefined;
        }

        const inlineAccess = parseInlineAccessModifier(text);

        if (!isTypeVariablesSection && !inlineAccess && !this.looksLikeStandaloneVariableDeclaration(text)) {
            return undefined;
        }

        const modifier = match[1]?.toLowerCase();
        const typeName = this.normalizeType(match[2]);
        const variableName = match[3];
        const currentCallable = this.getCurrentCallableSymbol(state);
        const currentContainer = this.getCurrentContainerSymbol(state);
        const parentName = currentCallable?.name ?? this.getCurrentContainerName(state);

        const kind: PbSymbolKind =
            modifier === 'constant'
                ? 'constant'
                : 'variable';

        const declarationScope = currentCallable
            ? 'local'
            : 'member';

        return this.createMemberSymbol({
            name: variableName,
            kind,
            uri,
            statement,
            parent: parentName,
            access: inlineAccess ?? state.currentVariableAccess,
            detail: typeName,
            declarationScope,
            fileObjectName: state.rootImplementationActive
                ? state.rootObjectName
                : undefined,
            containerName: currentCallable?.name ?? parentName,
            containerKind: currentCallable
                ? this.getCallableContainerKind(currentCallable)
                : currentContainer
                    ? currentContainer.kind === 'type'
                        ? currentContainer.containerKind ?? 'type'
                        : currentContainer.kind === 'structure'
                            ? 'structure'
                            : currentContainer.kind === 'function'
                                ? 'function'
                                : currentContainer.kind === 'subroutine'
                                    ? 'subroutine'
                                    : currentContainer.kind === 'event'
                                        ? 'event'
                                        : 'file-object'
                    : this.resolveContainerKind(
                        parentName,
                        containerMap,
                        state,
                    ),
            containerSignature: currentCallable?.signature,
            isPrototype: false,
            implementationKind: 'implementation',
        });
    }

    private looksLikeStandaloneVariableDeclaration(text: string): boolean {
        const trimmed = text.trim();

        if (!trimmed) {
            return false;
        }

        const firstTokenMatch = trimmed.match(new RegExp(`^(${IDENTIFIER_SOURCE})`, 'i'));
        const firstToken = firstTokenMatch?.[1]?.toLowerCase();

        if (!firstToken) {
            return false;
        }

        if (NON_DECLARATION_START_KEYWORDS.has(firstToken)) {
            return false;
        }

        return VARIABLE_PATTERN.test(trimmed);
    }

    private getCurrentContainerName(state: ParserState): string | undefined {
        const currentContainer = this.getCurrentContainerSymbol(state);

        if (currentContainer) {
            return currentContainer.name;
        }

        if (state.rootImplementationActive) {
            return state.rootObjectName;
        }

        return undefined;
    }

    private resolveContainerKind(
        parentName: string | undefined,
        containerMap: Map<string, PbSymbol>,
        state: ParserState,
    ): PbContainerKind | undefined {
        if (!parentName) {
            return undefined;
        }

        if (parentName === state.rootObjectName) {
            return 'file-object';
        }

        const currentContainer = this.getCurrentContainerSymbol(state);

        if (
            currentContainer &&
            currentContainer.name.toLowerCase() === parentName.toLowerCase()
        ) {
            return this.mapSymbolKindToContainerKind(currentContainer);
        }

        const parentSymbol = containerMap.get(parentName);

        if (!parentSymbol) {
            return undefined;
        }

        if (parentSymbol.kind === 'structure') {
            return 'structure';
        }

        if (parentSymbol.kind === 'type') {
            return 'type';
        }

        if (parentSymbol.kind === 'function' || parentSymbol.kind === 'global-function') {
            return 'function';
        }

        if (parentSymbol.kind === 'subroutine') {
            return 'subroutine';
        }

        if (parentSymbol.kind === 'event') {
            return 'event';
        }

        return undefined;
    }

    private getCurrentContainerSymbol(state: ParserState): PbSymbol | undefined {
        const currentFrame = state.frameStack[state.frameStack.length - 1];
        return currentFrame?.symbol;
    }

    private getCurrentCallableSymbol(state: ParserState): PbSymbol | undefined {
        const currentFrame = state.frameStack[state.frameStack.length - 1];

        if (!currentFrame) {
            return undefined;
        }

        if (
            currentFrame.kind === 'function' ||
            currentFrame.kind === 'subroutine' ||
            currentFrame.kind === 'event'
        ) {
            return currentFrame.symbol;
        }

        return undefined;
    }

    private getCallableContainerKind(symbol: PbSymbol): PbContainerKind {
        if (symbol.kind === 'function' || symbol.kind === 'global-function') {
            return 'function';
        }

        if (symbol.kind === 'subroutine') {
            return 'subroutine';
        }

        return 'event';
    }

    private buildFunctionSignature(
        returnType: string,
        name: string,
        parameters: string,
    ): SignatureInfo {
        const normalizedParams = this.normalizeParameters(parameters);

        return {
            signature: `${returnType} ${name}(${normalizedParams})`,
            parameterCount: this.countParameters(normalizedParams),
        };
    }

    private buildSubroutineSignature(
        name: string,
        parameters: string,
    ): SignatureInfo {
        const normalizedParams = this.normalizeParameters(parameters);

        return {
            signature: `${name}(${normalizedParams})`,
            parameterCount: this.countParameters(normalizedParams),
        };
    }

    private buildEventSignature(
        name: string,
        parameters: string,
    ): SignatureInfo {
        const normalizedParams = this.normalizeParameters(parameters);

        return {
            signature: `${name}(${normalizedParams})`,
            parameterCount: this.countParameters(normalizedParams),
        };
    }

    private normalizeParameters(parameters: string): string {
        return parameters.replace(/\s+/g, ' ').trim();
    }

    private countParameters(parameters: string): number {
        if (!parameters.trim()) {
            return 0;
        }

        return parameters
            .split(',')
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .length;
    }

    private normalizeType(value: string): string {
        return value.replace(/\s+/g, ' ').trim();
    }

    private parseExternalCallableMetadata(
        text: string,
    ): ExternalCallableMetadata | undefined {
        if (!isExternalCallableDeclaration(text)) {
            return undefined;
        }

        const libraryMatch = text.match(EXTERNAL_CALLABLE_LIBRARY_PATTERN);

        if (!libraryMatch?.[1]) {
            return undefined;
        }

        const aliasMatch = text.match(EXTERNAL_CALLABLE_ALIAS_PATTERN);

        return {
            libraryName: libraryMatch[1],
            externalName: aliasMatch?.[1],
        };
    }

    private createContainerSymbol(args: {
        name: string;
        kind: PbSymbolKind;
        uri: vscode.Uri;
        statement: PowerScriptDocumentStatement;
        detail?: string;
        baseTypeName?: string;
        parent?: string;
        containerName?: string;
        containerKind?: PbContainerKind;
        fileObjectName?: string;
    }): PbSymbol {
        const nameStartOffset = this.findNameOffset(args.statement.text, args.name);
        const nameEndOffset = nameStartOffset + args.name.length;

        return {
            name: args.name,
            kind: args.kind,
            uri: args.uri,
            range: args.statement.range,
            selectionRange: new vscode.Range(
                mapStatementOffsetToPosition(args.statement, nameStartOffset, 'start'),
                mapStatementOffsetToPosition(args.statement, nameEndOffset, 'end'),
            ),
            detail: args.detail,
            baseTypeName: args.baseTypeName,
            parent: args.parent,
            containerName: args.containerName,
            containerKind: args.containerKind,
            fileObjectName: args.fileObjectName,
            children: [],
            isPrototype: false,
            implementationKind: 'implementation',
        };
    }

    private createMemberSymbol(args: {
        name: string;
        kind: PbSymbolKind;
        uri: vscode.Uri;
        statement: PowerScriptDocumentStatement;
        parent?: string;
        detail?: string;
        access?: string;
        returnType?: string;
        signature?: string;
        parameterCount?: number;
        containerName?: string;
        containerKind?: PbContainerKind;
        containerSignature?: string;
        fileObjectName?: string;
        declarationScope?: 'member' | 'local' | 'parameter';
        isPrototype?: boolean;
        implementationKind?: PbImplementationKind;
        ownerName?: string;
        isExternal?: boolean;
        externalLibraryName?: string;
        externalName?: string;
        preferLastOccurrence?: boolean;
        nameStartOffset?: number;
        nameEndOffset?: number;
    }): PbSymbol {
        const nameStartOffset = args.nameStartOffset ?? this.findNameOffset(
            args.statement.text,
            args.name,
            args.preferLastOccurrence === true,
        );
        const nameEndOffset = args.nameEndOffset ?? (nameStartOffset + args.name.length);

        return {
            name: args.name,
            kind: args.kind,
            uri: args.uri,
            range: args.statement.range,
            selectionRange: new vscode.Range(
                mapStatementOffsetToPosition(args.statement, nameStartOffset, 'start'),
                mapStatementOffsetToPosition(args.statement, nameEndOffset, 'end'),
            ),
            detail: args.detail,
            parent: args.parent,
            access: args.access,
            returnType: args.returnType,
            signature: args.signature,
            parameterCount: args.parameterCount,
            containerName: args.containerName,
            containerKind: args.containerKind,
            containerSignature: args.containerSignature,
            fileObjectName: args.fileObjectName,
            declarationScope: args.declarationScope,
            isPrototype: args.isPrototype,
            implementationKind: args.implementationKind,
            ownerName: args.ownerName,
            isExternal: args.isExternal,
            externalLibraryName: args.externalLibraryName,
            externalName: args.externalName,
        };
    }

    private attachChild(
        containerMap: Map<string, PbSymbol>,
        parentName: string | undefined,
        child: PbSymbol,
    ): void {
        if (!parentName) {
            return;
        }

        const parent = containerMap.get(parentName);

        if (!parent) {
            return;
        }

        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push(child);
    }

    private attachChildToSymbol(
        parent: PbSymbol,
        child: PbSymbol,
    ): void {
        if (!parent.children) {
            parent.children = [];
        }

        parent.children.push(child);
    }

    private closeFrame(
        state: ParserState,
        expectedKinds: PbContainerKind[],
        statement: PowerScriptDocumentStatement,
    ): PbSymbol | undefined {
        const currentFrame = state.frameStack[state.frameStack.length - 1];

        if (!currentFrame || !expectedKinds.includes(currentFrame.kind)) {
            return undefined;
        }

        state.frameStack.pop();
        currentFrame.symbol.range = new vscode.Range(
            currentFrame.symbol.range.start,
            statement.range.end,
        );

        return currentFrame.symbol;
    }

    private mapSymbolKindToContainerKind(symbol: PbSymbol): PbContainerKind | undefined {
        if (symbol.kind === 'structure') {
            return 'structure';
        }

        if (symbol.kind === 'type') {
            return symbol.containerKind === 'file-object'
                ? 'file-object'
                : 'type';
        }

        if (symbol.kind === 'function' || symbol.kind === 'global-function') {
            return 'function';
        }

        if (symbol.kind === 'subroutine') {
            return 'subroutine';
        }

        if (symbol.kind === 'event') {
            return 'event';
        }

        return undefined;
    }

    private createParameterSymbols(
        uri: vscode.Uri,
        statement: PowerScriptDocumentStatement,
        parameters: string,
        callableSymbol: PbSymbol,
        state: ParserState,
    ): PbSymbol[] {
        if (!parameters.trim()) {
            return [];
        }

        const declarations = this.extractParameterDeclarations(statement.text);

        return declarations.map(declaration => this.createMemberSymbol({
            name: declaration.name,
            kind: 'variable',
            uri,
            statement,
            parent: callableSymbol.name,
            detail: declaration.detail,
            containerName: callableSymbol.name,
            containerKind: this.getCallableContainerKind(callableSymbol),
            containerSignature: callableSymbol.signature,
            fileObjectName: state.rootImplementationActive
                ? state.rootObjectName
                : undefined,
            declarationScope: 'parameter',
            isPrototype: false,
            implementationKind: 'implementation',
            nameStartOffset: declaration.nameStartOffset,
            nameEndOffset: declaration.nameEndOffset,
        }));
    }

    private extractParameterDeclarations(statementText: string): Array<{
        name: string;
        detail?: string;
        nameStartOffset: number;
        nameEndOffset: number;
    }> {
        const openParenIndex = statementText.indexOf('(');
        const closeParenIndex = statementText.lastIndexOf(')');

        if (openParenIndex < 0 || closeParenIndex <= openParenIndex) {
            return [];
        }

        const segment = statementText.slice(openParenIndex + 1, closeParenIndex);
        const declarations: Array<{
            name: string;
            detail?: string;
            nameStartOffset: number;
            nameEndOffset: number;
        }> = [];

        let partStart = 0;

        for (let index = 0; index <= segment.length; index++) {
            const atBoundary = index === segment.length || segment[index] === ',';

            if (!atBoundary) {
                continue;
            }

            const rawPart = segment.slice(partStart, index);
            const leadingWhitespaceLength = rawPart.length - rawPart.trimStart().length;
            const trimmedPart = rawPart.trim();

            if (trimmedPart) {
                const nameMatch = trimmedPart.match(
                    new RegExp(`(${IDENTIFIER_SOURCE})(?:\s*\[\s*\])?\s*$`, 'i'),
                );

                if (nameMatch) {
                    const name = nameMatch[1];
                    const relativeTrimmedStart = partStart + leadingWhitespaceLength;
                    const nameIndexInTrimmedPart = trimmedPart.toLowerCase().lastIndexOf(name.toLowerCase());

                    if (nameIndexInTrimmedPart >= 0) {
                        const beforeName = trimmedPart.slice(0, nameIndexInTrimmedPart);
                        const afterName = trimmedPart.slice(nameIndexInTrimmedPart + name.length);
                        const detail = this.normalizeType(`${beforeName} ${afterName}`.replace(/\[\s*\]/g, '[]'));

                        declarations.push({
                            name,
                            detail: detail || undefined,
                            nameStartOffset: openParenIndex + 1 + relativeTrimmedStart + nameIndexInTrimmedPart,
                            nameEndOffset: openParenIndex + 1 + relativeTrimmedStart + nameIndexInTrimmedPart + name.length,
                        });
                    }
                }
            }

            partStart = index + 1;
        }

        return declarations;
    }

    private findNameOffset(
        statementText: string,
        symbolName: string,
        preferLastOccurrence = false,
    ): number {
        const lowerStatement = statementText.toLowerCase();
        const lowerName = symbolName.toLowerCase();

        const index = preferLastOccurrence
            ? lowerStatement.lastIndexOf(lowerName)
            : lowerStatement.indexOf(lowerName);

        return index >= 0 ? index : 0;
    }
}