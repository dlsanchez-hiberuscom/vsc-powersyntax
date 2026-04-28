import * as vscode from 'vscode';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import {
    buildPowerBuilderDiagnosticsSnapshot,
    comparePowerBuilderDiagnostics,
    formatPowerBuilderDiagnosticsViewMessage,
    PbDiagnosticsObjectEntry,
    PbDiagnosticsProjectEntry,
} from '../../../powerbuilder/diagnostics/pbDiagnosticsSnapshot';

const DIAGNOSTICS_PANEL_VIEW_ID = 'powerbuilderDiagnostics';
const DIAGNOSTICS_PANEL_REFRESH_DEBOUNCE_MS = 120;

export function registerDiagnosticsPanel(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const treeDataProvider = new PbDiagnosticsPanelProvider();

    const treeView = vscode.window.createTreeView(DIAGNOSTICS_PANEL_VIEW_ID, {
        treeDataProvider,
        showCollapseAll: true,
    });

    const refreshPanel = (): void => {
        treeView.message = treeDataProvider.getViewMessage();
        treeDataProvider.scheduleRefresh();
    };

    const onDiagnosticsChanged = vscode.languages.onDidChangeDiagnostics(() => {
        refreshPanel();
    });
    const onIndexChanged = SymbolIndex.getInstance().onDidChange(() => {
        refreshPanel();
    });
    const onEditorChanged = vscode.window.onDidChangeActiveTextEditor(() => {
        refreshPanel();
    });

    const providerDisposable = new vscode.Disposable(() => {
        treeDataProvider.dispose();
    });

    refreshPanel();

    return [
        treeView,
        onDiagnosticsChanged,
        onIndexChanged,
        onEditorChanged,
        providerDisposable,
    ];
}

class PbDiagnosticsPanelProvider implements vscode.TreeDataProvider<PbDiagnosticsTreeItem> {
    private readonly onDidChangeTreeDataEmitter =
        new vscode.EventEmitter<PbDiagnosticsTreeItem | undefined>();

    private refreshHandle?: ReturnType<typeof setTimeout>;

    readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

    getViewMessage(): string | undefined {
        return formatPowerBuilderDiagnosticsViewMessage(buildPowerBuilderDiagnosticsSnapshot());
    }

    scheduleRefresh(): void {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }

        this.refreshHandle = setTimeout(() => {
            this.refreshHandle = undefined;
            this.onDidChangeTreeDataEmitter.fire(undefined);
        }, DIAGNOSTICS_PANEL_REFRESH_DEBOUNCE_MS);
    }

    dispose(): void {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
            this.refreshHandle = undefined;
        }

        this.onDidChangeTreeDataEmitter.dispose();
    }

    getTreeItem(element: PbDiagnosticsTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PbDiagnosticsTreeItem): PbDiagnosticsTreeItem[] {
        const snapshot = buildPowerBuilderDiagnosticsSnapshot();

        if (!element) {
            return this.buildProjectItems(snapshot.projectEntries);
        }

        if (element.kind === 'project' && element.projectEntry) {
            return this.buildObjectItems(element.projectEntry.objectEntries);
        }

        if (element.kind === 'object' && element.objectEntry) {
            return this.buildDiagnosticItems(element.objectEntry);
        }

        return [];
    }

    private buildProjectItems(projectEntries: PbDiagnosticsProjectEntry[]): PbDiagnosticsTreeItem[] {
        return projectEntries.map(entry => {
            const item = new PbDiagnosticsTreeItem({
                kind: 'project',
                label: entry.label,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                projectEntry: entry,
                resourceUri: entry.project?.uri,
            });

            item.description = formatDiagnosticSummary(entry.errorCount, entry.warningCount, entry.objectEntries.length, 'objeto');
            item.iconPath = new vscode.ThemeIcon(entry.errorCount > 0 ? 'warning' : 'issues');

            return item;
        });
    }

    private buildObjectItems(objectEntries: readonly PbDiagnosticsObjectEntry[]): PbDiagnosticsTreeItem[] {
        return objectEntries.map(entry => {
            const item = new PbDiagnosticsTreeItem({
                kind: 'object',
                label: entry.label,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                objectEntry: entry,
                resourceUri: entry.uri,
            });

            item.description = `${formatDiagnosticSummary(entry.errorCount, entry.warningCount, undefined, undefined)} · ${entry.relativePath}`;
            item.tooltip = `${entry.label}\n${entry.relativePath}`;
            item.iconPath = new vscode.ThemeIcon(entry.errorCount > 0 ? 'error' : 'warning');

            return item;
        });
    }

    private buildDiagnosticItems(objectEntry: PbDiagnosticsObjectEntry): PbDiagnosticsTreeItem[] {
        return [...objectEntry.diagnostics]
            .sort(comparePowerBuilderDiagnostics)
            .map(diagnostic => {
                const item = new PbDiagnosticsTreeItem({
                    kind: 'diagnostic',
                    label: diagnostic.message,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    resourceUri: objectEntry.uri,
                    diagnostic,
                });

                const lineNumber = diagnostic.range.start.line + 1;
                const code = diagnostic.code ? ` · ${String(diagnostic.code)}` : '';
                const source = diagnostic.source ? ` · ${diagnostic.source}` : '';

                item.description = `L${lineNumber}${code}${source}`;
                item.tooltip = `${diagnostic.message}\n${objectEntry.relativePath}:${lineNumber}`;
                item.iconPath = new vscode.ThemeIcon(mapDiagnosticSeverityToIcon(diagnostic.severity));
                item.command = {
                    command: 'vscode.open',
                    title: 'Abrir diagnóstico',
                    arguments: [objectEntry.uri, { selection: diagnostic.range }],
                };

                return item;
            });
    }
}

type PbDiagnosticsTreeItemKind = 'project' | 'object' | 'diagnostic';

interface PbDiagnosticsTreeItemArgs {
    kind: PbDiagnosticsTreeItemKind;
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    resourceUri?: vscode.Uri;
    projectEntry?: PbDiagnosticsProjectEntry;
    objectEntry?: PbDiagnosticsObjectEntry;
    diagnostic?: vscode.Diagnostic;
}

class PbDiagnosticsTreeItem extends vscode.TreeItem {
    readonly kind: PbDiagnosticsTreeItemKind;
    readonly projectEntry?: PbDiagnosticsProjectEntry;
    readonly objectEntry?: PbDiagnosticsObjectEntry;
    readonly diagnostic?: vscode.Diagnostic;

    constructor(args: PbDiagnosticsTreeItemArgs) {
        super(args.label, args.collapsibleState);

        this.kind = args.kind;
        this.projectEntry = args.projectEntry;
        this.objectEntry = args.objectEntry;
        this.diagnostic = args.diagnostic;
        this.resourceUri = args.resourceUri;
    }
}

function compareDiagnosticCounts(left: number, right: number): number {
    return left - right;
}

function formatDiagnosticSummary(
    errorCount: number,
    warningCount: number,
    entityCount?: number,
    entityLabel?: string,
): string {
    const parts: string[] = [];

    if (errorCount > 0) {
        parts.push(`${errorCount} error(es)`);
    }

    if (warningCount > 0) {
        parts.push(`${warningCount} warning(s)`);
    }

    if (parts.length === 0) {
        parts.push('0 issues');
    }

    if (typeof entityCount === 'number' && entityLabel) {
        parts.push(entityCount === 1 ? `1 ${entityLabel}` : `${entityCount} ${entityLabel}s`);
    }

    return parts.join(' · ');
}

function mapDiagnosticSeverityToIcon(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
        case vscode.DiagnosticSeverity.Error:
            return 'error';
        case vscode.DiagnosticSeverity.Warning:
            return 'warning';
        case vscode.DiagnosticSeverity.Information:
            return 'info';
        case vscode.DiagnosticSeverity.Hint:
            return 'lightbulb';
        default:
            return 'issues';
    }
}