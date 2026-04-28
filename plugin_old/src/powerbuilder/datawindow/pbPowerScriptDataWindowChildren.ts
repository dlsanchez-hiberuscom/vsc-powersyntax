import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig } from '../../core/config/extensionConfiguration';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { SymbolIndex } from '../indexing/symbolIndex';
import { resolveOwnerTypeNamesAtPosition } from '../semantic/binding/systemMemberBinding';
import { PbDataWindowParseResult, PbDataWindowParser } from './pbDataWindowParser';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';

type PowerScriptDataWindowTargetFailureReason = 'missing-target' | 'ambiguous-target';
type PowerScriptDataWindowChildFailureReason =
    | 'unverifiable-owner'
    | 'missing-dataobject'
    | PowerScriptDataWindowTargetFailureReason
    | 'unknown-child';

interface PowerScriptDataWindowLinkCandidate {
    uri: vscode.Uri;
    document: vscode.TextDocument;
    parseResult: PbDataWindowParseResult;
}

type PowerScriptDataWindowCandidateCache = Map<string, Promise<PowerScriptDataWindowLinkCandidate[]>>;

interface PowerScriptDataWindowChildLiteral {
    childName: string;
    ownerName: string;
    ownerExpression?: string;
    range: vscode.Range;
}

export interface VerifiedDataWindowChildLink {
    childName: string;
    dataObjectName: string;
    childCandidate: PowerScriptDataWindowLinkCandidate;
    kind: 'dropdown-datawindow' | 'report';
}

interface PowerScriptDataWindowChildLinkAnalysis {
    literal: PowerScriptDataWindowChildLiteral;
    dataObjectName?: string;
    candidates?: readonly PowerScriptDataWindowLinkCandidate[];
    candidate?: PowerScriptDataWindowLinkCandidate;
    child?: VerifiedDataWindowChildLink;
    reason?: PowerScriptDataWindowChildFailureReason;
}

export interface PowerScriptDataWindowChildCompletionContext {
    literal: PowerScriptDataWindowChildLiteral;
    candidate?: PowerScriptDataWindowLinkCandidate;
    children?: readonly VerifiedDataWindowChildLink[];
    reason?: Exclude<PowerScriptDataWindowChildFailureReason, 'unknown-child'>;
}

export async function providePowerScriptDataWindowChildDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const analysis = await analyzePowerScriptDataWindowChildLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    return analysis?.child
        ? [new vscode.Location(
            analysis.child.childCandidate.uri,
            findDataWindowObjectSelectionRange(
                analysis.child.childCandidate.document,
                analysis.child.childCandidate.parseResult.metadata.objectName,
            ),
        )]
        : undefined;
}

export async function providePowerScriptDataWindowChildHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Hover | undefined> {
    const analysis = await analyzePowerScriptDataWindowChildLinkAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!analysis?.child || !analysis.candidate) {
        return undefined;
    }

    const childFileName = path.basename(
        analysis.child.childCandidate.uri.fsPath || analysis.child.childCandidate.uri.path,
    );
    const markdownParts = [
        `**${analysis.child.childName}**`,
        `Child DataWindow enlazado desde \`GetChild\`()`,
        `Parent DataWindow: \`${analysis.candidate.parseResult.metadata.objectName}\``,
        `Child DataObject: \`${analysis.child.childCandidate.parseResult.metadata.objectName}\``,
        `Archivo: \`${childFileName}\``,
        analysis.child.kind === 'report'
            ? 'Fuente: report control del painter'
            : 'Fuente: columna DropDownDataWindow del painter',
    ];

    return new vscode.Hover(
        new vscode.MarkdownString(markdownParts.join('\n\n')),
        analysis.literal.range,
    );
}

export async function resolvePowerScriptDataWindowChildCompletionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PowerScriptDataWindowChildCompletionContext | undefined> {
    const analysis = await analyzePowerScriptDataWindowChildCompletionAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!analysis) {
        return undefined;
    }

    return {
        literal: analysis.literal,
        candidate: analysis.candidate,
        children: analysis.candidate
            ? await resolveVerifiedDataWindowChildLinks(
                document.uri,
                analysis.candidate,
                parser,
                snapshotStore,
            )
            : undefined,
        reason: analysis.reason as Exclude<PowerScriptDataWindowChildFailureReason, 'unknown-child'> | undefined,
    };
}

export async function resolvePowerScriptDataWindowChildDataObjectNameForOwner(
    document: vscode.TextDocument,
    position: vscode.Position,
    ownerName: string,
    ownerExpression: string | undefined,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<string | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const localOwnerTypeName = findLocalOwnerTypeName(document, position.line, ownerName);

    if (!localOwnerTypeName || localOwnerTypeName.trim().toLowerCase() !== 'datawindowchild') {
        return undefined;
    }

    const binding = findPreviousGetChildBinding(
        document,
        position.line,
        ownerName,
    );

    if (!binding) {
        return undefined;
    }

    const parentDataObjectName = resolveLocalDataObjectNameForOwnerType(
        document,
        new vscode.Position(binding.line, 0),
        {
            ownerName: binding.parentOwnerName,
            ownerExpression: binding.parentOwnerExpression,
        },
        index,
    );

    if (!parentDataObjectName) {
        return undefined;
    }

    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();
    const parentCandidate = await resolvePreferredDataWindowCandidateByObjectName(
        document.uri,
        parentDataObjectName,
        parser,
        snapshotStore,
        candidateCache,
    );

    if (!parentCandidate) {
        return undefined;
    }

    const child = await resolveVerifiedDataWindowChildLinkByName(
        document.uri,
        parentCandidate,
        binding.childName,
        parser,
        snapshotStore,
        candidateCache,
    );

    return child?.dataObjectName;
}

async function analyzePowerScriptDataWindowChildLinkAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<PowerScriptDataWindowChildLinkAnalysis | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataWindowChildLiteralAtPosition(document, position, false);

    if (!literal) {
        return undefined;
    }

    const dataObjectName = resolveLocalDataObjectNameForOwnerType(
        document,
        position,
        literal,
        index,
    );

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

    const child = await resolveVerifiedDataWindowChildLinkByName(
        document.uri,
        candidate,
        literal.childName,
        parser,
        snapshotStore,
        candidateCache,
    );

    return child
        ? {
            literal,
            dataObjectName,
            candidates,
            candidate,
            child,
        }
        : {
            literal,
            dataObjectName,
            candidates,
            candidate,
            reason: 'unknown-child',
        };
}

async function analyzePowerScriptDataWindowChildCompletionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<PowerScriptDataWindowChildLinkAnalysis | undefined> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return undefined;
    }

    const literal = findPowerScriptDataWindowChildLiteralAtPosition(document, position, true);

    if (!literal) {
        return undefined;
    }

    const dataObjectName = resolveLocalDataObjectNameForOwnerType(
        document,
        position,
        literal,
        index,
    );

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

    return candidate
        ? {
            literal,
            dataObjectName,
            candidates,
            candidate,
        }
        : {
            literal,
            dataObjectName,
            candidates,
            reason: candidates.length === 0 ? 'missing-target' : 'ambiguous-target',
        };
}

async function resolveVerifiedDataWindowChildLinkByName(
    sourceUri: vscode.Uri,
    parentCandidate: PowerScriptDataWindowLinkCandidate,
    childName: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<VerifiedDataWindowChildLink | undefined> {
    const childLinks = await resolveVerifiedDataWindowChildLinks(
        sourceUri,
        parentCandidate,
        parser,
        snapshotStore,
        candidateCache,
    );

    return childLinks.find(link => link.childName.toLowerCase() === childName.trim().toLowerCase());
}

export async function resolveVerifiedDataWindowChildLinks(
    sourceUri: vscode.Uri,
    parentCandidate: PowerScriptDataWindowLinkCandidate,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<VerifiedDataWindowChildLink[]> {
    const rawLinks = findRawDataWindowChildLinks(parentCandidate);
    const resolved: VerifiedDataWindowChildLink[] = [];

    for (const rawLink of rawLinks) {
        const childCandidates = await collectMatchingDataWindowCandidates(
            rawLink.dataObjectName,
            parser,
            snapshotStore,
            candidateCache,
        );
        const childCandidate = selectPreferredPowerScriptDataWindowCandidate(sourceUri, childCandidates);

        if (!childCandidate) {
            continue;
        }

        resolved.push({
            ...rawLink,
            childCandidate,
        });
    }

    return dedupeChildLinks(resolved);
}

function findRawDataWindowChildLinks(
    candidate: PowerScriptDataWindowLinkCandidate,
): Array<{
    childName: string;
    dataObjectName: string;
    kind: 'dropdown-datawindow' | 'report';
}> {
    const links: Array<{
        childName: string;
        dataObjectName: string;
        kind: 'dropdown-datawindow' | 'report';
    }> = [];
    const tableColumnNames = new Set(candidate.parseResult.metadata.tableColumnNames.map(name => name.toLowerCase()));

    for (let lineIndex = 0; lineIndex < candidate.document.lineCount; lineIndex++) {
        const lineText = candidate.document.lineAt(lineIndex).text;
        const columnName = extractAttributeValue(lineText, 'name');
        const dddwName = extractAttributeValue(lineText, 'dddw.name');

        if (
            columnName &&
            dddwName &&
            tableColumnNames.has(columnName.toLowerCase())
        ) {
            links.push({
                childName: columnName,
                dataObjectName: dddwName,
                kind: 'dropdown-datawindow',
            });
        }

        if (!/^\s*report\(/i.test(lineText)) {
            continue;
        }

        const reportName = extractAttributeValue(lineText, 'name');
        const reportDataObject = extractAttributeValue(lineText, 'dataobject');

        if (!reportName || !reportDataObject) {
            continue;
        }

        links.push({
            childName: reportName,
            dataObjectName: reportDataObject,
            kind: 'report',
        });
    }

    return links;
}

export function findPowerScriptDataWindowChildLiteralAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    allowEmptyChildName: boolean,
): PowerScriptDataWindowChildLiteral | undefined {
    const lineText = document.lineAt(position.line).text;
    const literalRange = findQuotedLiteralRangeAtPosition(lineText, position.line, position);

    if (!literalRange) {
        return undefined;
    }

    const invocation = findDataWindowChildInvocationAtLiteral(lineText, literalRange.start.character);

    if (!invocation) {
        return undefined;
    }

    const childName = lineText.slice(literalRange.start.character, literalRange.end.character).trim();

    if (!allowEmptyChildName && !childName) {
        return undefined;
    }

    return {
        childName,
        ownerName: invocation.ownerName,
        ownerExpression: invocation.ownerExpression,
        range: literalRange,
    };
}

export function findPowerScriptDataWindowChildLiteralOccurrences(
    document: vscode.TextDocument,
): PowerScriptDataWindowChildLiteral[] {
    const literals: PowerScriptDataWindowChildLiteral[] = [];

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        for (const range of findQuotedLiteralRanges(lineText, line)) {
            const literal = findPowerScriptDataWindowChildLiteralAtPosition(
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

function findDataWindowChildInvocationAtLiteral(
    lineText: string,
    literalStartCharacter: number,
): {
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

    if (!invocationMatch?.[2] || !invocationMatch[3] || invocationMatch[3].toLowerCase() !== 'getchild') {
        return undefined;
    }

    const ownerPrefix = invocationMatch[1] ?? '';
    const ownerName = invocationMatch[2];
    const ownerExpression = `${ownerPrefix}${ownerName}`
        .replace(/\s+/g, '')
        .replace(/\.$/, '');

    return {
        ownerName,
        ownerExpression: ownerExpression.includes('.') ? ownerExpression : undefined,
    };
}

function findPreviousGetChildBinding(
    document: vscode.TextDocument,
    currentLine: number,
    targetVariableName: string,
): {
    line: number;
    parentOwnerName: string;
    parentOwnerExpression?: string;
    childName: string;
} | undefined {
    const normalizedVariableName = targetVariableName.trim().toLowerCase();

    for (let lineIndex = currentLine; lineIndex >= 0; lineIndex--) {
        const lineText = document.lineAt(lineIndex).text.trim();

        if (/^(public|private|protected)?\s*(event|function|subroutine|on)\b/i.test(lineText)) {
            break;
        }

        const match = lineText.match(/((?:[a-zA-Z_$#%][\w$#%`-]*\s*\.\s*)*)([a-zA-Z_$#%][\w$#%`-]*)\s*\.\s*GetChild\s*\(\s*["']([^"']+)["']\s*,\s*([a-zA-Z_$#%][\w$#%`-]*)\s*\)/i);

        if (!match?.[2] || !match[3] || !match[4] || match[4].toLowerCase() !== normalizedVariableName) {
            continue;
        }

        const ownerPrefix = match[1] ?? '';
        const ownerName = match[2];
        const ownerExpression = `${ownerPrefix}${ownerName}`
            .replace(/\s+/g, '')
            .replace(/\.$/, '');

        return {
            line: lineIndex,
            parentOwnerName: ownerName,
            parentOwnerExpression: ownerExpression.includes('.') ? ownerExpression : undefined,
            childName: match[3].trim(),
        };
    }

    return undefined;
}

function selectPreferredPowerScriptDataWindowCandidate(
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

async function collectMatchingDataWindowCandidates(
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

            if (normalizedObjectName !== normalizedName && normalizedFileName !== normalizedName) {
                continue;
            }

            candidates.push({
                uri,
                document: candidateDocument,
                parseResult,
            });
        }

        return candidates;
    })();

    candidateCache?.set(normalizedName, computation);

    return computation;
}

function resolveLocalDataObjectNameForOwnerType(
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

function findDataWindowObjectSelectionRange(
    document: vscode.TextDocument,
    objectName: string,
): vscode.Range {
    const headerText = document.lineAt(0).text;
    const headerMatch = headerText.match(/^\$PBExportHeader\$(.+?)\.srd$/i);
    const headerObjectName = headerMatch?.[1] ?? objectName;
    const startCharacter = headerText.toLowerCase().indexOf(headerObjectName.toLowerCase());

    if (startCharacter >= 0) {
        return new vscode.Range(0, startCharacter, 0, startCharacter + headerObjectName.length);
    }

    return new vscode.Range(0, 0, 0, Math.max(objectName.length, 1));
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

function extractAttributeValue(
    text: string,
    attributeName: string,
): string | undefined {
    const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(
        `${escapedAttributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s)]+))`,
        'i',
    ));

    return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim() || undefined;
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

function dedupeChildLinks(
    links: readonly VerifiedDataWindowChildLink[],
): VerifiedDataWindowChildLink[] {
    const deduped = new Map<string, VerifiedDataWindowChildLink>();

    for (const link of links) {
        deduped.set(`${link.kind}:${link.childName.toLowerCase()}:${link.childCandidate.uri.toString()}`, link);
    }

    return Array.from(deduped.values());
}