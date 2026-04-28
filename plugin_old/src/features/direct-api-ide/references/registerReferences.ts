import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import { providePowerScriptDataWindowReportChildReferences } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowChildNameOccurrences';
import { providePowerScriptDataWindowColumnReferences } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowColumnOccurrences';
import { ReferenceResolver } from '../../../powerbuilder/resolution/referenceResolver';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerReferences(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();
    const resolver = new ReferenceResolver(host.index);

    const provider = vscode.languages.registerReferenceProvider(PB_SELECTOR, {
        async provideReferences(
            document,
            position,
            context,
            _token,
        ): Promise<vscode.Location[] | undefined> {
            const linkedReportChildLocations = await providePowerScriptDataWindowReportChildReferences(
                document,
                position,
                context.includeDeclaration,
                host.index,
            );

            if (linkedReportChildLocations !== undefined) {
                return linkedReportChildLocations;
            }

            const linkedDataWindowLocations = await providePowerScriptDataWindowColumnReferences(
                document,
                position,
                context.includeDeclaration,
                host.index,
            );

            if (linkedDataWindowLocations !== undefined) {
                return linkedDataWindowLocations;
            }

            return host.runWithPositionContextAsync(
                document,
                position,
                getSymbolContextAtPosition,
                { emptyValue: undefined },
                async ({ context: symbolContext }) => {
                    const locations = await resolver.resolveInWorkspace(
                        symbolContext.word,
                        document.uri,
                        context.includeDeclaration,
                        symbolContext,
                    );

                    return locations.length > 0 ? locations : undefined;
                },
            );
        },
    });

    return [provider];
}