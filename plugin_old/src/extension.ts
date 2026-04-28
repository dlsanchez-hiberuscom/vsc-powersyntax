import * as vscode from 'vscode';
import { registerExtension } from './bootstrap/registerExtension';
import { createPowerBuilderExtensionApi, PowerBuilderExtensionApi } from './publicApi';

export function activate(context: vscode.ExtensionContext): PowerBuilderExtensionApi {
    const disposables = registerExtension(context);
    context.subscriptions.push(...disposables);

    return createPowerBuilderExtensionApi();
}

export function deactivate(): void {
    // VS Code liberará automáticamente context.subscriptions.
}