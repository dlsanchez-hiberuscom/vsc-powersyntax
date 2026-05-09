import * as vscode from 'vscode';

import type {
  ApiCurrentObjectContext,
  ApiReadOnlyProjectionEnvelope,
} from '../shared/publicApi';
import {
  buildCurrentObjectContextPanelModel,
  findCurrentObjectContextPanelNodeById,
  type ContextPanelLocationTarget,
  type CurrentObjectContextPanelModel,
  type CurrentObjectContextPanelNode,
} from './currentObjectContextPanelModel';
import {
  buildReadOnlyProjectionStateMessage,
  mergeReadOnlySurfaceMessages,
} from './readOnlyProjectionState';

type ContextLoader = () => Promise<ApiCurrentObjectContext>;

function buildProjectionStatusMessage(projection: ApiReadOnlyProjectionEnvelope | undefined): string | undefined {
  if (!projection) {
    return undefined;
  }

  if (projection.state === 'ready' && !projection.truncatedReason) {
    return undefined;
  }

  return buildReadOnlyProjectionStateMessage('Current Object Context', { projection });
}

export interface CurrentObjectContextPanelFocusResult {
  objectName?: string;
}

function findParentNode(roots: readonly CurrentObjectContextPanelNode[], childId: string): CurrentObjectContextPanelNode | undefined {
  const stack: Array<{ parent?: CurrentObjectContextPanelNode; node: CurrentObjectContextPanelNode }> = roots.map((node) => ({ node }));

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }
    if (current.node.id === childId) {
      return current.parent;
    }
    if (current.node.type === 'section') {
      for (const child of current.node.children) {
        stack.push({ parent: current.node, node: child });
      }
    }
  }

  return undefined;
}

class CurrentObjectContextPanelProvider implements vscode.TreeDataProvider<CurrentObjectContextPanelNode>, vscode.Disposable {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CurrentObjectContextPanelNode | undefined>();
  private model: CurrentObjectContextPanelModel | undefined;
  private pendingModel: Promise<CurrentObjectContextPanelModel> | undefined;
  private viewMessage: string | undefined;
  private dirty = true;

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly loadContext: ContextLoader) {}

  invalidate(): void {
    this.dirty = true;
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: CurrentObjectContextPanelNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.type === 'section' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
    );
    item.id = element.id;
    item.description = element.description;
    item.tooltip = element.tooltip;
    item.contextValue = `currentObjectContext.${element.type}`;
    item.iconPath = element.type === 'section'
      ? new vscode.ThemeIcon('symbol-namespace')
      : new vscode.ThemeIcon(element.target ? 'go-to-file' : 'symbol-field');

    if (element.type === 'item' && element.target) {
      item.command = {
        command: 'powerbuilder.openCurrentObjectContextLocation',
        title: 'Abrir ubicación',
        arguments: [element.target],
      };
    }

    return item;
  }

  async getChildren(element?: CurrentObjectContextPanelNode): Promise<CurrentObjectContextPanelNode[]> {
    const model = await this.ensureModel();
    return element?.type === 'section' ? element.children : model.roots;
  }

  async getParent(element: CurrentObjectContextPanelNode): Promise<CurrentObjectContextPanelNode | undefined> {
    const model = await this.ensureModel();
    return findParentNode(model.roots, element.id);
  }

  async getViewMessage(): Promise<string | undefined> {
    await this.ensureModel();
    return this.viewMessage ?? this.model?.message;
  }

  async getFocusedNode(): Promise<CurrentObjectContextPanelNode | undefined> {
    const model = await this.ensureModel();
    return findCurrentObjectContextPanelNodeById(model.roots, model.focusNodeId);
  }

  async getFocusResult(): Promise<CurrentObjectContextPanelFocusResult | undefined> {
    const model = await this.ensureModel();
    return model.objectName ? { objectName: model.objectName } : undefined;
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }

  private async ensureModel(): Promise<CurrentObjectContextPanelModel> {
    if (!this.dirty && this.model) {
      return this.model;
    }

    if (this.pendingModel) {
      return this.pendingModel;
    }

    this.pendingModel = this.loadContext()
      .then((context) => {
        const model = buildCurrentObjectContextPanelModel(context);
        const projectionMessage = mergeReadOnlySurfaceMessages(
          buildProjectionStatusMessage(context.dataWindowBindingReceipt?.projection),
          buildProjectionStatusMessage(context.embeddedSqlReceipt?.projection),
        );
        this.viewMessage = mergeReadOnlySurfaceMessages(
          projectionMessage ?? buildReadOnlyProjectionStateMessage('Current Object Context', {
            projection: context.dataWindowBindingReceipt?.projection ?? context.embeddedSqlReceipt?.projection,
          }),
          model.message,
        );
        return model;
      })
      .catch((error) => {
        const errorMessage = `Current Object Context no disponible: ${error instanceof Error ? error.message : String(error)}`;
        this.viewMessage = buildReadOnlyProjectionStateMessage('Current Object Context', {
          state: 'error',
          detail: errorMessage,
        });
        return {
          message: errorMessage,
          roots: [],
        };
      })
      .then((model) => {
        this.model = model;
        this.dirty = false;
        return model;
      })
      .finally(() => {
        this.pendingModel = undefined;
      });

    return this.pendingModel;
  }
}

export class CurrentObjectContextPanelController implements vscode.Disposable {
  private readonly provider: CurrentObjectContextPanelProvider;
  private readonly treeView: vscode.TreeView<CurrentObjectContextPanelNode>;
  private readonly disposables: vscode.Disposable[] = [];
  private refreshTimeout: NodeJS.Timeout | undefined;

  constructor(loadContext: ContextLoader) {
    this.provider = new CurrentObjectContextPanelProvider(loadContext);
    this.treeView = vscode.window.createTreeView('powerbuilderCurrentObjectContext', {
      treeDataProvider: this.provider,
      showCollapseAll: true,
    });

    this.disposables.push(
      this.treeView,
      this.provider,
      vscode.window.onDidChangeActiveTextEditor(() => {
        void this.refresh();
      }),
      vscode.window.onDidChangeTextEditorSelection(() => {
        void this.refresh();
      })
    );

    void this.refresh();
  }

  async refresh(immediate = false): Promise<void> {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
    
    if (immediate) {
      this.provider.invalidate();
      this.treeView.message = buildReadOnlyProjectionStateMessage('Current Object Context', { state: 'loading' });
      this.treeView.message = await this.provider.getViewMessage();
    } else {
      this.refreshTimeout = setTimeout(async () => {
        this.provider.invalidate();
        this.treeView.message = buildReadOnlyProjectionStateMessage('Current Object Context', { state: 'loading' });
        this.treeView.message = await this.provider.getViewMessage();
      }, 500);
    }
  }

  async focusPanel(): Promise<CurrentObjectContextPanelFocusResult | undefined> {
    await this.refresh(true);
    const node = await this.provider.getFocusedNode();
    if (node) {
      await this.treeView.reveal(node, { focus: true, select: true, expand: true });
    }
    return this.provider.getFocusResult();
  }

  async openLocation(target?: ContextPanelLocationTarget): Promise<void> {
    if (!target?.uri) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(target.uri));
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    if (typeof target.line === 'number' && typeof target.character === 'number') {
      const position = new vscode.Position(target.line, target.character);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
  }

  dispose(): void {
    vscode.Disposable.from(...this.disposables).dispose();
  }
}