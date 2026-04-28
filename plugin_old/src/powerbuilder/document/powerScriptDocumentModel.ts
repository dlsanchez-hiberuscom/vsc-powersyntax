import * as vscode from 'vscode';
import {
    endsWithPowerScriptContinuation,
    stripCommentsFromLines,
    stripPowerScriptContinuation,
} from '../../core/utils/powerScriptLexingUtils';
import {
    createPowerScriptStatementScanState,
    splitPowerBuilderStatements,
} from '../../core/utils/powerScriptStatementUtils';
import { isLikelySqlStarter as isLikelyEmbeddedSqlStarter } from '../../core/utils/powerScriptSqlUtils';

export interface PowerScriptLogicalLineSegment {
    readonly text: string;
    readonly logicalStart: number;
    readonly physicalLine: number;
    readonly physicalStartColumn: number;
}

export interface PowerScriptLogicalLine {
    readonly text: string;
    readonly segments: PowerScriptLogicalLineSegment[];
    readonly firstPhysicalLine: number;
    readonly lastPhysicalLine: number;
}

export interface PowerScriptDocumentStatementSegment {
    readonly text: string;
    readonly statementStart: number;
    readonly physicalLine: number;
    readonly physicalStartColumn: number;
}

export interface PowerScriptDocumentStatement {
    readonly text: string;
    readonly range: vscode.Range;
    readonly start: vscode.Position;
    readonly end: vscode.Position;
    readonly indexOnLogicalLine: number;
    readonly logicalLine: PowerScriptLogicalLine;
    readonly segments: PowerScriptDocumentStatementSegment[];
}

export interface PowerScriptDocumentModel {
    readonly logicalLines: PowerScriptLogicalLine[];
    readonly statements: PowerScriptDocumentStatement[];
    readonly statementsByPhysicalLine: ReadonlyMap<number, PowerScriptDocumentStatement[]>;
}

interface CachedModelEntry {
    versionKey: string;
    model: PowerScriptDocumentModel;
}

export class PowerScriptDocumentModelCache {
    private static instance: PowerScriptDocumentModelCache;

    private readonly cache = new Map<string, CachedModelEntry>();

    static getInstance(): PowerScriptDocumentModelCache {
        if (!PowerScriptDocumentModelCache.instance) {
            PowerScriptDocumentModelCache.instance = new PowerScriptDocumentModelCache();
        }

        return PowerScriptDocumentModelCache.instance;
    }

    getModel(document: vscode.TextDocument): PowerScriptDocumentModel {
        const key = document.uri.toString();
        const versionKey = getDocumentVersionKey(document);
        const cached = this.cache.get(key);

        if (cached && cached.versionKey === versionKey) {
            return cached.model;
        }

        const model = buildPowerScriptDocumentModel(document);

        this.cache.set(key, {
            versionKey,
            model,
        });

        return model;
    }

    invalidate(uri: vscode.Uri): void {
        this.cache.delete(uri.toString());
    }

    clear(): void {
        this.cache.clear();
    }
}

export function getDocumentVersionKey(document: vscode.TextDocument): string {
    const maybeVersion = (document as { version?: number }).version;

    if (typeof maybeVersion === 'number') {
        return `v:${maybeVersion}`;
    }

    return `t:${document.getText()}`;
}

export function buildPowerScriptDocumentModel(
    document: vscode.TextDocument,
): PowerScriptDocumentModel {
    const physicalLines = document.getText().split(/\r?\n/);
    const strippedLines = stripCommentsFromLines(physicalLines);
    const logicalLines = buildLogicalLines(physicalLines, strippedLines);
    const statements: PowerScriptDocumentStatement[] = [];
    const statementsByPhysicalLine = new Map<number, PowerScriptDocumentStatement[]>();

    const statementScanState = createPowerScriptStatementScanState();

    for (const logicalLine of logicalLines) {
        const rawStatements = splitPowerBuilderStatements(
            logicalLine.text,
            logicalLine.firstPhysicalLine,
            statementScanState,
        );

        for (const rawStatement of rawStatements) {
            const startOffset = rawStatement.startColumn;
            const endOffset = rawStatement.endColumn;

            const start = mapLogicalLineOffsetToPosition(
                logicalLine,
                startOffset,
                'start',
            );

            const end = mapLogicalLineOffsetToPosition(
                logicalLine,
                endOffset,
                'end',
            );

            const statement: PowerScriptDocumentStatement = {
                text: rawStatement.text,
                range: new vscode.Range(start, end),
                start,
                end,
                indexOnLogicalLine: rawStatement.indexOnLine,
                logicalLine,
                segments: sliceStatementSegments(
                    logicalLine,
                    startOffset,
                    endOffset,
                ),
            };

            statements.push(statement);

            for (const segment of statement.segments) {
                const bucket = statementsByPhysicalLine.get(segment.physicalLine) ?? [];
                bucket.push(statement);
                statementsByPhysicalLine.set(segment.physicalLine, bucket);
            }
        }
    }

    return {
        logicalLines,
        statements,
        statementsByPhysicalLine,
    };
}

export function getStatementAtPositionFromModel(
    model: PowerScriptDocumentModel,
    position: vscode.Position,
): PowerScriptDocumentStatement | undefined {
    const candidates = model.statementsByPhysicalLine.get(position.line) ?? [];

    for (const statement of candidates) {
        if (statementContainsPosition(statement, position)) {
            return statement;
        }
    }

    return undefined;
}

export function mapPositionToStatementOffset(
    statement: PowerScriptDocumentStatement,
    position: vscode.Position,
): number | undefined {
    for (const segment of statement.segments) {
        if (segment.physicalLine !== position.line) {
            continue;
        }

        const segmentStart = segment.physicalStartColumn;
        const segmentEnd = segment.physicalStartColumn + segment.text.length;

        if (
            position.character >= segmentStart &&
            position.character <= segmentEnd
        ) {
            const clampedDelta = Math.max(
                0,
                Math.min(position.character - segmentStart, segment.text.length),
            );

            return segment.statementStart + clampedDelta;
        }
    }

    return undefined;
}

export function mapStatementOffsetToPosition(
    statement: PowerScriptDocumentStatement,
    offset: number,
    bias: 'start' | 'end' = 'start',
): vscode.Position {
    if (statement.segments.length === 0) {
        return bias === 'start' ? statement.start : statement.end;
    }

    let previousSegment: PowerScriptDocumentStatementSegment | undefined;

    for (const segment of statement.segments) {
        const segmentStart = segment.statementStart;
        const segmentEnd = segment.statementStart + segment.text.length;

        if (offset >= segmentStart && offset < segmentEnd) {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + (offset - segmentStart),
            );
        }

        if (offset === segmentStart && bias === 'start') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn,
            );
        }

        if (offset === segmentEnd && bias === 'end') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + segment.text.length,
            );
        }

        if (offset < segmentStart) {
            if (bias === 'start') {
                return new vscode.Position(
                    segment.physicalLine,
                    segment.physicalStartColumn,
                );
            }

            if (previousSegment) {
                return new vscode.Position(
                    previousSegment.physicalLine,
                    previousSegment.physicalStartColumn + previousSegment.text.length,
                );
            }

            return statement.start;
        }

        previousSegment = segment;
    }

    const lastSegment = statement.segments[statement.segments.length - 1];

    return new vscode.Position(
        lastSegment.physicalLine,
        lastSegment.physicalStartColumn + lastSegment.text.length,
    );
}

function buildLogicalLines(
    physicalLines: string[],
    strippedLines: string[],
): PowerScriptLogicalLine[] {
    const result: PowerScriptLogicalLine[] = [];
    let lineIndex = 0;

    while (lineIndex < physicalLines.length) {
        const firstPhysicalLine = lineIndex;
        const segments: PowerScriptLogicalLineSegment[] = [];
        let logicalText = '';
        let logicalCursor = 0;
        let currentLineIndex = lineIndex;

        while (true) {
            const rawLine = physicalLines[currentLineIndex] ?? '';
            const strippedLine = strippedLines[currentLineIndex] ?? '';
            const continues =
                endsWithPowerScriptContinuation(strippedLine) &&
                currentLineIndex + 1 < physicalLines.length &&
                !isLikelySqlStarter(strippedLine);

            const physicalStartColumn = 0;
            const segmentText = continues
                ? stripPowerScriptContinuation(rawLine)
                : rawLine;

            segments.push({
                text: segmentText,
                logicalStart: logicalCursor,
                physicalLine: currentLineIndex,
                physicalStartColumn,
            });

            logicalText += segmentText;
            logicalCursor += segmentText.length;

            if (!continues) {
                break;
            }

            currentLineIndex++;
        }

        result.push({
            text: logicalText,
            segments,
            firstPhysicalLine,
            lastPhysicalLine: currentLineIndex,
        });

        lineIndex = currentLineIndex + 1;
    }

    return result;
}

function sliceStatementSegments(
    logicalLine: PowerScriptLogicalLine,
    statementStartOffset: number,
    statementEndOffset: number,
): PowerScriptDocumentStatementSegment[] {
    const result: PowerScriptDocumentStatementSegment[] = [];

    for (const segment of logicalLine.segments) {
        const segmentStart = segment.logicalStart;
        const segmentEnd = segment.logicalStart + segment.text.length;

        const intersectionStart = Math.max(segmentStart, statementStartOffset);
        const intersectionEnd = Math.min(segmentEnd, statementEndOffset);

        if (intersectionStart >= intersectionEnd) {
            continue;
        }

        const relativeStart = intersectionStart - segmentStart;
        const relativeEnd = intersectionEnd - segmentStart;

        result.push({
            text: segment.text.slice(relativeStart, relativeEnd),
            statementStart: intersectionStart - statementStartOffset,
            physicalLine: segment.physicalLine,
            physicalStartColumn: segment.physicalStartColumn + relativeStart,
        });
    }

    return result;
}

function mapLogicalLineOffsetToPosition(
    logicalLine: PowerScriptLogicalLine,
    offset: number,
    bias: 'start' | 'end',
): vscode.Position {
    if (logicalLine.segments.length === 0) {
        return new vscode.Position(logicalLine.firstPhysicalLine, 0);
    }

    let previousSegment: PowerScriptLogicalLineSegment | undefined;

    for (const segment of logicalLine.segments) {
        const segmentStart = segment.logicalStart;
        const segmentEnd = segment.logicalStart + segment.text.length;

        if (offset >= segmentStart && offset < segmentEnd) {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + (offset - segmentStart),
            );
        }

        if (offset === segmentStart && bias === 'start') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn,
            );
        }

        if (offset === segmentEnd && bias === 'end') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + segment.text.length,
            );
        }

        if (offset < segmentStart) {
            if (bias === 'start') {
                return new vscode.Position(
                    segment.physicalLine,
                    segment.physicalStartColumn,
                );
            }

            if (previousSegment) {
                return new vscode.Position(
                    previousSegment.physicalLine,
                    previousSegment.physicalStartColumn + previousSegment.text.length,
                );
            }

            return new vscode.Position(logicalLine.firstPhysicalLine, 0);
        }

        previousSegment = segment;
    }

    const lastSegment = logicalLine.segments[logicalLine.segments.length - 1];

    return new vscode.Position(
        lastSegment.physicalLine,
        lastSegment.physicalStartColumn + lastSegment.text.length,
    );
}

function statementContainsPosition(
    statement: PowerScriptDocumentStatement,
    position: vscode.Position,
): boolean {
    for (const segment of statement.segments) {
        if (segment.physicalLine !== position.line) {
            continue;
        }

        const segmentStart = segment.physicalStartColumn;
        const segmentEnd = segment.physicalStartColumn + segment.text.length;

        if (
            position.character >= segmentStart &&
            position.character <= segmentEnd
        ) {
            return true;
        }
    }

    return false;
}

function isLikelySqlStarter(line: string): boolean {
    return isLikelyEmbeddedSqlStarter(line);
}