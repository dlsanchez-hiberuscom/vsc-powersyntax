import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig } from '../../core/config/extensionConfiguration';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { PB_DIAGNOSTIC_CODES } from '../constants/pbDiagnosticMessages';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbDiagnosticInfo } from '../models/pbDiagnostic';
import { resolveOwnerTypeNamesAtPosition } from '../semantic/binding/systemMemberBinding';
import { PbDataWindowParseResult, PbDataWindowParser } from './pbDataWindowParser';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';
import { resolvePowerScriptDataWindowChildDataObjectNameForOwner } from './pbPowerScriptDataWindowChildren';

export interface PowerScriptDataObjectLiteral {
    value: string;
    range: vscode.Range;
}

export interface PowerScriptDataWindowLinkCandidate {
    uri: vscode.Uri;
    document: vscode.TextDocument;
    parseResult: PbDataWindowParseResult;
}

type PowerScriptDataWindowTargetFailureReason = 'missing-target' | 'ambiguous-target';
type PowerScriptDataWindowColumnFailureReason =
    | 'unverifiable-owner'
    | 'missing-dataobject'
    | PowerScriptDataWindowTargetFailureReason
    | 'unknown-column';

export type DataWindowNode = NonNullable<PbDataWindowParseResult['root']['children']>[number];

interface ResolvedPowerScriptDataWindowLink {
    literal: PowerScriptDataObjectLiteral;
    candidate: PowerScriptDataWindowLinkCandidate;
}

export interface PowerScriptDataWindowColumnLiteral {
    columnName: string;
    methodName: string;
    ownerName: string;
    ownerExpression?: string;
    range: vscode.Range;
}

export interface PowerScriptDataWindowColumnCompletionContext {
    literal: PowerScriptDataWindowColumnLiteral;
    dataObjectName?: string;
    candidates?: readonly PowerScriptDataWindowLinkCandidate[];
    candidate?: PowerScriptDataWindowLinkCandidate;
    columns?: readonly DataWindowNode[];
    reason?: Exclude<PowerScriptDataWindowColumnFailureReason, 'unknown-column'>;
}

interface PowerScriptDataObjectLinkAnalysis {
    literal: PowerScriptDataObjectLiteral;
    candidates: readonly PowerScriptDataWindowLinkCandidate[];
    candidate?: PowerScriptDataWindowLinkCandidate;
    reason?: PowerScriptDataWindowTargetFailureReason;
}

export interface PowerScriptDataWindowColumnLinkAnalysis {
    literal: PowerScriptDataWindowColumnLiteral;
    dataObjectName?: string;
    candidates?: readonly PowerScriptDataWindowLinkCandidate[];
    candidate?: PowerScriptDataWindowLinkCandidate;
    columnNode?: DataWindowNode;
    reason?: PowerScriptDataWindowColumnFailureReason;
}

export type PowerScriptDataWindowCandidateCache = Map<string, Promise<PowerScriptDataWindowLinkCandidate[]>>;

const DATAWINDOW_COLUMN_ARGUMENT_METHODS = new Set([
    'getitemdate',
    'getitemdatetime',
    'getitemdecimal',
    'getitemnumber',
    'getitemstatus',
    'getitemstring',
    'getitemtime',
    'setitem',
    'setitemstatus',
]);

export function findPowerScriptDataObjectLiteralAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): PowerScriptDataObjectLiteral | undefined {
    const lineText = document.lineAt(position.line).text;
    const quotedRange = findQuotedLiteralRangeAtPosition(lineText, position.line, position);

    if (!quotedRange) {
        return undefined;
    }

    const prefix = lineText.slice(0, Math.max(0, quotedRange.start.character - 1));

    if (!/\bdataobject\b\s*=\s*$/i.test(prefix.trimEnd())) {
        return undefined;
    }

    const value = lineText.slice(quotedRange.start.character, quotedRange.end.character);

    if (!value.trim()) {
        return undefined;
    }

    return {
        value,
        range: quotedRange,
    };
}

export function selectPreferredPowerScriptDataWindowCandidate(
    sourceUri: vscode.Uri,
    candidates: readonly PowerScriptDataWindowLinkCandidate[],
    projectRegistry: PowerBuilderProjectRegistry = PowerBuilderProjectRegistry.getInstance(),
): PowerScriptDataWindowLinkCandidate | undefined {
    const uniqueCandidates = dedupeCandidates(candidates);

    if (uniqueCandidates.length === 0) {
        return undefined;
    }

    const preferredProject = projectRegistry.getPreferredProjectForSourceFile(sourceUri);
    const scopedCandidates = preferredProject
        ? uniqueCandidates.filter(candidate => projectRegistry.isSourceFileInProject(candidate.uri, preferredProject))
        : [];

    if (scopedCandidates.length === 1) {
        return scopedCandidates[0];
    }

    if (scopedCandidates.length > 1) {
        return undefined;
    }

    return uniqueCandidates.length === 1
        ? uniqueCandidates[0]
        : undefined;
}

export async function providePowerScriptDataWindowDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const link = await resolvePowerScriptDataWindowLinkAtPosition(
        document,
        position,
        parser,
        snapshotStore,
    );

    if (!link) {
        return undefined;
    }

    return [new vscode.Location(
        link.candidate.uri,
        findDataWindowObjectSelectionRange(
            link.candidate.document,
            link.candidate.parseResult.metadata.objectName,
        ),
    )];
}

export async function providePowerScriptDataWindowHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Hover | undefined> {
    const link = await resolvePowerScriptDataWindowLinkAtPosition(
        document,
        position,
        parser,
        snapshotStore,
    );

    if (!link) {
        return undefined;
    }

    const metadata = link.candidate.parseResult.metadata;
    const fileName = path.basename(link.candidate.uri.fsPath || link.candidate.uri.path);
    const markdownParts = [
        `**${metadata.objectName}**`,
        'DataWindow enlazada desde script',
        `Archivo: \`${fileName}\``,
        metadata.bandNames.length > 0
            ? `Bandas: ${metadata.bandNames.map(name => `\`${name}\``).join(', ')}`
            : undefined,
        metadata.tableColumnNames.length > 0
            ? `Columnas de tabla: ${metadata.tableColumnNames.map(name => `\`${name}\``).join(', ')}`
            : undefined,
        metadata.retrieveStatement
            ? ['```sql', metadata.retrieveStatement, '```'].join('\n')
            : undefined,
    ].filter((value): value is string => !!value);

    return new vscode.Hover(
        new vscode.MarkdownString(markdownParts.join('\n\n')),
        link.literal.range,
    );
}

export async function providePowerScriptDataWindowColumnDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const columnLink = await resolvePowerScriptDataWindowColumnLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!columnLink) {
        return undefined;
    }

    return [new vscode.Location(
        columnLink.candidate.uri,
        columnLink.columnNode.selectionRange,
    )];
}

export async function providePowerScriptDataWindowColumnHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Hover | undefined> {
    const columnLink = await resolvePowerScriptDataWindowColumnLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!columnLink) {
        return undefined;
    }

    const lineText = columnLink.candidate.document.lineAt(columnLink.columnNode.selectionRange.start.line).text;
    const remoteName = parser.extractAttribute(lineText, 'dbname');
    const type = parser.extractAttribute(lineText, 'type');
    const isUpdatable = parser.extractAttribute(lineText, 'update');
    const fileName = path.basename(columnLink.candidate.uri.fsPath || columnLink.candidate.uri.path);
    const markdownParts = [
        `**${columnLink.columnNode.name}**`,
        `Columna DataWindow enlazada desde \`${columnLink.literal.methodName}\`()`,
        `DataWindow: \`${columnLink.candidate.parseResult.metadata.objectName}\``,
        `Archivo: \`${fileName}\``,
        type ? `Tipo: \`${type}\`` : undefined,
        remoteName ? `Mapeo remoto: \`${remoteName}\`` : undefined,
        isUpdatable ? `Update: \`${isUpdatable}\`` : undefined,
    ].filter((value): value is string => !!value);

    return new vscode.Hover(
        new vscode.MarkdownString(markdownParts.join('\n\n')),
        columnLink.literal.range,
    );
}

export async function analyzePowerScriptDataWindowLinkDiagnostics(
    document: vscode.TextDocument,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PbDiagnosticInfo[]> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return [];
    }

    const diagnostics: PbDiagnosticInfo[] = [];
    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        for (const literalRange of findQuotedLiteralRanges(lineText, line)) {
            const probeCharacter = Math.min(
                literalRange.start.character,
                Math.max(literalRange.start.character, literalRange.end.character - 1),
            );
            const probePosition = new vscode.Position(line, probeCharacter);
            const dataObjectLiteral = findPowerScriptDataObjectLiteralAtPosition(document, probePosition);

            if (dataObjectLiteral) {
                const analysis = await analyzePowerScriptDataObjectLinkAtPosition(
                    document,
                    probePosition,
                    parser,
                    snapshotStore,
                    candidateCache,
                );

                if (analysis?.reason) {
                    diagnostics.push(buildDataObjectDiagnostic(analysis));
                }

                continue;
            }

            const columnLiteral = findPowerScriptDataWindowColumnLiteralAtPosition(document, probePosition);

            if (!columnLiteral) {
                continue;
            }

            const analysis = await analyzePowerScriptDataWindowColumnLinkAtPosition(
                document,
                probePosition,
                index,
                parser,
                snapshotStore,
                candidateCache,
            );

            if (analysis?.reason !== 'unknown-column') {
                continue;
            }

            diagnostics.push(buildUnknownColumnDiagnostic(analysis));
        }
    }

    return diagnostics;
}

export async function resolvePowerScriptDataWindowColumnCompletionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PowerScriptDataWindowColumnCompletionContext | undefined> {
    return analyzePowerScriptDataWindowColumnCompletionAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );
}

async function resolvePowerScriptDataWindowLinkAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<ResolvedPowerScriptDataWindowLink | undefined> {
    const analysis = await analyzePowerScriptDataObjectLinkAtPosition(
        document,
        position,
        parser,
        snapshotStore,
    );

    if (!analysis?.candidate) {
        return undefined;
    }

    return {
        literal: analysis.literal,
        candidate: analysis.candidate,
    };
}

export async function resolvePowerScriptDataWindowColumnLinkAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<{
    literal: PowerScriptDataWindowColumnLiteral;
    candidate: PowerScriptDataWindowLinkCandidate;
    columnNode: DataWindowNode;
} | undefined> {
    const analysis = await analyzePowerScriptDataWindowColumnLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!analysis?.candidate || !analysis.columnNode) {
        return undefined;
    }

    return {
        literal: analysis.literal,
        candidate: analysis.candidate,
        columnNode: analysis.columnNode,
    };
}

async function analyzePowerScriptDataObjectLinkAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataObjectLinkAnalysis | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataObjectLiteralAtPosition(document, position);

    if (!literal) {
        return undefined;
    }

    return analyzePowerScriptDataObjectLinkByLiteral(
        document.uri,
        literal,
        parser,
        snapshotStore,
        candidateCache,
    );
}

async function analyzePowerScriptDataObjectLinkByLiteral(
    sourceUri: vscode.Uri,
    literal: PowerScriptDataObjectLiteral,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataObjectLinkAnalysis> {
    const candidates = await collectMatchingDataWindowCandidates(
        literal.value,
        parser,
        snapshotStore,
        candidateCache,
    );
    const candidate = selectPreferredPowerScriptDataWindowCandidate(sourceUri, candidates);

    return {
        literal,
        candidates,
        candidate,
        reason: candidate
            ? undefined
            : candidates.length === 0
                ? 'missing-target'
                : 'ambiguous-target',
    };
}

export async function analyzePowerScriptDataWindowColumnLinkAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataWindowColumnLinkAnalysis | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataWindowColumnLiteralAtPosition(document, position);

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
            reason: candidates.length === 0
                ? 'missing-target'
                : 'ambiguous-target',
        };
    }

    const columnNode = findLinkedTableColumnNode(candidate.parseResult, literal.columnName);

    if (!columnNode) {
        return {
            literal,
            dataObjectName,
            candidates,
            candidate,
            reason: 'unknown-column',
        };
    }

    return {
        literal,
        dataObjectName,
        candidates,
        candidate,
        columnNode,
    };
}

async function resolvePreferredDataWindowCandidateByObjectName(
    sourceUri: vscode.Uri,
    dataObjectName: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataWindowLinkCandidate | undefined> {
    const candidates = await collectMatchingDataWindowCandidates(
        dataObjectName,
        parser,
        snapshotStore,
        candidateCache,
    );

    return selectPreferredPowerScriptDataWindowCandidate(sourceUri, candidates);
}

export async function collectMatchingDataWindowCandidates(
    dataObjectName: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataWindowLinkCandidate[]> {
    const normalizedName = dataObjectName.trim().toLowerCase();

    if (!normalizedName) {
        return [];
    }

    const cached = candidateCache?.get(normalizedName);

    if (cached) {
        return cached;
    }

    const computation = (async (): Promise<PowerScriptDataWindowLinkCandidate[]> => {
        const uris = await vscode.workspace.findFiles('**/*.srd');
        const candidates: PowerScriptDataWindowLinkCandidate[] = [];

        for (const uri of uris) {
            const candidateDocument = await snapshotStore.getSnapshot(uri);

            if (!candidateDocument) {
                continue;
            }

            const parseResult = parser.parseDocument(candidateDocument);
            const normalizedObjectName = parseResult.metadata.objectName.trim().toLowerCase();
            const normalizedFileName = path.basename(uri.fsPath || uri.path).replace(/\.srd$/i, '').toLowerCase();

            if (
                normalizedObjectName !== normalizedName &&
                normalizedFileName !== normalizedName
            ) {
                continue;
            }

            candidates.push({ uri, document: candidateDocument, parseResult });
        }

        return candidates;
    })();

    candidateCache?.set(normalizedName, computation);

    return computation;
}

function dedupeCandidates(
    candidates: readonly PowerScriptDataWindowLinkCandidate[],
): PowerScriptDataWindowLinkCandidate[] {
    const deduped = new Map<string, PowerScriptDataWindowLinkCandidate>();

    for (const candidate of candidates) {
        deduped.set(candidate.uri.toString(), candidate);
    }

    return Array.from(deduped.values());
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

        const literalRange = new vscode.Range(
            line,
            literalStart,
            line,
            index,
        );

        ranges.push(literalRange);

        delimiter = undefined;
        literalStart = -1;
    }

    return ranges;
}

export function findDataWindowObjectSelectionRange(
    document: vscode.TextDocument,
    objectName: string,
): vscode.Range {
    const headerText = document.lineAt(0).text;
    const headerMatch = headerText.match(/^\$PBExportHeader\$(.+?)\.srd$/i);
    const headerObjectName = headerMatch?.[1] ?? objectName;
    const startCharacter = headerText.toLowerCase().indexOf(headerObjectName.toLowerCase());

    if (startCharacter >= 0) {
        return new vscode.Range(
            0,
            startCharacter,
            0,
            startCharacter + headerObjectName.length,
        );
    }

    return new vscode.Range(0, 0, 0, Math.max(objectName.length, 1));
}

export function findPowerScriptDataWindowColumnLiteralAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): PowerScriptDataWindowColumnLiteral | undefined {
    return findPowerScriptDataWindowColumnLiteralAtPositionInternal(
        document,
        position,
        false,
    );
}

function findPowerScriptDataWindowColumnLiteralAtPositionInternal(
    document: vscode.TextDocument,
    position: vscode.Position,
    allowEmptyColumnName: boolean,
): PowerScriptDataWindowColumnLiteral | undefined {
    const lineText = document.lineAt(position.line).text;
    const literalRange = findQuotedLiteralRangeAtPosition(lineText, position.line, position);

    if (!literalRange) {
        return undefined;
    }

    const invocation = findDataWindowColumnInvocationAtLiteral(lineText, literalRange.start.character);

    if (!invocation) {
        return undefined;
    }

    const columnName = lineText.slice(literalRange.start.character, literalRange.end.character).trim();

    if (!allowEmptyColumnName && !columnName) {
        return undefined;
    }

    return {
        columnName,
        methodName: invocation.methodName,
        ownerName: invocation.ownerName,
        ownerExpression: invocation.ownerExpression,
        range: literalRange,
    };
}

export function findPowerScriptDataWindowColumnLiteralOccurrences(
    document: vscode.TextDocument,
): PowerScriptDataWindowColumnLiteral[] {
    const literals: PowerScriptDataWindowColumnLiteral[] = [];

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        for (const range of findQuotedLiteralRanges(lineText, line)) {
            const literal = findPowerScriptDataWindowColumnLiteralAtPosition(
                document,
                range.start,
            );

            if (literal) {
                literals.push(literal);
            }
        }
    }

    return literals;
}

function findDataWindowColumnInvocationAtLiteral(
    lineText: string,
    literalStartCharacter: number,
): {
    methodName: string;
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

    if (argumentIndex !== 1) {
        return undefined;
    }

    const invocationSource = lineText.slice(0, openParenOffset).trimEnd();
    const invocationMatch = invocationSource.match(/((?:[a-zA-Z_$#%][\w$#%`-]*\s*\.\s*)*)([a-zA-Z_$#%][\w$#%`-]*)\s*\.\s*([a-zA-Z_$#%][\w$#%`-]*)$/i);

    if (!invocationMatch?.[2] || !invocationMatch[3]) {
        return undefined;
    }

    const ownerPrefix = invocationMatch[1] ?? '';
    const ownerName = invocationMatch[2];
    const methodName = invocationMatch[3];

    if (!DATAWINDOW_COLUMN_ARGUMENT_METHODS.has(methodName.toLowerCase())) {
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

export function resolveLocalDataObjectNameForOwnerType(
    document: vscode.TextDocument,
    position: vscode.Position,
    literal: { ownerName: string; ownerExpression?: string },
    index: SymbolIndex,
): string | undefined {
    const localOwnerTypeName = findLocalOwnerTypeName(document, position.line, literal.ownerName);
    const ownerTypeNames = localOwnerTypeName
        ? [localOwnerTypeName]
        : resolveOwnerTypeNamesAtPosition({
            index,
            uri: document.uri,
            position,
            context: {
                qualifiedOwner: literal.ownerName,
                qualifiedOwnerExpression: literal.ownerExpression,
                qualifier: '.',
            },
        });

    if (ownerTypeNames.length === 0) {
        return undefined;
    }

    return findLocalDataObjectNameForTypeNames(document, ownerTypeNames);
}

async function analyzePowerScriptDataWindowColumnCompletionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache?: PowerScriptDataWindowCandidateCache,
): Promise<PowerScriptDataWindowColumnCompletionContext | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataWindowColumnLiteralAtPositionInternal(
        document,
        position,
        true,
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
            reason: candidates.length === 0
                ? 'missing-target'
                : 'ambiguous-target',
        };
    }

    return {
        literal,
        dataObjectName,
        candidates,
        candidate,
        columns: findTableColumnNodes(candidate.parseResult),
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

function findLocalDataObjectNameForTypeNames(
    document: vscode.TextDocument,
    ownerTypeNames: readonly string[],
): string | undefined {
    const normalizedTypeNames = new Set(ownerTypeNames.map(typeName => typeName.trim().toLowerCase()));

    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const lineText = document.lineAt(lineIndex).text;
        const typeMatch = lineText.match(/^\s*type\s+([a-zA-Z_$#%][\w$#%`-]*)\s+from\s+datawindow\s+within\b/i);

        if (!typeMatch?.[1] || !normalizedTypeNames.has(typeMatch[1].toLowerCase())) {
            continue;
        }

        for (let bodyLineIndex = lineIndex + 1; bodyLineIndex < document.lineCount; bodyLineIndex++) {
            const bodyLineText = document.lineAt(bodyLineIndex).text;

            if (/^\s*end\s+type\b/i.test(bodyLineText)) {
                break;
            }

            const dataObjectMatch = bodyLineText.match(/\bdataobject\b\s*=\s*["']([^"']+)["']/i);

            if (dataObjectMatch?.[1]) {
                return dataObjectMatch[1].trim();
            }
        }
    }

    return undefined;
}

function findLinkedTableColumnNode(
    parseResult: PbDataWindowParseResult,
    columnName: string,
) {
    return findTableColumnNodes(parseResult).find(node =>
        node.name.toLowerCase() === columnName.trim().toLowerCase(),
    );
}

function findTableColumnNodes(
    parseResult: PbDataWindowParseResult,
): DataWindowNode[] {
    const tableNode = (parseResult.root.children ?? []).find(node => node.kind === 'table');

    return (tableNode?.children ?? []).filter(node => node.kind === 'table-column');
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
    let argumentIndex = 0;
    let delimiter: '"' | '\'' | undefined;

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

        if (character === '(' || character === '[') {
            depth++;
            continue;
        }

        if (character === ')' || character === ']') {
            depth = Math.max(0, depth - 1);
            continue;
        }

        if (character === ',' && depth === 0) {
            argumentIndex++;
        }
    }

    return argumentIndex;
}

function buildDataObjectDiagnostic(
    analysis: PowerScriptDataObjectLinkAnalysis,
): PbDiagnosticInfo {
    const isAmbiguous = analysis.reason === 'ambiguous-target';
    const suffix = isAmbiguous
        ? 'coincide con varios painters .srd'
        : 'no resuelve ningun painter .srd verificable';

    return {
        message: `El DataObject "${analysis.literal.value}" ${suffix}; el enlace script↔pintor se retira por seguridad.`,
        range: analysis.literal.range,
        severity: vscode.DiagnosticSeverity.Information,
        code: PB_DIAGNOSTIC_CODES.DATAWINDOW_SCRIPT_DATAOBJECT_NO_UNIQUE_TARGET,
    };
}

function buildUnknownColumnDiagnostic(
    analysis: PowerScriptDataWindowColumnLinkAnalysis,
): PbDiagnosticInfo {
    const dataWindowName = analysis.candidate?.parseResult.metadata.objectName ?? analysis.dataObjectName ?? 'DataWindow';

    return {
        message:
            `La columna "${analysis.literal.columnName}" no existe en la DataWindow "${dataWindowName}" enlazada desde ${analysis.literal.methodName}().`,
        range: analysis.literal.range,
        severity: vscode.DiagnosticSeverity.Warning,
        code: PB_DIAGNOSTIC_CODES.DATAWINDOW_SCRIPT_UNKNOWN_COLUMN,
    };
}