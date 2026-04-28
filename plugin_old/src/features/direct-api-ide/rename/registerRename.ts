import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import {
    preparePowerScriptDataWindowReportChildRename,
    providePowerScriptDataWindowReportChildRenameEdits,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowChildNameOccurrences';
import {
    preparePowerScriptDataWindowColumnRename,
    providePowerScriptDataWindowColumnRenameEdits,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowColumnOccurrences';
import { RenameResolver } from '../../../powerbuilder/resolution/renameResolver';
import { formatCannotRenameEs } from '../../../core/i18n/pbUserMessages';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerRename(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();
    const resolver = new RenameResolver(host.index);

    const provider = vscode.languages.registerRenameProvider(PB_SELECTOR, {
        async prepareRename(
            document,
            position,
            _token,
        ): Promise<vscode.Range | { range: vscode.Range; placeholder: string } | undefined> {
            const linkedReportChildRenameTarget = await preparePowerScriptDataWindowReportChildRename(
                document,
                position,
                host.index,
            );

            if (linkedReportChildRenameTarget) {
                if (!linkedReportChildRenameTarget.canRename) {
                    throw new Error(formatCannotRenameEs(
                        linkedReportChildRenameTarget.placeholder ?? document.getText(document.getWordRangeAtPosition(position) ?? new vscode.Range(position, position)),
                        linkedReportChildRenameTarget.reason,
                    ));
                }

                return {
                    range: linkedReportChildRenameTarget.range ?? new vscode.Range(position, position),
                    placeholder: linkedReportChildRenameTarget.placeholder ?? document.getText(linkedReportChildRenameTarget.range ?? new vscode.Range(position, position)),
                };
            }

            const linkedRenameTarget = await preparePowerScriptDataWindowColumnRename(
                document,
                position,
                host.index,
            );

            if (linkedRenameTarget) {
                if (!linkedRenameTarget.canRename) {
                    throw new Error(formatCannotRenameEs(
                        linkedRenameTarget.placeholder ?? document.getText(document.getWordRangeAtPosition(position) ?? new vscode.Range(position, position)),
                        linkedRenameTarget.reason,
                    ));
                }

                return {
                    range: linkedRenameTarget.range ?? new vscode.Range(position, position),
                    placeholder: linkedRenameTarget.placeholder ?? document.getText(linkedRenameTarget.range ?? new vscode.Range(position, position)),
                };
            }

            return host.runWithPositionContext(
                document,
                position,
                getSymbolContextAtPosition,
                { emptyValue: undefined },
                ({ context: symbolContext }) => {
                    const renameTarget = resolver.prepareRename(
                        symbolContext.word,
                        document.uri,
                        symbolContext,
                    );

                    if (!renameTarget.canRename) {
                        throw new Error(formatCannotRenameEs(
                            symbolContext.word,
                            renameTarget.reasons[0]?.detail,
                        ));
                    }

                    return {
                        range: symbolContext.range,
                        placeholder: symbolContext.word,
                    };
                },
            );
        },

        async provideRenameEdits(
            document,
            position,
            newName,
            _token,
        ): Promise<vscode.WorkspaceEdit | undefined> {
            const linkedReportChildRenameTarget = await preparePowerScriptDataWindowReportChildRename(
                document,
                position,
                host.index,
            );

            if (linkedReportChildRenameTarget) {
                if (!linkedReportChildRenameTarget.canRename) {
                    throw new Error(formatCannotRenameEs(
                        linkedReportChildRenameTarget.placeholder ?? document.getText(document.getWordRangeAtPosition(position) ?? new vscode.Range(position, position)),
                        linkedReportChildRenameTarget.reason,
                    ));
                }

                return providePowerScriptDataWindowReportChildRenameEdits(
                    document,
                    position,
                    newName,
                    host.index,
                );
            }

            const linkedRenameTarget = await preparePowerScriptDataWindowColumnRename(
                document,
                position,
                host.index,
            );

            if (linkedRenameTarget) {
                if (!linkedRenameTarget.canRename) {
                    throw new Error(formatCannotRenameEs(
                        linkedRenameTarget.placeholder ?? document.getText(document.getWordRangeAtPosition(position) ?? new vscode.Range(position, position)),
                        linkedRenameTarget.reason,
                    ));
                }

                return providePowerScriptDataWindowColumnRenameEdits(
                    document,
                    position,
                    newName,
                    host.index,
                );
            }

            return host.runWithPositionContextAsync(
                document,
                position,
                getSymbolContextAtPosition,
                { emptyValue: undefined },
                async ({ context: symbolContext }) => resolver.computeEdits(
                    symbolContext.word,
                    newName,
                    document.uri,
                    symbolContext,
                ),
            );
        },
    });

    return [provider];
}