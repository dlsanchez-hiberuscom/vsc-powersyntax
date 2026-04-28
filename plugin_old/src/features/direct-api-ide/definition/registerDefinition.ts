import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { isDataWindowUri } from '../../../core/utils/powerBuilderFileUtils';
import { provideDataWindowDefinition } from '../../../powerbuilder/datawindow/pbDataWindowDefinition';
import { providePowerScriptDataWindowChildDefinition } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowChildren';
import { providePowerScriptDataWindowPropertyDefinition } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowProperties';
import {
    providePowerScriptDataWindowColumnDefinition,
    providePowerScriptDataWindowDefinition,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowLinks';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import { SemanticQueryService } from '../../../powerbuilder/semantic';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerDefinition(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();
    const semanticQueries = new SemanticQueryService(host.index);

    const resolveLinkedDeclarationLocations = async (
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<vscode.Location[] | undefined> => {
        if (isDataWindowUri(document.uri)) {
            return provideDataWindowDefinition(document, position);
        }

        const linkedDataWindowChildLocations = await providePowerScriptDataWindowChildDefinition(
            document,
            position,
            host.index,
        );

        if (linkedDataWindowChildLocations?.length) {
            return linkedDataWindowChildLocations;
        }

        const linkedDataWindowPropertyLocations = await providePowerScriptDataWindowPropertyDefinition(
            document,
            position,
            host.index,
        );

        if (linkedDataWindowPropertyLocations?.length) {
            return linkedDataWindowPropertyLocations;
        }

        const linkedDataWindowColumnLocations = await providePowerScriptDataWindowColumnDefinition(
            document,
            position,
            host.index,
        );

        if (linkedDataWindowColumnLocations?.length) {
            return linkedDataWindowColumnLocations;
        }

        return providePowerScriptDataWindowDefinition(
            document,
            position,
        );
    };

    const resolveSemanticLocations = (
        document: vscode.TextDocument,
        position: vscode.Position,
        query: (args: {
            word: string;
            uri: vscode.Uri;
            symbolContext: ReturnType<typeof getSymbolContextAtPosition>;
        }) => { locations: vscode.Location[] },
    ) => host.runWithPositionContext(
        document,
        position,
        getSymbolContextAtPosition,
        { emptyValue: undefined },
        ({ context: symbolContext }) => {
            const locations = query({
                word: symbolContext.word,
                uri: document.uri,
                symbolContext,
            }).locations;

            return locations.length > 0 ? locations : undefined;
        },
    );

    const provider = vscode.languages.registerDefinitionProvider(PB_SELECTOR, {
        async provideDefinition(document, position, _token): Promise<vscode.Location[] | undefined> {
            const linkedDataWindowLocations = await resolveLinkedDeclarationLocations(document, position);

            if (linkedDataWindowLocations?.length) {
                return linkedDataWindowLocations;
            }

            return resolveSemanticLocations(
                document,
                position,
                args => semanticQueries.resolveDefinition(args),
            );
        },
    });

    const declarationProvider = vscode.languages.registerDeclarationProvider(PB_SELECTOR, {
        async provideDeclaration(document, position, _token): Promise<vscode.Location[] | undefined> {
            const linkedDataWindowLocations = await resolveLinkedDeclarationLocations(document, position);

            if (linkedDataWindowLocations?.length) {
                return linkedDataWindowLocations;
            }

            return resolveSemanticLocations(
                document,
                position,
                args => semanticQueries.resolveDeclaration(args),
            );
        },
    });

    const implementationProvider = vscode.languages.registerImplementationProvider(PB_SELECTOR, {
        async provideImplementation(document, position, _token): Promise<vscode.Location[] | undefined> {
            if (isDataWindowUri(document.uri)) {
                return undefined;
            }

            return resolveSemanticLocations(
                document,
                position,
                args => semanticQueries.resolveImplementations(args),
            );
        },
    });

    return [provider, declarationProvider, implementationProvider];
}