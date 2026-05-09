import * as vscode from 'vscode';

import type {
  ApiObjectExplorerProjectionNode,
  ApiObjectExplorerProjectionNodePath,
  ApiObjectExplorerProjectionPage,
  ApiObjectExplorerProjectionRequest,
  ApiSemanticWorkspaceManifest,
} from '../shared/publicApi';
import {
  buildObjectExplorerModel,
  findObjectExplorerNodeById,
  type ObjectExplorerModel,
  type ObjectExplorerNode,
  type ObjectExplorerObjectNode,
  type ObjectExplorerScope,
} from './objectExplorerModel';
import {
  appendObjectExplorerProjectionPage,
  isObjectExplorerLoadMoreNode,
  type ObjectExplorerLoadMoreNode,
  type ObjectExplorerProjectionTreeNode,
} from './objectExplorerProjectionModel';
import {
  buildReadOnlyProjectionStateMessage,
  mergeReadOnlySurfaceMessages,
} from './readOnlyProjectionState';

type ManifestLoader = () => Promise<ApiSemanticWorkspaceManifest>;
type ProjectionLoader = (request: ApiObjectExplorerProjectionRequest) => Promise<ApiObjectExplorerProjectionPage>;

const ROOT_PARENT_ID = '__root__';
const OBJECT_EXPLORER_PAGE_SIZE = 50;

export interface ObjectExplorerFocusResult {
  scope: ObjectExplorerScope;
  effectiveScope: ObjectExplorerScope;
  objectName?: string;
  objectUri?: string;
}

function themeIconForNode(node: { type: string; objectKind?: string }): vscode.ThemeIcon | undefined {
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

function basenameFromUri(uri: string | undefined): string {
  if (!uri) {
    return 'sin dato';
  }

  const normalized = uri.replace(/\/+$/, '');
  const segment = normalized.slice(normalized.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function objectNameFromUri(uri: string | undefined): string {
  const baseName = basenameFromUri(uri);
  const extensionIndex = baseName.lastIndexOf('.');
  return extensionIndex > 0 ? baseName.slice(0, extensionIndex) : baseName;
}

function objectUriFromFocusNodeId(focusNodeId: string | undefined): string | undefined {
  if (!focusNodeId?.startsWith('object:')) {
    return undefined;
  }

  return focusNodeId.slice('object:'.length);
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

class ObjectExplorerProvider implements vscode.TreeDataProvider<ObjectExplorerNode | ObjectExplorerProjectionTreeNode>, vscode.Disposable {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<ObjectExplorerNode | ObjectExplorerProjectionTreeNode | undefined>();
  private readonly pagedChildren = new Map<string, ObjectExplorerProjectionTreeNode[]>();
  private readonly pagedNodeIndex = new Map<string, ApiObjectExplorerProjectionNode>();
  private readonly pagedParentIndex = new Map<string, string | undefined>();
  private readonly pendingPagedChildren = new Map<string, Promise<ObjectExplorerProjectionTreeNode[]>>();
  private scope: ObjectExplorerScope = 'workspace';
  private model: ObjectExplorerModel | undefined;
  private pendingModel: Promise<ObjectExplorerModel> | undefined;
  private pendingRootLoad: Promise<void> | undefined;
  private effectiveScope: ObjectExplorerScope = 'workspace';
  private focusNodeId: string | undefined;
  private viewMessage: string | undefined;
  private useLegacyFallback = false;

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(
    private readonly loadProjection: ProjectionLoader,
    private readonly loadManifest: ManifestLoader,
  ) { }

  setScope(scope: ObjectExplorerScope): void {
    this.scope = scope;
    void this.refreshBackground();
  }

  clearScope(): void {
    this.scope = 'workspace';
    void this.refreshBackground();
  }

  async refreshBackground(): Promise<void> {
    if (this.pendingRootLoad) {
      await this.pendingRootLoad;
      return;
    }

    this.model = undefined;
    this.pendingModel = undefined;
    this.useLegacyFallback = false;
    this.pagedChildren.clear();
    this.pagedNodeIndex.clear();
    this.pagedParentIndex.clear();
    this.pendingPagedChildren.clear();
    this.focusNodeId = undefined;
    this.viewMessage = undefined;
    this.effectiveScope = this.scope;

    this.pendingRootLoad = this.ensurePagedChildrenLoaded()
      .then(() => {
        this.onDidChangeTreeDataEmitter.fire(undefined);
      })
      .catch(async (error) => {
        await this.enableLegacyFallback(error);
        this.onDidChangeTreeDataEmitter.fire(undefined);
      })
      .finally(() => {
        this.pendingRootLoad = undefined;
      });

    await this.pendingRootLoad;
  }

  getTreeItem(element: ObjectExplorerNode | ObjectExplorerProjectionTreeNode): vscode.TreeItem {
    if (isObjectExplorerLoadMoreNode(element)) {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.id = element.id;
      item.description = element.description;
      item.tooltip = element.tooltip;
      item.contextValue = 'powerbuilderObjectExplorer.load-more';
      item.iconPath = new vscode.ThemeIcon('chevron-down');
      item.command = {
        command: 'powerbuilder.loadMoreObjectExplorerNodes',
        title: 'Cargar más',
        arguments: [element],
      };
      return item;
    }

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

    if (element.type === 'object' && typeof element.uri === 'string') {
      item.resourceUri = vscode.Uri.parse(element.uri);
      item.command = {
        command: 'powerbuilder.openObjectExplorerObject',
        title: 'Abrir objeto',
        arguments: [element],
      };
    }

    return item;
  }

  async getChildren(element?: ObjectExplorerNode | ObjectExplorerProjectionTreeNode): Promise<Array<ObjectExplorerNode | ObjectExplorerProjectionTreeNode>> {
    if (this.useLegacyFallback) {
      const model = await this.ensureLegacyModel();
      return element && !isObjectExplorerLoadMoreNode(element)
        ? ('children' in element ? element.children : [])
        : model.roots;
    }

    if (isObjectExplorerLoadMoreNode(element)) {
      return [];
    }

    try {
      return await this.ensurePagedChildrenLoaded(element as ApiObjectExplorerProjectionNode | undefined);
    } catch (error) {
      await this.enableLegacyFallback(error);
      const model = await this.ensureLegacyModel();
      return element && !isObjectExplorerLoadMoreNode(element)
        ? ('children' in element ? element.children : [])
        : model.roots;
    }
  }

  async getParent(element: ObjectExplorerNode | ObjectExplorerProjectionTreeNode): Promise<ObjectExplorerNode | ObjectExplorerProjectionTreeNode | undefined> {
    if (this.useLegacyFallback) {
      const model = await this.ensureLegacyModel();
      return findParentNode(model.roots, element.id);
    }

    if (isObjectExplorerLoadMoreNode(element)) {
      return element.parentId ? this.pagedNodeIndex.get(element.parentId) : undefined;
    }

    const parentId = this.pagedParentIndex.get(element.id);
    return parentId ? this.pagedNodeIndex.get(parentId) : undefined;
  }

  async getViewMessage(): Promise<string | undefined> {
    if (this.useLegacyFallback) {
      return (await this.ensureLegacyModel()).message;
    }

    try {
      await this.ensurePagedChildrenLoaded();
      return this.viewMessage;
    } catch (error) {
      await this.enableLegacyFallback(error);
      return (await this.ensureLegacyModel()).message;
    }
  }

  async getFocusResult(): Promise<ObjectExplorerFocusResult | undefined> {
    if (this.useLegacyFallback) {
      const model = await this.ensureLegacyModel();
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

    try {
      await this.ensurePagedChildrenLoaded();
    } catch (error) {
      await this.enableLegacyFallback(error);
      return this.getFocusResult();
    }

    const focusedNode = this.focusNodeId ? this.pagedNodeIndex.get(this.focusNodeId) : undefined;
    if (focusedNode?.type === 'object') {
      return {
        scope: this.scope,
        effectiveScope: this.effectiveScope,
        objectName: focusedNode.label,
        objectUri: focusedNode.uri,
      };
    }

    const focusedObjectUri = objectUriFromFocusNodeId(this.focusNodeId) ?? this.getActiveUri();
    if (!focusedObjectUri || this.scope === 'workspace') {
      return undefined;
    }

    return {
      scope: this.scope,
      effectiveScope: this.effectiveScope,
      objectName: objectNameFromUri(focusedObjectUri),
      objectUri: focusedObjectUri,
    };
  }

  async getFocusedNode(): Promise<ObjectExplorerNode | ApiObjectExplorerProjectionNode | undefined> {
    if (this.useLegacyFallback) {
      const model = await this.ensureLegacyModel();
      return findObjectExplorerNodeById(model.roots, model.focusObjectId);
    }

    try {
      await this.ensurePagedChildrenLoaded();
      return this.focusNodeId ? this.pagedNodeIndex.get(this.focusNodeId) : undefined;
    } catch (error) {
      await this.enableLegacyFallback(error);
      return this.getFocusedNode();
    }
  }

  async loadMore(target?: ObjectExplorerLoadMoreNode): Promise<void> {
    if (this.useLegacyFallback || !target?.cursor) {
      return;
    }

    const parentNode = target.parentId ? this.pagedNodeIndex.get(target.parentId) : undefined;
    try {
      await this.loadProjectionChildren(parentNode, target.cursor, target.parentPath, target.pageSize);
      this.onDidChangeTreeDataEmitter.fire(parentNode);
    } catch (error) {
      await this.enableLegacyFallback(error);
      this.onDidChangeTreeDataEmitter.fire(undefined);
    }
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }

  private getActiveUri(): string | undefined {
    return vscode.window.activeTextEditor?.document.uri.toString();
  }

  private async ensureLegacyModel(): Promise<ObjectExplorerModel> {
    if (this.model) {
      return this.model;
    }
    if (this.pendingModel) {
      return this.pendingModel;
    }
    await this.enableLegacyFallback(new Error('Object Explorer fallback legacy activado.'));
    return this.model!;
  }

  private async enableLegacyFallback(error: unknown): Promise<void> {
    this.useLegacyFallback = true;
    this.pendingModel = this.loadManifest()
      .then((manifest) => buildObjectExplorerModel(manifest, this.scope, this.getActiveUri()))
      .catch((legacyError) => ({
        scope: this.scope,
        effectiveScope: 'workspace' as ObjectExplorerScope,
        message: `Object Explorer no disponible: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`,
        roots: [],
      }))
      .then((model) => {
        if (!model.message && error instanceof Error) {
          model.message = `Object Explorer paginado no disponible; fallback legacy activo: ${error.message}`;
        }
        this.model = model;
        return model;
      })
      .finally(() => {
        this.pendingModel = undefined;
      });

    await this.pendingModel;
  }

  private async ensurePagedChildrenLoaded(parent?: ApiObjectExplorerProjectionNode): Promise<ObjectExplorerProjectionTreeNode[]> {
    const key = parent?.id ?? ROOT_PARENT_ID;
    const cached = this.pagedChildren.get(key);
    if (cached) {
      return cached;
    }

    const pending = this.pendingPagedChildren.get(key);
    if (pending) {
      return pending;
    }

    const load = this.loadProjectionChildren(parent);
    this.pendingPagedChildren.set(key, load);
    return load.finally(() => {
      this.pendingPagedChildren.delete(key);
    });
  }

  private async loadProjectionChildren(
    parent?: ApiObjectExplorerProjectionNode,
    cursor?: string,
    parentPathOverride?: ApiObjectExplorerProjectionNodePath,
    pageSize: number = OBJECT_EXPLORER_PAGE_SIZE,
  ): Promise<ObjectExplorerProjectionTreeNode[]> {
    const key = parent?.id ?? ROOT_PARENT_ID;
    const parentPath = parentPathOverride ?? parent?.path;
    const activeUri = this.getActiveUri();
    const page = await this.loadProjection({
      scope: this.scope,
      ...(activeUri ? { activeUri } : {}),
      ...(parent?.id ? { parentId: parent.id } : {}),
      ...(parentPath ? { parentPath } : {}),
      ...(cursor ? { cursor } : {}),
      pageSize,
    });
    const merged = appendObjectExplorerProjectionPage(cursor ? (this.pagedChildren.get(key) ?? []) : [], page);

    this.pagedChildren.set(key, merged);
    this.effectiveScope = page.effectiveScope;
    this.focusNodeId = page.focusNodeId;
    if (!parent) {
      this.viewMessage = mergeReadOnlySurfaceMessages(
        buildReadOnlyProjectionStateMessage('Object Explorer', {
          projection: page.projection,
        }),
        page.message,
      );
    }

    for (const node of page.nodes) {
      this.pagedNodeIndex.set(node.id, node);
      this.pagedParentIndex.set(node.id, parent?.id);
    }

    for (const node of merged) {
      if (isObjectExplorerLoadMoreNode(node)) {
        this.pagedParentIndex.set(node.id, parent?.id);
      }
    }

    return merged;
  }
}

export class PowerBuilderObjectExplorerController implements vscode.Disposable {
  private readonly provider: ObjectExplorerProvider;
  private readonly treeView: vscode.TreeView<ObjectExplorerNode | ObjectExplorerProjectionTreeNode>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(loadProjection: ProjectionLoader, loadManifest: ManifestLoader) {
    this.provider = new ObjectExplorerProvider(loadProjection, loadManifest);
    this.treeView = vscode.window.createTreeView('powerbuilderObjectExplorer', {
      treeDataProvider: this.provider,
      showCollapseAll: true,
    });

    this.disposables.push(
      this.treeView,
      this.provider,
    );
  }

  async refresh(): Promise<void> {
    this.treeView.message = buildReadOnlyProjectionStateMessage('Object Explorer', { state: 'loading' });
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

  async loadMore(target?: ObjectExplorerLoadMoreNode): Promise<void> {
    this.treeView.message = buildReadOnlyProjectionStateMessage('Object Explorer', { state: 'loading' });
    await this.provider.loadMore(target);
    this.treeView.message = await this.provider.getViewMessage();
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