import * as vscode from 'vscode';

import type { ApiSemanticWorkspaceManifest } from '../shared/publicApi';
import {
  buildObjectExplorerModel,
  findObjectExplorerNodeById,
  type ObjectExplorerModel,
  type ObjectExplorerNode,
  type ObjectExplorerObjectNode,
  type ObjectExplorerScope,
} from './objectExplorerModel';

type ManifestLoader = () => Promise<ApiSemanticWorkspaceManifest>;

export interface ObjectExplorerFocusResult {
  scope: ObjectExplorerScope;
  effectiveScope: ObjectExplorerScope;
  objectName?: string;
  objectUri?: string;
}

function themeIconForNode(node: ObjectExplorerNode): vscode.ThemeIcon | undefined {
  switch (node.type) {
    case 'project':
      return new vscode.ThemeIcon('project');
    case 'library':
      return new vscode.ThemeIcon('library');
    case 'kind':
      switch (node.objectKind) {
        case 'application':
          return new vscode.ThemeIcon('symbol-class');
        case 'window':
          return new vscode.ThemeIcon('window');
        case 'userobject':
          return new vscode.ThemeIcon('symbol-interface');
        case 'menu':
          return new vscode.ThemeIcon('symbol-enum');
        case 'datawindow':
          return new vscode.ThemeIcon('table');
        case 'function':
          return new vscode.ThemeIcon('symbol-function');
        case 'structure':
          return new vscode.ThemeIcon('symbol-struct');
        case 'pipeline':
          return new vscode.ThemeIcon('symbol-namespace');
        case 'query':
          return new vscode.ThemeIcon('search');
        default:
          return new vscode.ThemeIcon('question');
      }
    default:
      return undefined;
  }
}

function findParentNode(roots: readonly ObjectExplorerNode[], childId: string): ObjectExplorerNode | undefined {
  const stack: Array<{ parent?: ObjectExplorerNode; node: ObjectExplorerNode }> = roots.map((node) => ({ node }));

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }

    if (current.node.id === childId) {
      return current.parent;
    }

    if ('children' in current.node) {
      for (const child of current.node.children) {
        stack.push({ parent: current.node, node: child });
      }
    }
  }

  return undefined;
}

class ObjectExplorerProvider implements vscode.TreeDataProvider<ObjectExplorerNode>, vscode.Disposable {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<ObjectExplorerNode | undefined>();
  private scope: ObjectExplorerScope = 'workspace';
  private model: ObjectExplorerModel | undefined;
  private pendingModel: Promise<ObjectExplorerModel> | undefined;
  private dirty = true;

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly loadManifest: ManifestLoader) { }

  setScope(scope: ObjectExplorerScope): void {
    this.scope = scope;
    void this.refreshBackground();
  }

  clearScope(): void {
    this.scope = 'workspace';
    void this.refreshBackground();
  }

  async refreshBackground(): Promise<void> {
    if (this.pendingModel) {
      await this.pendingModel;
      return;
    }

    this.pendingModel = this.loadManifest()
      .then((manifest) => buildObjectExplorerModel(manifest, this.scope, vscode.window.activeTextEditor?.document.uri.toString()))
      .catch((error) => ({
        scope: this.scope,
        effectiveScope: 'workspace' as ObjectExplorerScope,
        message: `Object Explorer no disponible: ${error instanceof Error ? error.message : String(error)}`,
        roots: [],
      }))
      .then((model) => {
        this.model = model;
        this.dirty = false;
        this.onDidChangeTreeDataEmitter.fire(undefined);
        return model;
      })
      .finally(() => {
        this.pendingModel = undefined;
      });

    await this.pendingModel;
  }

  getTreeItem(element: ObjectExplorerNode): vscode.TreeItem {
    const collapsibleState = element.type === 'object'
      ? vscode.TreeItemCollapsibleState.None
      : vscode.TreeItemCollapsibleState.Collapsed;
    const item = new vscode.TreeItem(element.label, collapsibleState);
    item.id = element.id;
    item.description = element.description;
    item.tooltip = element.tooltip;
    item.contextValue = `powerbuilderObjectExplorer.${element.type}`;

    const icon = themeIconForNode(element);
    if (icon) {
      item.iconPath = icon;
    }

    if (element.type === 'object') {
      item.resourceUri = vscode.Uri.parse(element.uri);
      item.command = {
        command: 'powerbuilder.openObjectExplorerObject',
        title: 'Abrir objeto',
        arguments: [element],
      };
    }

    return item;
  }

  async getChildren(element?: ObjectExplorerNode): Promise<ObjectExplorerNode[]> {
    const model = await this.ensureModel();
    return element ? ('children' in element ? element.children : []) : model.roots;
  }

  async getParent(element: ObjectExplorerNode): Promise<ObjectExplorerNode | undefined> {
    const model = await this.ensureModel();
    return findParentNode(model.roots, element.id);
  }

  async getViewMessage(): Promise<string | undefined> {
    const model = await this.ensureModel();
    return model.message;
  }

  async getFocusResult(): Promise<ObjectExplorerFocusResult | undefined> {
    const model = await this.ensureModel();
    const focusedNode = findObjectExplorerNodeById(model.roots, model.focusObjectId);
    if (!focusedNode || focusedNode.type !== 'object') {
      return undefined;
    }

    return {
      scope: model.scope,
      effectiveScope: model.effectiveScope,
      objectName: focusedNode.label,
      objectUri: focusedNode.uri,
    };
  }

  async getFocusedNode(): Promise<ObjectExplorerNode | undefined> {
    const model = await this.ensureModel();
    return findObjectExplorerNodeById(model.roots, model.focusObjectId);
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }

  private async ensureModel(): Promise<ObjectExplorerModel> {
    if (this.model) {
      return this.model;
    }
    if (this.pendingModel) {
      return this.pendingModel;
    }
    await this.refreshBackground();
    return this.model!;
  }
}

export class PowerBuilderObjectExplorerController implements vscode.Disposable {
  private readonly provider: ObjectExplorerProvider;
  private readonly treeView: vscode.TreeView<ObjectExplorerNode>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(loadManifest: ManifestLoader) {
    this.provider = new ObjectExplorerProvider(loadManifest);
    this.treeView = vscode.window.createTreeView('powerbuilderObjectExplorer', {
      treeDataProvider: this.provider,
      showCollapseAll: true,
    });

    this.disposables.push(
      this.treeView,
      this.provider,
    );

    void this.refresh();
  }

  async refresh(): Promise<void> {
    await this.provider.refreshBackground();
    this.treeView.message = await this.provider.getViewMessage();
  }

  async focusCurrentProject(): Promise<ObjectExplorerFocusResult | undefined> {
    this.provider.setScope('current-project');
    await this.refresh();
    const node = await this.provider.getFocusedNode();
    if (node) {
      await this.treeView.reveal(node, { focus: true, select: true, expand: true });
    }
    return this.provider.getFocusResult();
  }

  async focusCurrentFile(): Promise<ObjectExplorerFocusResult | undefined> {
    this.provider.setScope('current-file');
    await this.refresh();
    const node = await this.provider.getFocusedNode();
    if (node) {
      await this.treeView.reveal(node, { focus: true, select: true, expand: true });
    }
    return this.provider.getFocusResult();
  }

  async clearFocus(): Promise<void> {
    this.provider.clearScope();
    await this.refresh();
  }

  async openObject(target?: ObjectExplorerObjectNode | { uri?: string } | string): Promise<void> {
    const uriValue = typeof target === 'string'
      ? target
      : typeof target?.uri === 'string'
        ? target.uri
        : undefined;
    if (!uriValue) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uriValue));
    await vscode.window.showTextDocument(document, { preview: false });
  }

  dispose(): void {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}