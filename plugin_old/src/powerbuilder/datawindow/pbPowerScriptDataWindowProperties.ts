import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig } from '../../core/config/extensionConfiguration';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { SymbolIndex } from '../indexing/symbolIndex';
import {
    buildDataWindowSqlSemantics,
} from './pbDataWindowSqlSemantics';
import { PbDataWindowParser } from './pbDataWindowParser';
import {
    resolvePowerScriptDataWindowChildDataObjectNameForOwner,
    resolveVerifiedDataWindowChildLinks,
    VerifiedDataWindowChildLink,
} from './pbPowerScriptDataWindowChildren';
import {
    collectMatchingDataWindowCandidates,
    findDataWindowObjectSelectionRange,
    PowerScriptDataWindowCandidateCache,
    PowerScriptDataWindowLinkCandidate,
    resolveLocalDataObjectNameForOwnerType,
    selectPreferredPowerScriptDataWindowCandidate,
} from './pbPowerScriptDataWindowLinks';

type PowerScriptDataWindowPropertyFailureReason =
    | 'unverifiable-owner'
    | 'missing-dataobject'
    | 'missing-target'
    | 'ambiguous-target';

type KnownDataWindowPropertyKey = 'datawindow.dataobject' | 'datawindow.table.select' | 'dddw.name';

interface KnownDataWindowPropertySpec {
    key: KnownDataWindowPropertyKey;
    path: string;
    detail: string;
    documentation: string;
    modifySnippet?: string;
}

export interface PowerScriptDataWindowPropertyLiteral {
    methodName: 'describe' | 'modify';
    propertyPath: string;
    ownerName: string;
    ownerExpression?: string;
    range: vscode.Range;
    propertyRange: vscode.Range;
}

interface PowerScriptDataWindowPropertyAnalysis {
    literal: PowerScriptDataWindowPropertyLiteral;
    dataObjectName?: string;
    candidates?: readonly PowerScriptDataWindowLinkCandidate[];
    candidate?: PowerScriptDataWindowLinkCandidate;
    targetCandidate?: PowerScriptDataWindowLinkCandidate;
    child?: VerifiedDataWindowChildLink;
    childChain?: readonly VerifiedDataWindowChildLink[];
    property?: KnownDataWindowPropertySpec;
    reason?: PowerScriptDataWindowPropertyFailureReason;
}

interface ResolvedKnownDataWindowProperty {
    property: KnownDataWindowPropertySpec;
    targetCandidate: PowerScriptDataWindowLinkCandidate;
    childChain?: readonly VerifiedDataWindowChildLink[];
}

export interface PowerScriptDataWindowPropertyCompletionContext {
    literal: PowerScriptDataWindowPropertyLiteral;
    candidate?: PowerScriptDataWindowLinkCandidate;
    properties?: readonly KnownDataWindowPropertySpec[];
    reason?: PowerScriptDataWindowPropertyFailureReason;
}

const KNOWN_DATAWINDOW_PROPERTIES: readonly KnownDataWindowPropertySpec[] = [
    {
        key: 'datawindow.dataobject',
        path: 'DataWindow.DataObject',
        detail: 'Propiedad DataWindow conocida',
        documentation: 'Expone el DataObject actualmente enlazado al control DataWindow.',
        modifySnippet: "DataWindow.DataObject='${1}'",
    },
    {
        key: 'datawindow.table.select',
        path: 'DataWindow.Table.Select',
        detail: 'Modstring DataWindow conocida',
        documentation: 'Expone o modifica el retrieve SQL seguro del DataWindow enlazado.',
        modifySnippet: "DataWindow.Table.Select='${1}'",
    },
    {
        key: 'dddw.name',
        path: 'dddw.name',
        detail: 'Propiedad DropDownDataWindow conocida',
        documentation: 'Expone o modifica el DataObject enlazado por una DropDownDataWindow verificada.',
        modifySnippet: "dddw.name='${1}'",
    },
];

const DATAWINDOW_PROPERTY_METHODS = new Set(['describe', 'modify']);
const MAX_NESTED_DATAWINDOW_PROPERTY_DEPTH = 4;

export async function providePowerScriptDataWindowPropertyDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const analysis = await analyzePowerScriptDataWindowPropertyAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        false,
    );

    if (!analysis?.targetCandidate || !analysis.property) {
        return undefined;
    }

    const definitionRange = resolvePropertyDefinitionRange(analysis, parser);

    return definitionRange
        ? [new vscode.Location(analysis.targetCandidate.uri, definitionRange)]
        : undefined;
}

export async function providePowerScriptDataWindowPropertyHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Hover | undefined> {
    const analysis = await analyzePowerScriptDataWindowPropertyAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        false,
    );

    if (!analysis?.targetCandidate || !analysis.property) {
        return undefined;
    }

    const fileName = path.basename(analysis.targetCandidate.uri.fsPath || analysis.targetCandidate.uri.path);
    const sqlSemantics = buildDataWindowSqlSemantics(analysis.targetCandidate.document, parser);
    const markdownParts = [
        `**${analysis.property.path}**`,
        `Propiedad DataWindow enlazada desde \`${analysis.literal.methodName}\`()`,
        analysis.child
            ? `Parent DataWindow: \`${analysis.candidate?.parseResult.metadata.objectName}\``
            : undefined,
        analysis.childChain && analysis.childChain.length > 1
            ? `Ruta verificada: \`${analysis.childChain.map(child => child.childName).join(' > ')}\``
            : undefined,
        analysis.child
            ? `Child verificado: \`${analysis.child.childName}\` (${analysis.child.kind === 'report' ? 'report' : 'dropdown'})`
            : undefined,
        `DataWindow: \`${analysis.targetCandidate.parseResult.metadata.objectName}\``,
        `Archivo: \`${fileName}\``,
        analysis.property.key === 'datawindow.dataobject' || analysis.property.key === 'dddw.name'
            ? `DataObject actual: \`${analysis.targetCandidate.parseResult.metadata.objectName}\``
            : undefined,
        analysis.property.key === 'datawindow.table.select' && sqlSemantics.retrieveNode && analysis.targetCandidate.parseResult.metadata.retrieveStatement
            ? ['```sql', analysis.targetCandidate.parseResult.metadata.retrieveStatement, '```'].join('\n')
            : undefined,
        analysis.property.documentation,
    ].filter((value): value is string => !!value);

    return new vscode.Hover(
        new vscode.MarkdownString(markdownParts.join('\n\n')),
        analysis.literal.propertyRange,
    );
}

export async function resolvePowerScriptDataWindowPropertyCompletionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PowerScriptDataWindowPropertyCompletionContext | undefined> {
    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();
    const analysis = await analyzePowerScriptDataWindowPropertyAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        true,
        candidateCache,
    );

    if (!analysis) {
        return undefined;
    }

    return {
        literal: analysis.literal,
        candidate: analysis.candidate,
        properties: analysis.candidate
            ? await collectKnownDataWindowPropertySuggestions(
                document.uri,
                analysis.candidate,
                analysis.literal.propertyPath,
                parser,
                snapshotStore,
                candidateCache,
            )
            : undefined,
        reason: analysis.reason,
    };
}

async function analyzePowerScriptDataWindowPropertyAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    allowEmptyPropertyPath: boolean,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<PowerScriptDataWindowPropertyAnalysis | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataWindowPropertyLiteralAtPosition(
        document,
        position,
        allowEmptyPropertyPath,
    );

    if (!literal) {
        return undefined;
    }

    let dataObjectName = resolveLocalDataObjectNameForOwnerType(
        document,
        position,
        literal,
        index,
    );

    if (!dataObjectName) {
        dataObjectName = await resolvePowerScriptDataWindowChildDataObjectNameForOwner(
            document,
            position,
            literal.ownerName,
            literal.ownerExpression,
            index,
            parser,
            snapshotStore,
        );
    }

    if (!dataObjectName) {
        return {
            literal,
            reason: findLocalOwnerTypeName(document, position.line, literal.ownerName)
                ? 'missing-dataobject'
                : 'unverifiable-owner',
        };
    }

    const candidates = await collectMatchingDataWindowCandidates(
        dataObjectName,
        parser,
        snapshotStore,
        candidateCache,
    );
    const candidate = selectPreferredPowerScriptDataWindowCandidate(document.uri, candidates);

    if (!candidate) {
        return {
            literal,
            dataObjectName,
            candidates,
            reason: candidates.length === 0 ? 'missing-target' : 'ambiguous-target',
        };
    }

    const resolvedProperty = await resolveKnownDataWindowPropertyAtPath(
        document.uri,
        candidate,
        literal.propertyPath,
        parser,
        snapshotStore,
        candidateCache,
    );

    return {
        literal,
        dataObjectName,
        candidates,
        candidate,
        targetCandidate: resolvedProperty?.targetCandidate,
        child: resolvedProperty?.childChain?.[resolvedProperty.childChain.length - 1],
        childChain: resolvedProperty?.childChain,
        property: resolvedProperty?.property,
    };
}

function resolvePropertyDefinitionRange(
    analysis: Pick<PowerScriptDataWindowPropertyAnalysis, 'targetCandidate' | 'property'>,
    parser: PbDataWindowParser,
): vscode.Range | undefined {
    if (!analysis.targetCandidate || !analysis.property) {
        return undefined;
    }

    switch (analysis.property.key) {
        case 'datawindow.dataobject':
        case 'dddw.name':
            return findDataWindowObjectSelectionRange(
                analysis.targetCandidate.document,
                analysis.targetCandidate.parseResult.metadata.objectName,
            );
        case 'datawindow.table.select': {
            const sqlSemantics = buildDataWindowSqlSemantics(analysis.targetCandidate.document, parser);
            return sqlSemantics.retrieveNode?.selectionRange;
        }
        default:
            return undefined;
    }
}

export function findPowerScriptDataWindowPropertyLiteralAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    allowEmptyPropertyPath: boolean,
): PowerScriptDataWindowPropertyLiteral | undefined {
    const lineText = document.lineAt(position.line).text;
    const literalRange = findQuotedLiteralRangeAtPosition(lineText, position.line, position);

    if (!literalRange) {
        return undefined;
    }

    const invocation = findDataWindowPropertyInvocationAtLiteral(lineText, literalRange.start.character);

    if (!invocation) {
        return undefined;
    }

    const literalText = lineText.slice(literalRange.start.character, literalRange.end.character);
    const propertyPath = extractPropertyPath(literalText, invocation.methodName);

    if (!allowEmptyPropertyPath && !propertyPath) {
        return undefined;
    }

    const trimmedPrefixLength = literalText.match(/^\s*/)?.[0].length ?? 0;
    const propertyRange = new vscode.Range(
        literalRange.start.line,
        literalRange.start.character + trimmedPrefixLength,
        literalRange.end.line,
        literalRange.start.character + trimmedPrefixLength + propertyPath.length,
    );

    if (!allowEmptyPropertyPath && !propertyRange.contains(position)) {
        return undefined;
    }

    return {
        methodName: invocation.methodName,
        propertyPath,
        ownerName: invocation.ownerName,
        ownerExpression: invocation.ownerExpression,
        range: literalRange,
        propertyRange,
    };
}

export function findPowerScriptDataWindowPropertyLiteralOccurrences(
    document: vscode.TextDocument,
): PowerScriptDataWindowPropertyLiteral[] {
    const literals: PowerScriptDataWindowPropertyLiteral[] = [];

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        for (const range of findQuotedLiteralRanges(lineText, line)) {
            const literal = findPowerScriptDataWindowPropertyLiteralAtPosition(
                document,
                range.start,
                false,
            );

            if (literal) {
                literals.push(literal);
            }
        }
    }

    return literals;
}

function findDataWindowPropertyInvocationAtLiteral(
    lineText: string,
    literalStartCharacter: number,
): {
    methodName: 'describe' | 'modify';
    ownerName: string;
    ownerExpression?: string;
} | undefined {
    const openParenOffset = findEnclosingOpenParenBeforeOffset(lineText, literalStartCharacter - 2);

    if (openParenOffset === undefined) {
        return undefined;
    }

    const argumentIndex = countTopLevelArgumentsBeforeOffset(
        lineText,
        openParenOffset + 1,
        Math.max(openParenOffset + 1, literalStartCharacter - 1),
    );

    if (argumentIndex !== 0) {
        return undefined;
    }

    const invocationSource = lineText.slice(0, openParenOffset).trimEnd();
    const invocationMatch = invocationSource.match(/((?:[a-zA-Z_$#%][\w$#%`-]*\s*\.\s*)*)([a-zA-Z_$#%][\w$#%`-]*)\s*\.\s*([a-zA-Z_$#%][\w$#%`-]*)$/i);

    if (!invocationMatch?.[2] || !invocationMatch[3]) {
        return undefined;
    }

    const ownerPrefix = invocationMatch[1] ?? '';
    const ownerName = invocationMatch[2];
    const methodName = invocationMatch[3].toLowerCase() as 'describe' | 'modify';

    if (!DATAWINDOW_PROPERTY_METHODS.has(methodName)) {
        return undefined;
    }

    const ownerExpression = `${ownerPrefix}${ownerName}`
        .replace(/\s+/g, '')
        .replace(/\.$/, '');

    return {
        methodName,
        ownerName,
        ownerExpression: ownerExpression.includes('.') ? ownerExpression : undefined,
    };
}

function extractPropertyPath(
    literalText: string,
    methodName: 'describe' | 'modify',
): string {
    const trimmed = literalText.trim();

    if (methodName === 'describe') {
        return trimmed;
    }

    const equalsOffset = trimmed.indexOf('=');

    return (equalsOffset >= 0 ? trimmed.slice(0, equalsOffset) : trimmed).trim();
}

function resolveKnownDataWindowProperty(
    propertyPath: string,
): KnownDataWindowPropertySpec | undefined {
    const normalizedPropertyPath = propertyPath.trim().toLowerCase();

    return KNOWN_DATAWINDOW_PROPERTIES.find(property => property.key === normalizedPropertyPath);
}

async function resolveKnownDataWindowPropertyAtPath(
    sourceUri: vscode.Uri,
    candidate: PowerScriptDataWindowLinkCandidate,
    propertyPath: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
    resolvedPrefix = '',
    childChain: readonly VerifiedDataWindowChildLink[] = [],
    depth = 0,
): Promise<ResolvedKnownDataWindowProperty | undefined> {
    const ownerProperty = resolveKnownDataWindowProperty(propertyPath);

    if (ownerProperty && ownerProperty.key !== 'dddw.name') {
        return {
            property: buildResolvedKnownDataWindowProperty(
                ownerProperty,
                joinResolvedDataWindowPropertyPath(resolvedPrefix, ownerProperty.path),
            ),
            targetCandidate: candidate,
            childChain,
        };
    }

    const childScope = parseChildScopedPropertyPath(propertyPath);

    if (!childScope) {
        return undefined;
    }

    const childLinks = await resolveVerifiedDataWindowChildLinks(
        sourceUri,
        candidate,
        parser,
        snapshotStore,
        candidateCache,
    );
    const child = childLinks.find(link => link.childName.toLowerCase() === childScope.childName.toLowerCase());

    if (!child) {
        return undefined;
    }

    const nextPrefix = joinResolvedDataWindowPropertyPath(resolvedPrefix, child.childName);
    const nextChildChain = [...childChain, child];

    if (childScope.propertyPath === 'dddw.name') {
        const dropdownProperty = child.kind === 'dropdown-datawindow'
            ? resolveKnownDataWindowProperty('dddw.name')
            : undefined;

        if (!dropdownProperty) {
            return undefined;
        }

        return {
            property: buildResolvedKnownDataWindowProperty(
                dropdownProperty,
                joinResolvedDataWindowPropertyPath(nextPrefix, dropdownProperty.path),
            ),
            targetCandidate: child.childCandidate,
            childChain: nextChildChain,
        };
    }

    if (depth >= MAX_NESTED_DATAWINDOW_PROPERTY_DEPTH) {
        return undefined;
    }

    return resolveKnownDataWindowPropertyAtPath(
        sourceUri,
        child.childCandidate,
        childScope.propertyPath,
        parser,
        snapshotStore,
        candidateCache,
        nextPrefix,
        nextChildChain,
        depth + 1,
    );
}

async function collectKnownDataWindowPropertySuggestions(
    sourceUri: vscode.Uri,
    candidate: PowerScriptDataWindowLinkCandidate,
    propertyPathPrefix: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<readonly KnownDataWindowPropertySpec[]> {
    const normalizedPrefix = propertyPathPrefix.trim().toLowerCase();
    const suggestions = new Map<string, KnownDataWindowPropertySpec>();

    await collectKnownDataWindowPropertySuggestionsAtCandidate(
        suggestions,
        sourceUri,
        candidate,
        normalizedPrefix,
        parser,
        snapshotStore,
        candidateCache,
        '',
        0,
        new Set([candidate.uri.toString()]),
    );

    return Array.from(suggestions.values())
        .sort((left, right) => left.path.localeCompare(right.path));
}

async function collectKnownDataWindowPropertySuggestionsAtCandidate(
    suggestions: Map<string, KnownDataWindowPropertySpec>,
    sourceUri: vscode.Uri,
    candidate: PowerScriptDataWindowLinkCandidate,
    normalizedPrefix: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache,
    resolvedPrefix: string,
    depth: number,
    visitedCandidates: ReadonlySet<string>,
): Promise<void> {
    for (const property of KNOWN_DATAWINDOW_PROPERTIES) {
        if (property.key === 'dddw.name') {
            continue;
        }

        const resolvedProperty = buildResolvedKnownDataWindowProperty(
            property,
            joinResolvedDataWindowPropertyPath(resolvedPrefix, property.path),
        );

        if (matchesKnownDataWindowPropertyPrefix(resolvedProperty.path, normalizedPrefix)) {
            suggestions.set(resolvedProperty.path.toLowerCase(), resolvedProperty);
        }
    }

    if (depth >= MAX_NESTED_DATAWINDOW_PROPERTY_DEPTH) {
        return;
    }

    const childLinks = await resolveVerifiedDataWindowChildLinks(
        sourceUri,
        candidate,
        parser,
        snapshotStore,
        candidateCache,
    );

    for (const child of childLinks) {
        const childPrefix = joinResolvedDataWindowPropertyPath(resolvedPrefix, child.childName);

        if (child.kind === 'dropdown-datawindow') {
            const dropdownProperty = resolveKnownDataWindowProperty('dddw.name');

            if (dropdownProperty) {
                const resolvedDropdownProperty = buildResolvedKnownDataWindowProperty(
                    dropdownProperty,
                    joinResolvedDataWindowPropertyPath(childPrefix, dropdownProperty.path),
                );

                if (matchesKnownDataWindowPropertyPrefix(resolvedDropdownProperty.path, normalizedPrefix)) {
                    suggestions.set(
                        resolvedDropdownProperty.path.toLowerCase(),
                        resolvedDropdownProperty,
                    );
                }
            }
        }

        const childCandidateKey = child.childCandidate.uri.toString();

        if (visitedCandidates.has(childCandidateKey)) {
            continue;
        }

        await collectKnownDataWindowPropertySuggestionsAtCandidate(
            suggestions,
            sourceUri,
            child.childCandidate,
            normalizedPrefix,
            parser,
            snapshotStore,
            candidateCache,
            childPrefix,
            depth + 1,
            new Set([...visitedCandidates, childCandidateKey]),
        );
    }
}

function buildResolvedKnownDataWindowProperty(
    property: KnownDataWindowPropertySpec,
    resolvedPath: string = property.path,
): KnownDataWindowPropertySpec {
    return {
        ...property,
        path: resolvedPath,
        modifySnippet: property.modifySnippet
            ? property.modifySnippet.replace(property.path, resolvedPath)
            : undefined,
    };
}

function joinResolvedDataWindowPropertyPath(
    prefix: string,
    propertyPath: string,
): string {
    const trimmedPrefix = prefix.trim();
    const trimmedPropertyPath = propertyPath.trim();

    if (!trimmedPrefix) {
        return trimmedPropertyPath;
    }

    if (!trimmedPropertyPath) {
        return trimmedPrefix;
    }

    return `${trimmedPrefix}.${trimmedPropertyPath}`;
}

function matchesKnownDataWindowPropertyPrefix(
    propertyPath: string,
    normalizedPrefix: string,
): boolean {
    return !normalizedPrefix || propertyPath.toLowerCase().startsWith(normalizedPrefix);
}

function parseChildScopedPropertyPath(
    propertyPath: string,
): { childName: string; propertyPath: string } | undefined {
    const trimmedPath = propertyPath.trim();
    const separatorOffset = trimmedPath.indexOf('.');

    if (separatorOffset <= 0 || separatorOffset >= trimmedPath.length - 1) {
        return undefined;
    }

    const childName = trimmedPath.slice(0, separatorOffset).trim();
    const nestedPropertyPath = trimmedPath.slice(separatorOffset + 1).trim();

    if (!childName || !nestedPropertyPath || childName.toLowerCase() === 'datawindow') {
        return undefined;
    }

    return {
        childName,
        propertyPath: nestedPropertyPath.toLowerCase(),
    };
}

function findLocalOwnerTypeName(
    document: vscode.TextDocument,
    currentLine: number,
    ownerName: string,
): string | undefined {
    const normalizedOwnerName = ownerName.trim().toLowerCase();
    let insideCallableBlock = false;

    for (let lineIndex = 0; lineIndex <= currentLine && lineIndex < document.lineCount; lineIndex++) {
        const lineText = document.lineAt(lineIndex).text.trim();

        if (!lineText) {
            continue;
        }

        if (/^end\s+(event|function|subroutine|on)\b/i.test(lineText)) {
            insideCallableBlock = false;
            continue;
        }

        if (insideCallableBlock) {
            continue;
        }

        if (/^(event|function|subroutine|on)\b/i.test(lineText)) {
            insideCallableBlock = true;
            continue;
        }

        if (/^(global\s+)?type\b/i.test(lineText)) {
            continue;
        }

        const declarationMatch = lineText.match(/^([a-zA-Z_$#%][\w$#%`-]*(?:\s*\[\s*\])?)\s+([a-zA-Z_$#%][\w$#%`-]*)\b/i);

        if (!declarationMatch?.[1] || !declarationMatch[2]) {
            continue;
        }

        if (declarationMatch[2].toLowerCase() !== normalizedOwnerName) {
            continue;
        }

        return declarationMatch[1].replace(/\s*\[\s*\]$/, '');
    }

    return undefined;
}

function findQuotedLiteralRangeAtPosition(
    lineText: string,
    line: number,
    position: vscode.Position,
): vscode.Range | undefined {
    return findQuotedLiteralRanges(lineText, line).find(range => range.contains(position));
}

function findQuotedLiteralRanges(
    lineText: string,
    line: number,
): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    let delimiter: '"' | '\'' | undefined;
    let literalStart = -1;

    for (let index = 0; index < lineText.length; index++) {
        const character = lineText[index];

        if (!delimiter) {
            if (character === '"' || character === '\'') {
                delimiter = character;
                literalStart = index + 1;
            }

            continue;
        }

        if (character === '~') {
            index++;
            continue;
        }

        if (character !== delimiter) {
            continue;
        }

        ranges.push(new vscode.Range(line, literalStart, line, index));
        delimiter = undefined;
        literalStart = -1;
    }

    return ranges;
}

function findEnclosingOpenParenBeforeOffset(
    text: string,
    offset: number,
): number | undefined {
    let depth = 0;
    let delimiter: '"' | '\'' | undefined;

    for (let index = offset; index >= 0; index--) {
        const character = text[index];

        if (delimiter) {
            if (character === delimiter) {
                delimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            delimiter = character;
            continue;
        }

        if (character === ')') {
            depth++;
            continue;
        }

        if (character === '(') {
            if (depth === 0) {
                return index;
            }

            depth--;
        }
    }

    return undefined;
}

function countTopLevelArgumentsBeforeOffset(
    text: string,
    startOffset: number,
    endOffset: number,
): number {
    let depth = 0;
    let delimiter: '"' | '\'' | undefined;
    let argumentIndex = 0;

    for (let index = startOffset; index < endOffset; index++) {
        const character = text[index];

        if (delimiter) {
            if (character === '~') {
                index++;
                continue;
            }

            if (character === delimiter) {
                delimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            delimiter = character;
            continue;
        }

        if (character === '(') {
            depth++;
            continue;
        }

        if (character === ')') {
            if (depth > 0) {
                depth--;
            }
            continue;
        }

        if (character === ',' && depth === 0) {
            argumentIndex++;
        }
    }

    return argumentIndex;
}