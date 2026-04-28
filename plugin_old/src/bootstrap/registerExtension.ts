import * as vscode from 'vscode';
import { Logger } from '../core/logging/logger';
import { registerCoreServices } from './registerCoreServices';
import { registerPhase4DirectApiIdeFeatures } from './registerPhase4DirectApiIdeFeatures';
import { PB_USER_MESSAGES } from '../core/i18n/pbUserMessages';

export function registerExtension(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    Logger.initialize();
    disposables.push(Logger.outputChannel);

    Logger.info(PB_USER_MESSAGES.logs.extensionActivating);

    // Estado por defecto hasta que registerCoreServices evalúe el workspace real.
    void vscode.commands.executeCommand(
        'setContext',
        'workspaceHasPowerBuilderFiles',
        false,
    );

    const coreDisposables = registerCoreServices(context);
    disposables.push(...coreDisposables);

    const featureDisposables = registerPhase4DirectApiIdeFeatures(context);
    disposables.push(...featureDisposables);

    Logger.info(PB_USER_MESSAGES.logs.extensionActivated);
    return disposables;
}