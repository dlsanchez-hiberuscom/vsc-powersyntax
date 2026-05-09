import * as vscode from 'vscode';

import {
  buildDiagnosticsExplainabilityPanelModel,
  findDiagnosticsExplainabilityNodeById,
  type DiagnosticsExplainabilityLocationTarget,
  type DiagnosticsExplainabilityPanelModel,
  type DiagnosticsExplainabilityPanelNode,
  type ExplainableDiagnosticInput,
} from './diagnosticsExplainabilityPanelModel';
import { getDiagnosticCode } from '../shared/diagnosticCodes';
import {
  buildReadOnlyProjectionStateMessage,
  mergeReadOnlySurfaceMessages,
} from './readOnlyProjectionState';

type DiagnosticsLoader = () => Promise<ExplainableDiagnosticInput[]>;

function findParentNode(
  roots: readonly DiagnosticsExplainabilityPanelNode[],
  childId: string,
): DiagnosticsExplainabilityPanelNode | undefined {
  const queue: Array<{ parent?: DiagnosticsExplainabilityPanelNode; node: DiagnosticsExplainabilityPanelNode }> = roots.map((node) => ({ node }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current.node.id === childId) {
      return current.parent;
    }
    if (current.node.type === 'section') {
      for (const child of current.node.children) {
        queue.push({ parent: current.node, node: child });
      }
    }
  }

  return undefined;
}

class DiagnosticsExplainabilityPanelProvider implements vscode.TreeDataProvider<DiagnosticsExplainabilityPanelNode>, vscode.Disposable {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<DiagnosticsExplainabilityPanelNode | undefined>();
  private model: DiagnosticsExplainabilityPanelModel | undefined;
  private pendingModel: Promise<DiagnosticsExplainabilityPanelModel> | undefined;
  private viewMessage: string | undefined;
  private dirty = true;

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly loadDiagnostics: DiagnosticsLoader) {}

  invalidate(): void {
    this.dirty = true;
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: DiagnosticsExplainabilityPanelNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.type === 'section' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
    );
    item.id = element.id;
    item.description = element.description;
    item.tooltip = element.tooltip;
    item.contextValue = `diagnosticsExplainability.${element.type}`;
    item.iconPath = element.type === 'section'
      ? new vscode.ThemeIcon('comment-discussion')
      : new vscode.ThemeIcon(element.target ? 'go-to-file' : 'info');

    if (element.type === 'item' && element.target) {
      item.command = {
        command: 'powerbuilder.openDiagnosticsExplainabilityLocation',
        title: 'Abrir ubicación del diagnostic',
        arguments: [element.target],
      };
    }

    return item;
  }

  async getChildren(element?: DiagnosticsExplainabilityPanelNode): Promise<DiagnosticsExplainabilityPanelNode[]> {
    const model = await this.ensureModel();
    return element?.type === 'section' ? element.children : model.roots;
  }

  async getParent(element: DiagnosticsExplainabilityPanelNode): Promise<DiagnosticsExplainabilityPanelNode | undefined> {
    const model = await this.ensureModel();
    return findParentNode(model.roots, element.id);
  }

  async getViewMessage(): Promise<string | undefined> {
    await this.ensureModel();
    return this.viewMessage ?? this.model?.message;
  }

  async getFocusedNode(): Promise<DiagnosticsExplainabilityPanelNode | undefined> {
    const model = await this.ensureModel();
    return findDiagnosticsExplainabilityNodeById(model.roots, model.focusNodeId);
  }

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }

  private async ensureModel(): Promise<DiagnosticsExplainabilityPanelModel> {
    if (!this.dirty && this.model) {
      return this.model;
    }

    if (this.pendingModel) {
      return this.pendingModel;
    }

    this.pendingModel = this.loadDiagnostics()
      .then((diagnostics) => buildDiagnosticsExplainabilityPanelModel(diagnostics))
      .then((model) => {
        this.viewMessage = mergeReadOnlySurfaceMessages(
          buildReadOnlyProjectionStateMessage('Diagnostics Explainability', { state: 'ready' }),
          model.message,
        );
        return model;
      })
      .catch((error) => {
        const errorMessage = `Diagnostics Explainability no disponible: ${error instanceof Error ? error.message : String(error)}`;
        this.viewMessage = buildReadOnlyProjectionStateMessage('Diagnostics Explainability', {
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

export class DiagnosticsExplainabilityPanelController implements vscode.Disposable {
  private readonly provider: DiagnosticsExplainabilityPanelProvider;
  private readonly treeView: vscode.TreeView<DiagnosticsExplainabilityPanelNode>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(loadDiagnostics: DiagnosticsLoader) {
    this.provider = new DiagnosticsExplainabilityPanelProvider(loadDiagnostics);
    this.treeView = vscode.window.createTreeView('powerbuilderDiagnosticsExplainability', {
      treeDataProvider: this.provider,
      showCollapseAll: true,
    });

    this.disposables.push(
      this.treeView,
      this.provider,
      vscode.window.onDidChangeActiveTextEditor(() => {
        void this.refresh();
      }),
      vscode.languages.onDidChangeDiagnostics(() => {
        void this.refresh();
      }),
    );

    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.provider.invalidate();
    this.treeView.message = buildReadOnlyProjectionStateMessage('Diagnostics Explainability', { state: 'loading' });
    this.treeView.message = await this.provider.getViewMessage();
  }

  async focusPanel(): Promise<boolean> {
    await this.refresh();
    const node = await this.provider.getFocusedNode();
    if (!node) {
      return false;
    }
    await this.treeView.reveal(node, { focus: true, select: true, expand: true });
    return true;
  }

  async openLocation(target?: DiagnosticsExplainabilityLocationTarget): Promise<void> {
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

export function collectExplainableDiagnosticsFromActiveEditor(): ExplainableDiagnosticInput[] {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return [];
  }

  return vscode.languages.getDiagnostics(editor.document.uri).map((diagnostic) => {
    const normalizedCode = typeof diagnostic.code === 'object' && diagnostic.code
      ? diagnostic.code.value
      : diagnostic.code;
    const code = getDiagnosticCode({ code: normalizedCode, source: diagnostic.source });

    return ({
    uri: editor.document.uri.toString(),
    message: diagnostic.message,
    ...(code ? { code } : {}),
    severity: mapSeverity(diagnostic.severity),
    line: diagnostic.range.start.line,
    character: diagnostic.range.start.character,
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
    });
  });
}

function mapSeverity(severity: vscode.DiagnosticSeverity): ExplainableDiagnosticInput['severity'] {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return 'error';
    case vscode.DiagnosticSeverity.Warning:
      return 'warning';
    case vscode.DiagnosticSeverity.Information:
      return 'info';
    case vscode.DiagnosticSeverity.Hint:
      return 'hint';
    default:
      return 'info';
  }
}