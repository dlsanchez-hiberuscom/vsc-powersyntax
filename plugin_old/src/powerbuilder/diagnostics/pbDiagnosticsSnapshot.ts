import * as path from 'path';
import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { PbProjectDefinition } from '../workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';

const DIAGNOSTICS_UNASSIGNED_PROJECT_KEY = '__unassigned__';
const SUPPORTED_DIAGNOSTIC_SOURCES = new Set(['PowerBuilder', 'PBAutoBuild']);

export interface PbDiagnosticsSnapshot {
    summary: PbDiagnosticsSnapshotSummary;
    projectEntries: PbDiagnosticsProjectEntry[];
}

export interface PbDiagnosticsSnapshotSummary {
    projectCount: number;
    objectCount: number;
    diagnosticCount: number;
    errorCount: number;
    warningCount: number;
}

export interface PbDiagnosticsProjectEntry {
    key: string;
    label: string;
    project?: PbProjectDefinition;
    objectEntries: PbDiagnosticsObjectEntry[];
    issueCount: number;
    errorCount: number;
    warningCount: number;
}

export interface PbDiagnosticsObjectEntry {
    uri: vscode.Uri;
    label: string;
    relativePath: string;
    project?: PbProjectDefinition;
    diagnostics: readonly vscode.Diagnostic[];
    issueCount: number;
    errorCount: number;
    warningCount: number;
}

interface BuildPowerBuilderDiagnosticsSnapshotOptions {
    index?: SymbolIndex;
    projectRegistry?: PowerBuilderProjectRegistry;
    diagnosticsEntries?: ReadonlyArray<readonly [vscode.Uri, readonly vscode.Diagnostic[]]>;
}

export function buildPowerBuilderDiagnosticsSnapshot(
    options: BuildPowerBuilderDiagnosticsSnapshotOptions = {},
): PbDiagnosticsSnapshot {
    const projectEntries = buildPowerBuilderDiagnosticsProjectEntries(options);

    return {
        summary: {
            projectCount: projectEntries.length,
            objectCount: projectEntries.reduce((count, entry) => count + entry.objectEntries.length, 0),
            diagnosticCount: projectEntries.reduce((count, entry) => count + entry.issueCount, 0),
            errorCount: projectEntries.reduce((count, entry) => count + entry.errorCount, 0),
            warningCount: projectEntries.reduce((count, entry) => count + entry.warningCount, 0),
        },
        projectEntries,
    };
}

export function formatPowerBuilderDiagnosticsViewMessage(snapshot: PbDiagnosticsSnapshot): string | undefined {
    if (snapshot.projectEntries.length === 0) {
        return 'Sin diagnostics PowerBuilder activos.';
    }

    return `${snapshot.summary.projectCount} proyecto(s) · ${snapshot.summary.objectCount} objeto(s) · ${snapshot.summary.diagnosticCount} diagnostic(s)`;
}

export function comparePowerBuilderDiagnostics(left: vscode.Diagnostic, right: vscode.Diagnostic): number {
    const severityCompare = left.severity - right.severity;

    if (severityCompare !== 0) {
        return severityCompare;
    }

    const lineCompare = left.range.start.line - right.range.start.line;

    if (lineCompare !== 0) {
        return lineCompare;
    }

    return left.message.localeCompare(right.message);
}

function buildPowerBuilderDiagnosticsProjectEntries(
    options: BuildPowerBuilderDiagnosticsSnapshotOptions,
): PbDiagnosticsProjectEntry[] {
    const groupedEntries = new Map<string, PbDiagnosticsProjectEntry>();

    for (const objectEntry of buildPowerBuilderDiagnosticsObjectEntries(options)) {
        const key = objectEntry.project?.uri.toString() ?? DIAGNOSTICS_UNASSIGNED_PROJECT_KEY;
        const existing = groupedEntries.get(key);

        if (existing) {
            existing.objectEntries.push(objectEntry);
            existing.issueCount += objectEntry.issueCount;
            existing.errorCount += objectEntry.errorCount;
            existing.warningCount += objectEntry.warningCount;
            continue;
        }

        groupedEntries.set(key, {
            key,
            label: objectEntry.project?.name ?? 'Sin proyecto',
            project: objectEntry.project,
            objectEntries: [objectEntry],
            issueCount: objectEntry.issueCount,
            errorCount: objectEntry.errorCount,
            warningCount: objectEntry.warningCount,
        });
    }

    return [...groupedEntries.values()]
        .sort((left, right) => {
            if (!left.project && right.project) {
                return 1;
            }

            if (left.project && !right.project) {
                return -1;
            }

            if (left.issueCount !== right.issueCount) {
                return right.issueCount - left.issueCount;
            }

            return left.label.localeCompare(right.label);
        })
        .map(entry => ({
            ...entry,
            objectEntries: entry.objectEntries.sort((left, right) => {
                const severityCompare = compareDiagnosticCounts(right.errorCount, left.errorCount)
                    || compareDiagnosticCounts(right.warningCount, left.warningCount);

                if (severityCompare !== 0) {
                    return severityCompare;
                }

                return left.label.localeCompare(right.label);
            }),
        }));
}

function buildPowerBuilderDiagnosticsObjectEntries(
    options: BuildPowerBuilderDiagnosticsSnapshotOptions,
): PbDiagnosticsObjectEntry[] {
    const index = options.index ?? SymbolIndex.getInstance();
    const projectRegistry = options.projectRegistry ?? PowerBuilderProjectRegistry.getInstance();
    const diagnosticsEntries = options.diagnosticsEntries ?? vscode.languages.getDiagnostics();
    const entries: PbDiagnosticsObjectEntry[] = [];

    for (const [uri, diagnostics] of diagnosticsEntries) {
        const supportedDiagnostics = diagnostics.filter(isSupportedDiagnostic);

        if (supportedDiagnostics.length === 0) {
            continue;
        }

        const sortedDiagnostics = [...supportedDiagnostics].sort(comparePowerBuilderDiagnostics);
        const summary = summarizeDiagnostics(sortedDiagnostics);

        entries.push({
            uri,
            label: resolveObjectLabel(index, uri),
            relativePath: vscode.workspace.asRelativePath(uri, false) || uri.fsPath || uri.path,
            project: projectRegistry.getPreferredProjectForSourceFile(uri),
            diagnostics: sortedDiagnostics,
            issueCount: sortedDiagnostics.length,
            errorCount: summary.errorCount,
            warningCount: summary.warningCount,
        });
    }

    return entries;
}

function isSupportedDiagnostic(diagnostic: vscode.Diagnostic): boolean {
    return !!diagnostic.source && SUPPORTED_DIAGNOSTIC_SOURCES.has(diagnostic.source);
}

function resolveObjectLabel(index: SymbolIndex, uri: vscode.Uri): string {
    const symbols = getTopLevelSymbols(index.getSymbolsForFile(uri));
    const preferredKinds = new Set(['type', 'structure']);
    const preferredSymbol = symbols.find(symbol => preferredKinds.has(symbol.kind));

    if (preferredSymbol) {
        return preferredSymbol.name;
    }

    if (symbols.length > 0) {
        return symbols[0].name;
    }

    return path.basename(uri.fsPath || uri.path, path.extname(uri.fsPath || uri.path));
}

function getTopLevelSymbols(symbols: PbSymbol[]): PbSymbol[] {
    const symbolNames = new Set(symbols.map(symbol => symbol.name.toLowerCase()));

    return symbols.filter(symbol => !symbol.parent || !symbolNames.has(symbol.parent.toLowerCase()));
}

function summarizeDiagnostics(diagnostics: readonly vscode.Diagnostic[]): { errorCount: number; warningCount: number } {
    let errorCount = 0;
    let warningCount = 0;

    for (const diagnostic of diagnostics) {
        if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
            warningCount++;
            continue;
        }

        errorCount++;
    }

    return {
        errorCount,
        warningCount,
    };
}

function compareDiagnosticCounts(left: number, right: number): number {
    return left - right;
}