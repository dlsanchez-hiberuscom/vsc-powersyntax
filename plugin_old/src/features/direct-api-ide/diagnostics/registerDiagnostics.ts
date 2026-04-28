import * as vscode from 'vscode';
import { DiagnosticResolver } from '../../../powerbuilder/resolution/diagnosticResolver';
import { analyzeDataWindowDiagnostics } from '../../../powerbuilder/datawindow/pbDataWindowDiagnostics';
import { analyzePowerScriptDataWindowLinkDiagnostics } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowLinks';
import { getConfig } from '../../../core/config/extensionConfiguration';
import { PB_LANGUAGE_ID } from '../../../core/config/constants';
import {
    isDataWindowUri,
    isIdeSafePowerBuilderDocument,
} from '../../../core/utils/powerBuilderFileUtils';

export function registerDiagnostics(context: vscode.ExtensionContext): vscode.Disposable[] {
    const collection = vscode.languages.createDiagnosticCollection('powerbuilder');
    const resolver = new DiagnosticResolver();
    const documentVersions = new Map<string, number>();

    async function updateDiagnostics(document: vscode.TextDocument): Promise<void> {
        if (document.languageId !== PB_LANGUAGE_ID) { return; }

        const config = getConfig();
        const versionKey = document.uri.toString();
        const nextVersion = (documentVersions.get(versionKey) ?? 0) + 1;

        documentVersions.set(versionKey, nextVersion);

        if (!isIdeSafePowerBuilderDocument(document, config.dataWindowExperimentalIdeEnabled)) {
            collection.delete(document.uri);
            return;
        }

        if (!config.diagnosticsEnabled) {
            collection.delete(document.uri);
            return;
        }
        const results = isDataWindowUri(document.uri)
            ? analyzeDataWindowDiagnostics(document)
            : [
                ...resolver.analyze(document),
                ...await analyzePowerScriptDataWindowLinkDiagnostics(document),
            ];

        if (documentVersions.get(versionKey) !== nextVersion) {
            return;
        }

        const diags = results.map(r => {
            const d = new vscode.Diagnostic(r.range, r.message, r.severity);
            if (r.code) { d.code = r.code; }
            d.source = 'PowerBuilder';
            return d;
        });
        collection.set(document.uri, diags);
    }

    // Analyze on open and change
    const onOpen = vscode.workspace.onDidOpenTextDocument(doc => { void updateDiagnostics(doc); });
    const onChange = vscode.workspace.onDidChangeTextDocument(e => { void updateDiagnostics(e.document); });
    const onClose = vscode.workspace.onDidCloseTextDocument(doc => {
        documentVersions.delete(doc.uri.toString());
        collection.delete(doc.uri);
    });
    const onConfig = vscode.workspace.onDidChangeConfiguration(event => {
        if (
            event.affectsConfiguration('powerbuilder.diagnostics.enabled') ||
            event.affectsConfiguration('powerbuilder.datawindow.experimentalIde.enabled')
        ) {
            for (const doc of vscode.workspace.textDocuments) {
                void updateDiagnostics(doc);
            }
        }
    });

    // Analyze currently open documents
    for (const doc of vscode.workspace.textDocuments) {
        void updateDiagnostics(doc);
    }

    return [collection, onOpen, onChange, onClose, onConfig];
}
