import * as vscode from 'vscode';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { PowerBuilderProjectRegistry } from '../../../powerbuilder/workspace/projectRegistry';
import { PB_LANGUAGE_ID } from '../../../core/config/constants';
import { getConfig } from '../../../core/config/extensionConfiguration';
import { isIdeSafePowerBuilderDocument } from '../../../core/utils/powerBuilderFileUtils';
import {
    PB_USER_MESSAGES,
    formatStatusBarTextEs,
    formatStatusBarTooltipEs,
} from '../../../core/i18n/pbUserMessages';

export function registerStatusBar(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const statusItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        50,
    );

    const index = SymbolIndex.getInstance();
    const projectRegistry = PowerBuilderProjectRegistry.getInstance();

    statusItem.command = 'powerbuilder.reindexWorkspace';

    const update = (): void => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== PB_LANGUAGE_ID) {
            statusItem.text = '';
            statusItem.tooltip = undefined;
            statusItem.hide();
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            statusItem.text = '$(warning) PB: DataWindow IDE off';
            statusItem.tooltip = PB_USER_MESSAGES.statusBar.dataWindowExperimentalDisabled;
            statusItem.show();
            return;
        }

        if (index.isInitialWorkspaceIndexing) {
            statusItem.text = '$(sync~spin) PB: indexando...';
            statusItem.tooltip = PB_USER_MESSAGES.statusBar.indexingWorkspace;
            statusItem.show();
            return;
        }

        const preferredProject = projectRegistry.getPreferredProjectForSourceFile(editor.document.uri);
        const rootLabels = preferredProject
            ? projectRegistry
                .getEffectiveProjectSourceRoots(preferredProject)
                .map(rootUri =>
                    vscode.workspace.asRelativePath(rootUri, false) ||
                    rootUri.fsPath ||
                    rootUri.path,
                )
            : [];

        statusItem.text = `$(symbol-class) ${formatStatusBarTextEs(
            index.symbolCount,
            index.fileCount,
            preferredProject?.name,
        )}`;

        statusItem.tooltip = formatStatusBarTooltipEs(
            index.symbolCount,
            index.fileCount,
            {
                projectName: preferredProject?.name,
                rootLabels,
            },
        );

        statusItem.show();
    };

    const onEditor = vscode.window.onDidChangeActiveTextEditor(update);
    const onVisibleEditors = vscode.window.onDidChangeVisibleTextEditors(update);
    const onIndexChanged = index.onDidChange(update);
    const onConfig = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('powerbuilder.datawindow.experimentalIde.enabled')) {
            update();
        }
    });

    update();

    return [
        statusItem,
        onEditor,
        onVisibleEditors,
        onIndexChanged,
        onConfig,
    ];
}