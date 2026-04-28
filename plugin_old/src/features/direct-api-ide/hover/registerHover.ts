import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getConfig } from '../../../core/config/extensionConfiguration';
import { isDataWindowUri } from '../../../core/utils/powerBuilderFileUtils';
import { provideDataWindowHover } from '../../../powerbuilder/datawindow/pbDataWindowHover';
import { providePowerScriptDataWindowChildHover } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowChildren';
import { providePowerScriptDataWindowPropertyHover } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowProperties';
import {
    providePowerScriptDataWindowColumnHover,
    providePowerScriptDataWindowHover,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowLinks';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import { HoverResolver } from '../../../powerbuilder/resolution/hoverResolver';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerHover(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();
    const resolver = new HoverResolver(host.index);

    const provider = vscode.languages.registerHoverProvider(PB_SELECTOR, {
        async provideHover(document, position, _token): Promise<vscode.Hover | undefined> {
            if (!getConfig().hoverEnabled) {
                return undefined;
            }

            if (isDataWindowUri(document.uri)) {
                return provideDataWindowHover(document, position);
            }

            const linkedDataWindowChildHover = await providePowerScriptDataWindowChildHover(
                document,
                position,
                host.index,
            );

            if (linkedDataWindowChildHover) {
                return linkedDataWindowChildHover;
            }

            const linkedDataWindowPropertyHover = await providePowerScriptDataWindowPropertyHover(
                document,
                position,
                host.index,
            );

            if (linkedDataWindowPropertyHover) {
                return linkedDataWindowPropertyHover;
            }

            const linkedDataWindowColumnHover = await providePowerScriptDataWindowColumnHover(
                document,
                position,
                host.index,
            );

            if (linkedDataWindowColumnHover) {
                return linkedDataWindowColumnHover;
            }

            const linkedDataWindowHover = await providePowerScriptDataWindowHover(
                document,
                position,
            );

            if (linkedDataWindowHover) {
                return linkedDataWindowHover;
            }

            return host.runWithPositionContext(
                document,
                position,
                getSymbolContextAtPosition,
                {
                    emptyValue: undefined,
                    isFeatureEnabled: config => config.hoverEnabled,
                },
                ({ context: symbolContext }) => {
                    const markdown = resolver.resolve(
                        symbolContext.word,
                        document.uri,
                        position,
                        symbolContext,
                    );

                    if (!markdown) {
                        return undefined;
                    }

                    const markdownString = new vscode.MarkdownString(markdown);
                    markdownString.isTrusted = false;

                    return new vscode.Hover(markdownString, symbolContext.range);
                },
            );
        },
    });

    return [provider];
}