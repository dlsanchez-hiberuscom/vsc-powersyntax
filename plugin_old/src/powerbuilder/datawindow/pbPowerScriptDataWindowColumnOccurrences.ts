import * as vscode from 'vscode';
import { PB_IDE_SAFE_FILE_EXTENSIONS } from '../../core/config/constants';
import { getConfig } from '../../core/config/extensionConfiguration';
import { isDataWindowUri } from '../../core/utils/powerBuilderFileUtils';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { isValidPbIdentifierName } from '../grammar/pbIdentifier';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbDataWindowNode, PbDataWindowParser } from './pbDataWindowParser';
import {
    buildDataWindowSqlSemantics,
    findDataWindowSqlColumnAtPosition,
    findLinkedTableColumnNode as findLinkedSqlTableColumnNode,
} from './pbDataWindowSqlSemantics';
import {
    findPowerScriptDataWindowChildLiteralAtPosition,
    findPowerScriptDataWindowChildLiteralOccurrences,
    resolvePowerScriptDataWindowChildCompletionAtPosition,
} from './pbPowerScriptDataWindowChildren';
import {
    analyzePowerScriptDataWindowColumnLinkAtPosition,
    DataWindowNode,
    findPowerScriptDataWindowColumnLiteralOccurrences,
    PowerScriptDataWindowCandidateCache,
    PowerScriptDataWindowColumnLinkAnalysis,
    PowerScriptDataWindowLinkCandidate,
} from './pbPowerScriptDataWindowLinks';
import {
    findPowerScriptDataWindowPropertyLiteralAtPosition,
    findPowerScriptDataWindowPropertyLiteralOccurrences,
    resolvePowerScriptDataWindowPropertyCompletionAtPosition,
} from './pbPowerScriptDataWindowProperties';

interface DataWindowLinkedColumnTarget {
    sourceKind: 'script-literal' | 'table-column' | 'retrieve-reference';
    range: vscode.Range;
    placeholder: string;
    candidate: PowerScriptDataWindowLinkCandidate;
    columnNode: DataWindowNode;
}

interface PowerScriptDataWindowColumnTargetResolution {
    target?: DataWindowLinkedColumnTarget;
    blockedReason?: string;
}

export interface PowerScriptDataWindowColumnRenameTarget {
    canRename: boolean;
    range?: vscode.Range;
    placeholder?: string;
    reason?: string;
}

export async function providePowerScriptDataWindowColumnReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    includeDeclaration: boolean,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const resolution = await resolveLinkedColumnTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        true,
    );

    if (!resolution.target) {
        return resolution.blockedReason ? [] : undefined;
    }

    const scriptLocations = await collectLinkedScriptLiteralLocations(
        resolution.target.candidate,
        resolution.target.columnNode.name,
        index,
        parser,
        snapshotStore,
    );
    const painterLocations = collectPainterReferenceLocations(
        resolution.target.candidate,
        resolution.target.columnNode,
        includeDeclaration,
        parser,
    );

    return dedupeLocations([
        ...scriptLocations,
        ...painterLocations,
    ]);
}

export async function preparePowerScriptDataWindowColumnRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PowerScriptDataWindowColumnRenameTarget | undefined> {
    const resolution = await resolveLinkedColumnTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        false,
    );

    if (!resolution.target) {
        return resolution.blockedReason
            ? {
                canRename: false,
                reason: resolution.blockedReason,
            }
            : undefined;
    }

    if (resolution.target.sourceKind === 'retrieve-reference') {
        return {
            canRename: false,
            reason: 'El rename solo se publica desde el literal enlazado de script o desde la declaración segura table-column.',
        };
    }

    return {
        canRename: true,
        range: resolution.target.range,
        placeholder: resolution.target.placeholder,
    };
}

export async function providePowerScriptDataWindowColumnRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.WorkspaceEdit | undefined> {
    const trimmedNewName = newName.trim();

    if (!trimmedNewName || !isValidPbIdentifierName(trimmedNewName)) {
        return undefined;
    }

    const resolution = await resolveLinkedColumnTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
        false,
    );

    if (!resolution.target || resolution.target.sourceKind === 'retrieve-reference') {
        return undefined;
    }

    const scriptLocations = await collectLinkedScriptLiteralLocations(
        resolution.target.candidate,
        resolution.target.columnNode.name,
        index,
        parser,
        snapshotStore,
    );
    const painterRanges = collectSafePainterRenameRanges(
        resolution.target.candidate.document,
        resolution.target.columnNode,
        parser,
    );
    const edit = new vscode.WorkspaceEdit();

    for (const location of scriptLocations) {
        edit.replace(location.uri, location.range, trimmedNewName);
    }

    for (const range of painterRanges) {
        edit.replace(resolution.target.candidate.uri, range, trimmedNewName);
    }

    return edit;
}

async function resolveLinkedColumnTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    allowRetrieveReference: boolean,
): Promise<PowerScriptDataWindowColumnTargetResolution> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return {};
    }

    if (!isDataWindowUri(document.uri)) {
        return resolveScriptLinkedColumnTargetAtPosition(
            document,
            position,
            index,
            parser,
            snapshotStore,
        );
    }

    const candidate = createDataWindowCandidate(document, parser);
    const tableColumn = findTableColumnNodeAtPosition(candidate, position);

    if (tableColumn) {
        return {
            target: {
                sourceKind: 'table-column',
                range: tableColumn.selectionRange,
                placeholder: tableColumn.name,
                candidate,
                columnNode: tableColumn,
            },
        };
    }

    if (!allowRetrieveReference) {
        return {};
    }

    const sqlSemantics = buildDataWindowSqlSemantics(document, parser);
    const reference = findDataWindowSqlColumnAtPosition(sqlSemantics, position);
    const linkedColumn = reference
        ? findLinkedSqlTableColumnNode(sqlSemantics, reference)
        : undefined;

    return linkedColumn && reference
        ? {
            target: {
                sourceKind: 'retrieve-reference',
                range: reference.range,
                placeholder: linkedColumn.name,
                candidate,
                columnNode: linkedColumn,
            },
        }
        : {};
}

async function resolveScriptLinkedColumnTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<PowerScriptDataWindowColumnTargetResolution> {
    const analysis = await analyzePowerScriptDataWindowColumnLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!analysis) {
        const childTarget = await resolveScriptLinkedChildColumnTargetAtPosition(
            document,
            position,
            index,
            parser,
            snapshotStore,
        );

        return childTarget
            ? { target: childTarget }
            : {};
    }

    if (!analysis.candidate || !analysis.columnNode) {
        const childTarget = await resolveScriptLinkedChildColumnTargetAtPosition(
            document,
            position,
            index,
            parser,
            snapshotStore,
        );

        if (childTarget) {
            return { target: childTarget };
        }

        return {
            blockedReason: buildColumnLinkBlockedReason(analysis),
        };
    }

    return {
        target: {
            sourceKind: 'script-literal',
            range: analysis.literal.range,
            placeholder: analysis.literal.columnName,
            candidate: analysis.candidate,
            columnNode: analysis.columnNode,
        },
    };
}

async function resolveScriptLinkedChildColumnTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<DataWindowLinkedColumnTarget | undefined> {
    const childLiteral = findPowerScriptDataWindowChildLiteralAtPosition(document, position, false);

    if (childLiteral) {
        const childContext = await resolvePowerScriptDataWindowChildCompletionAtPosition(
            document,
            position,
            index,
            parser,
            snapshotStore,
        );
        const childLink = childContext?.children?.find(child =>
            child.kind === 'dropdown-datawindow' &&
            child.childName.toLowerCase() === childLiteral.childName.toLowerCase(),
        );
        const columnNode = childContext?.candidate
            ? findTableColumnNodeByName(childContext.candidate, childLiteral.childName)
            : undefined;

        if (childContext?.candidate && childLink && columnNode) {
            return {
                sourceKind: 'script-literal',
                range: childLiteral.range,
                placeholder: childLiteral.childName,
                candidate: childContext.candidate,
                columnNode,
            };
        }
    }

    const propertyLiteral = findPowerScriptDataWindowPropertyLiteralAtPosition(document, position, false);

    if (!propertyLiteral) {
        return undefined;
    }

    const childScope = parseChildScopedPropertyPath(propertyLiteral.propertyPath);

    if (!childScope) {
        return undefined;
    }

    const propertyContext = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (
        !propertyContext?.candidate ||
        !propertyContext.properties?.some(property => property.path.toLowerCase() === propertyLiteral.propertyPath.trim().toLowerCase())
    ) {
        return undefined;
    }

    const columnNode = findTableColumnNodeByName(propertyContext.candidate, childScope.childName);

    if (!columnNode) {
        return undefined;
    }

    return {
        sourceKind: 'script-literal',
        range: buildChildNamePropertyRange(propertyLiteral.propertyRange, childScope.childName),
        placeholder: childScope.childName,
        candidate: propertyContext.candidate,
        columnNode,
    };
}

async function collectLinkedScriptLiteralLocations(
    targetCandidate: PowerScriptDataWindowLinkCandidate,
    columnName: string,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<vscode.Location[]> {
    const uris = await vscode.workspace.findFiles(buildIdeSafePowerBuilderGlob());
    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();
    const locations: vscode.Location[] = [];

    for (const uri of uris) {
        if (isDataWindowUri(uri)) {
            continue;
        }

        const document = await snapshotStore.getSnapshot(uri);

        if (!document) {
            continue;
        }

        for (const literal of findPowerScriptDataWindowColumnLiteralOccurrences(document)) {
            const analysis = await analyzePowerScriptDataWindowColumnLinkAtPosition(
                document,
                literal.range.start,
                index,
                parser,
                snapshotStore,
                candidateCache,
            );

            if (
                !analysis?.candidate ||
                !analysis.columnNode ||
                analysis.candidate.uri.toString() !== targetCandidate.uri.toString() ||
                analysis.columnNode.name.toLowerCase() !== columnName.toLowerCase()
            ) {
                continue;
            }

            locations.push(new vscode.Location(document.uri, analysis.literal.range));
        }

        for (const literal of findPowerScriptDataWindowChildLiteralOccurrences(document)) {
            if (literal.childName.toLowerCase() !== columnName.toLowerCase()) {
                continue;
            }

            const childContext = await resolvePowerScriptDataWindowChildCompletionAtPosition(
                document,
                literal.range.start,
                index,
                parser,
                snapshotStore,
            );

            if (
                childContext?.candidate?.uri.toString() !== targetCandidate.uri.toString() ||
                !childContext.children?.some(child =>
                    child.kind === 'dropdown-datawindow' &&
                    child.childName.toLowerCase() === columnName.toLowerCase(),
                )
            ) {
                continue;
            }

            locations.push(new vscode.Location(document.uri, literal.range));
        }

        for (const literal of findPowerScriptDataWindowPropertyLiteralOccurrences(document)) {
            const childScope = parseChildScopedPropertyPath(literal.propertyPath);

            if (!childScope || childScope.childName.toLowerCase() !== columnName.toLowerCase()) {
                continue;
            }

            const propertyContext = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(
                document,
                literal.propertyRange.start,
                index,
                parser,
                snapshotStore,
            );

            if (
                propertyContext?.candidate?.uri.toString() !== targetCandidate.uri.toString() ||
                !propertyContext.properties?.some(property => property.path.toLowerCase() === literal.propertyPath.trim().toLowerCase())
            ) {
                continue;
            }

            locations.push(new vscode.Location(
                document.uri,
                buildChildNamePropertyRange(literal.propertyRange, childScope.childName),
            ));
        }
    }

    return locations;
}

function collectPainterReferenceLocations(
    candidate: PowerScriptDataWindowLinkCandidate,
    columnNode: PbDataWindowNode,
    includeDeclaration: boolean,
    parser: PbDataWindowParser,
): vscode.Location[] {
    const semantics = buildDataWindowSqlSemantics(candidate.document, parser);
    const locations: vscode.Location[] = includeDeclaration
        ? [new vscode.Location(candidate.uri, columnNode.selectionRange)]
        : [];

    for (const reference of semantics.selectColumnReferences) {
        const linkedColumn = findLinkedSqlTableColumnNode(semantics, reference);

        if (linkedColumn?.name.toLowerCase() !== columnNode.name.toLowerCase()) {
            continue;
        }

        locations.push(new vscode.Location(candidate.uri, reference.range));
    }

    return locations;
}

function collectSafePainterRenameRanges(
    document: vscode.TextDocument,
    columnNode: PbDataWindowNode,
    parser: PbDataWindowParser,
): vscode.Range[] {
    const normalizedColumnName = columnNode.name.toLowerCase();
    const semantics = buildDataWindowSqlSemantics(document, parser);
    const ranges = [columnNode.selectionRange];

    for (const reference of semantics.selectColumnReferences) {
        const linkedColumn = findLinkedSqlTableColumnNode(semantics, reference);

        if (
            linkedColumn?.name.toLowerCase() !== normalizedColumnName ||
            reference.qualifiedTableName ||
            reference.rawText.trim().toLowerCase() !== normalizedColumnName
        ) {
            continue;
        }

        ranges.push(reference.range);
    }

    return dedupeRanges(ranges);
}

function createDataWindowCandidate(
    document: vscode.TextDocument,
    parser: PbDataWindowParser,
): PowerScriptDataWindowLinkCandidate {
    return {
        uri: document.uri,
        document,
        parseResult: parser.parseDocument(document),
    };
}

function findTableColumnNodeAtPosition(
    candidate: PowerScriptDataWindowLinkCandidate,
    position: vscode.Position,
): PbDataWindowNode | undefined {
    return (candidate.parseResult.root.children ?? [])
        .find(node => node.kind === 'table')
        ?.children?.find(node =>
            node.kind === 'table-column' &&
            node.selectionRange.contains(position),
        );
}

function findTableColumnNodeByName(
    candidate: PowerScriptDataWindowLinkCandidate,
    columnName: string,
): PbDataWindowNode | undefined {
    const normalizedColumnName = columnName.trim().toLowerCase();

    return (candidate.parseResult.root.children ?? [])
        .find(node => node.kind === 'table')
        ?.children?.find(node =>
            node.kind === 'table-column' &&
            node.name.toLowerCase() === normalizedColumnName,
        );
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

function buildChildNamePropertyRange(
    propertyRange: vscode.Range,
    childName: string,
): vscode.Range {
    return new vscode.Range(
        propertyRange.start.line,
        propertyRange.start.character,
        propertyRange.start.line,
        propertyRange.start.character + childName.length,
    );
}

function buildColumnLinkBlockedReason(
    analysis: PowerScriptDataWindowColumnLinkAnalysis,
): string {
    switch (analysis.reason) {
        case 'ambiguous-target':
            return 'El literal enlazado no se puede renombrar porque el DataWindow objetivo sigue ambiguo.';
        case 'missing-target':
            return 'El literal enlazado no se puede renombrar porque no se encontró un DataWindow objetivo verificable.';
        case 'unknown-column':
            return 'El literal enlazado no se puede renombrar porque la columna no existe en el DataWindow objetivo.';
        case 'missing-dataobject':
            return 'El literal enlazado no se puede renombrar porque no se pudo demostrar el DataObject asociado.';
        case 'unverifiable-owner':
            return 'El literal enlazado no se puede renombrar porque el owner DataWindow no es verificable con evidencia fuerte.';
        default:
            return 'El literal enlazado no se puede renombrar con seguridad.';
    }
}

function buildIdeSafePowerBuilderGlob(): string {
    const extensions = PB_IDE_SAFE_FILE_EXTENSIONS
        .map(extension => extension.replace(/^\./, ''))
        .join(',');

    return `**/*.{${extensions}}`;
}

function dedupeLocations(
    locations: readonly vscode.Location[],
): vscode.Location[] {
    const deduped = new Map<string, vscode.Location>();

    for (const location of locations) {
        deduped.set(
            `${location.uri.toString()}:${location.range.start.line}:${location.range.start.character}:${location.range.end.line}:${location.range.end.character}`,
            location,
        );
    }

    return Array.from(deduped.values());
}

function dedupeRanges(
    ranges: readonly vscode.Range[],
): vscode.Range[] {
    const deduped = new Map<string, vscode.Range>();

    for (const range of ranges) {
        deduped.set(
            `${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}`,
            range,
        );
    }

    return Array.from(deduped.values());
}