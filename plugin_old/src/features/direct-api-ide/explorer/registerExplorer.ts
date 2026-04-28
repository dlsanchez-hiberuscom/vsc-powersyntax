import * as vscode from 'vscode';
import { PB_LANGUAGE_ID } from '../../../core/config/constants';
import {
    PB_USER_MESSAGES,
    getSymbolKindLabelEs,
} from '../../../core/i18n/pbUserMessages';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import { PbProjectDefinition } from '../../../powerbuilder/workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../../../powerbuilder/workspace/projectRegistry';

const EXPLORER_REFRESH_DEBOUNCE_MS = 120;
const EXPLORER_UNASSIGNED_PROJECT_KEY = '__unassigned__';

type PbExplorerScope = 'workspace' | 'current-project' | 'current-file';

export function registerExplorer(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const treeDataProvider = new PbExplorerProvider();

    const treeView = vscode.window.createTreeView('powerbuilderExplorer', {
        treeDataProvider,
        showCollapseAll: true,
    });

    const refreshExplorer = (): void => {
        treeView.message = treeDataProvider.getViewMessage();
        treeDataProvider.scheduleRefresh();
    };

    const onIndexChanged = SymbolIndex.getInstance().onDidChange(() => {
        refreshExplorer();
    });
    const onEditorChanged = vscode.window.onDidChangeActiveTextEditor(() => {
        refreshExplorer();
    });
    const focusCurrentProject = registerExplorerCommand(
        'powerbuilder.explorerFocusCurrentProject',
        () => {
            treeDataProvider.toggleScope('current-project');
            refreshExplorer();
        },
    );
    const focusCurrentFile = registerExplorerCommand(
        'powerbuilder.explorerFocusCurrentFile',
        () => {
            treeDataProvider.toggleScope('current-file');
            refreshExplorer();
        },
    );

    const providerDisposable = new vscode.Disposable(() => {
        treeDataProvider.dispose();
    });

    refreshExplorer();

    return [
        treeView,
        onIndexChanged,
        onEditorChanged,
        focusCurrentProject,
        focusCurrentFile,
        providerDisposable,
    ];
}

class PbExplorerProvider implements vscode.TreeDataProvider<PbTreeItem> {
    private readonly onDidChangeTreeDataEmitter =
        new vscode.EventEmitter<PbTreeItem | undefined>();

    private refreshHandle?: ReturnType<typeof setTimeout>;
    private scope: PbExplorerScope = 'workspace';

    readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

    toggleScope(nextScope: PbExplorerScope): void {
        this.scope = this.scope === nextScope
            ? 'workspace'
            : nextScope;
    }

    getViewMessage(): string | undefined {
        if (this.scope === 'workspace') {
            return undefined;
        }

        if (this.scope === 'current-project') {
            const currentProject = this.getCurrentProject();

            return currentProject
                ? `Foco: proyecto ${currentProject.name}`
                : 'Foco: proyecto actual no resuelto; mostrando workspace';
        }

        const currentFileUri = this.getCurrentFileUri();

        return currentFileUri
            ? `Foco: archivo ${getExplorerRelativeLabel(currentFileUri)}`
            : 'Foco: archivo actual no resuelto; mostrando workspace';
    }

    scheduleRefresh(): void {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }

        this.refreshHandle = setTimeout(() => {
            this.refreshHandle = undefined;
            this.onDidChangeTreeDataEmitter.fire(undefined);
        }, EXPLORER_REFRESH_DEBOUNCE_MS);
    }

    dispose(): void {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
            this.refreshHandle = undefined;
        }

        this.onDidChangeTreeDataEmitter.dispose();
    }

    getTreeItem(element: PbTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PbTreeItem): PbTreeItem[] {
        const index = SymbolIndex.getInstance();
        const fileEntries = this.getScopedFileEntries(
            this.buildFileEntries(index.getAllSymbols()),
        );

        if (!element) {
            if (this.scope === 'current-project' || this.scope === 'current-file') {
                return this.buildFileItems(fileEntries);
            }

            const projectItems = this.buildProjectItems(fileEntries);

            return projectItems.length > 0
                ? projectItems
                : this.buildFileItems(fileEntries);
        }

        if (element.kind === 'project' && element.projectFileEntries) {
            return this.buildFileItems(element.projectFileEntries);
        }

        if (element.kind === 'file' && element.fileSymbols) {
            return this.buildSymbolItems(getTopLevelSymbols(element.fileSymbols));
        }

        if (element.kind === 'symbol' && element.symbol) {
            return this.buildSymbolItems(element.symbol.children ?? []);
        }

        return [];
    }

    private buildFileEntries(allSymbols: PbSymbol[]): PbExplorerFileEntry[] {
        const fileMap = new Map<string, PbSymbol[]>();
        const projectRegistry = PowerBuilderProjectRegistry.getInstance();

        for (const symbol of allSymbols) {
            const key = symbol.uri.toString();

            if (!fileMap.has(key)) {
                fileMap.set(key, []);
            }

            fileMap.get(key)!.push(symbol);
        }

        return Array.from(fileMap.entries())
            .map(([uriString, symbols]) => {
                const uri = vscode.Uri.parse(uriString);

                return {
                    uri,
                    label: getExplorerRelativeLabel(uri),
                    project: projectRegistry.getPreferredProjectForSourceFile(uri),
                    symbols,
                };
            })
            .sort((left, right) => left.label.localeCompare(right.label));
    }

    private getScopedFileEntries(fileEntries: PbExplorerFileEntry[]): PbExplorerFileEntry[] {
        if (this.scope === 'current-file') {
            const currentFileUri = this.getCurrentFileUri();

            return currentFileUri
                ? fileEntries.filter(entry => entry.uri.toString() === currentFileUri.toString())
                : fileEntries;
        }

        if (this.scope === 'current-project') {
            const currentProject = this.getCurrentProject();

            return currentProject
                ? fileEntries.filter(entry => entry.project?.uri.toString() === currentProject.uri.toString())
                : fileEntries;
        }

        return fileEntries;
    }

    private getCurrentFileUri(): vscode.Uri | undefined {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== PB_LANGUAGE_ID) {
            return undefined;
        }

        return editor.document.uri;
    }

    private getCurrentProject(): PbProjectDefinition | undefined {
        const currentFileUri = this.getCurrentFileUri();

        return currentFileUri
            ? PowerBuilderProjectRegistry.getInstance().getPreferredProjectForSourceFile(currentFileUri)
            : undefined;
    }

    private buildProjectItems(fileEntries: PbExplorerFileEntry[]): PbTreeItem[] {
        const groupedEntries = new Map<string, PbExplorerProjectEntry>();

        for (const entry of fileEntries) {
            const key = entry.project?.uri.toString() ?? EXPLORER_UNASSIGNED_PROJECT_KEY;
            const existing = groupedEntries.get(key);

            if (existing) {
                existing.fileEntries.push(entry);
                continue;
            }

            groupedEntries.set(key, {
                key,
                label: entry.project?.name ?? 'Sin proyecto',
                project: entry.project,
                fileEntries: [entry],
            });
        }

        if (
            groupedEntries.size === 0 ||
            !Array.from(groupedEntries.values()).some(entry => !!entry.project)
        ) {
            return [];
        }

        return Array.from(groupedEntries.values())
            .sort((left, right) => {
                if (!left.project && right.project) {
                    return 1;
                }

                if (left.project && !right.project) {
                    return -1;
                }

                return left.label.localeCompare(right.label);
            })
            .map(entry => {
                const item = new PbTreeItem({
                    kind: 'project',
                    label: entry.label,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    projectFileEntries: entry.fileEntries,
                    resourceUri: entry.project?.uri,
                });

                item.description = formatFileCountDescription(entry.fileEntries.length);
                item.iconPath = new vscode.ThemeIcon(entry.project ? 'library' : 'folder');

                return item;
            });
    }

    private buildFileItems(fileEntries: PbExplorerFileEntry[]): PbTreeItem[] {
        return fileEntries
            .map(entry => new PbTreeItem({
                kind: 'file',
                label: entry.label,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                fileSymbols: entry.symbols,
                resourceUri: entry.uri,
            }))
            .sort((left, right) =>
                left.displayLabel.localeCompare(right.displayLabel),
            );
    }

    private buildSymbolItems(symbols: PbSymbol[]): PbTreeItem[] {
        return symbols
            .map(symbol => {
                const hasChildren = !!symbol.children && symbol.children.length > 0;

                const item = new PbTreeItem({
                    kind: 'symbol',
                    label: symbol.name,
                    collapsibleState: hasChildren
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None,
                    symbol,
                    resourceUri: symbol.uri,
                });

                item.description = buildSymbolDescription(symbol);
                item.iconPath = new vscode.ThemeIcon(mapKindToIcon(symbol.kind));
                item.command = {
                    command: 'vscode.open',
                    title: PB_USER_MESSAGES.explorer.open,
                    arguments: [symbol.uri, { selection: symbol.selectionRange }],
                };

                return item;
            })
            .sort((left, right) =>
                left.displayLabel.localeCompare(right.displayLabel),
            );
    }
}

type PbTreeItemKind = 'project' | 'file' | 'symbol';

interface PbExplorerFileEntry {
    uri: vscode.Uri;
    label: string;
    project?: PbProjectDefinition;
    symbols: PbSymbol[];
}

interface PbExplorerProjectEntry {
    key: string;
    label: string;
    project?: PbProjectDefinition;
    fileEntries: PbExplorerFileEntry[];
}

interface PbTreeItemArgs {
    kind: PbTreeItemKind;
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    resourceUri?: vscode.Uri;
    symbol?: PbSymbol;
    fileSymbols?: PbSymbol[];
    projectFileEntries?: PbExplorerFileEntry[];
}

class PbTreeItem extends vscode.TreeItem {
    readonly kind: PbTreeItemKind;
    readonly symbol?: PbSymbol;
    readonly fileSymbols?: PbSymbol[];
    readonly projectFileEntries?: PbExplorerFileEntry[];
    readonly displayLabel: string;

    constructor(args: PbTreeItemArgs) {
        super(args.label, args.collapsibleState);

        this.kind = args.kind;
        this.symbol = args.symbol;
        this.fileSymbols = args.fileSymbols;
        this.projectFileEntries = args.projectFileEntries;
        this.resourceUri = args.resourceUri;
        this.displayLabel = args.label;
    }
}

function getTopLevelSymbols(symbols: PbSymbol[]): PbSymbol[] {
    const symbolNames = new Set(symbols.map(symbol => symbol.name.toLowerCase()));

    return symbols.filter(symbol =>
        !symbol.parent || !symbolNames.has(symbol.parent.toLowerCase()),
    );
}

function buildSymbolDescription(symbol: PbSymbol): string {
    let description = getSymbolKindLabelEs(symbol.kind);

    if (symbol.isPrototype) {
        description += ' · prototipo';
    }

    if (symbol.implementationKind === 'on-handler') {
        description += ' · on';
    }

    if (symbol.implementationKind === 'qualified-event') {
        description += ' · calificado';
    }

    return description;
}

function mapKindToIcon(kind: string): string {
    switch (kind) {
        case 'type':
            return 'symbol-class';
        case 'structure':
            return 'symbol-struct';
        case 'function':
        case 'global-function':
            return 'symbol-method';
        case 'subroutine':
            return 'symbol-method';
        case 'event':
            return 'symbol-event';
        case 'variable':
            return 'symbol-field';
        case 'constant':
            return 'symbol-constant';
        default:
            return 'symbol-misc';
    }
}

function getExplorerRelativeLabel(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false) || uri.fsPath || uri.path;
}

function formatFileCountDescription(fileCount: number): string {
    return fileCount === 1
        ? '1 archivo'
        : `${fileCount} archivos`;
}

function registerExplorerCommand(
    command: string,
    callback: () => void,
): vscode.Disposable {
    try {
        return vscode.commands.registerCommand(command, callback);
    } catch (error) {
        if (String(error).includes('already exists')) {
            return new vscode.Disposable(() => undefined);
        }

        throw error;
    }
}
``