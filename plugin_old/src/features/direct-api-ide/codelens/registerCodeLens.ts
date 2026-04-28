import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { isDataWindowUri } from '../../../core/utils/powerBuilderFileUtils';
import { provideDataWindowCodeLenses } from '../../../powerbuilder/datawindow/pbDataWindowCodeLens';
import { providePowerScriptCodeLenses } from '../../../powerbuilder/semantic/pbPowerScriptCodeLens';

export function registerCodeLens(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const provider = vscode.languages.registerCodeLensProvider(PB_SELECTOR, {
        async provideCodeLenses(document, _token): Promise<vscode.CodeLens[] | undefined> {
            if (!isDataWindowUri(document.uri)) {
                return providePowerScriptCodeLenses(document);
            }

            return provideDataWindowCodeLenses(document);
        },
    });

    return [provider];
}