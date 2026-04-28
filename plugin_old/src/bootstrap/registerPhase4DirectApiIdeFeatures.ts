import * as vscode from 'vscode';
import { Logger } from '../core/logging/logger';
import { FEATURE_MANIFEST } from '../features/direct-api-ide/directApiFeatureManifest';
import { registerCommands } from '../features/direct-api-ide/commands/registerCommands';
import { registerDiagnostics } from '../features/direct-api-ide/diagnostics/registerDiagnostics';
import { registerDiagnosticsPanel } from '../features/direct-api-ide/diagnostics/registerDiagnosticsPanel';
import { registerHover } from '../features/direct-api-ide/hover/registerHover';
import { registerDefinition } from '../features/direct-api-ide/definition/registerDefinition';
import { registerReferences } from '../features/direct-api-ide/references/registerReferences';
import { registerRename } from '../features/direct-api-ide/rename/registerRename';
import { registerLinkedEditing } from '../features/direct-api-ide/linked-editing/registerLinkedEditing';
import { registerSymbols } from '../features/direct-api-ide/symbols/registerSymbols';
import { registerCompletion } from '../features/direct-api-ide/completion/registerCompletion';
import { registerSignatureHelp } from '../features/direct-api-ide/signature-help/registerSignatureHelp';
import { registerInlayHints } from '../features/direct-api-ide/inlay-hints/registerInlayHints';
import { registerFormatting } from '../features/direct-api-ide/formatting/registerFormatting';
import { registerFolding } from '../features/direct-api-ide/folding/registerFolding';
import { registerSemanticTokens } from '../features/direct-api-ide/semantic-tokens/registerSemanticTokens';
import { registerCodeLens } from '../features/direct-api-ide/codelens/registerCodeLens';
import { registerCodeActions } from '../features/direct-api-ide/code-actions/registerCodeActions';
import { registerExplorer } from '../features/direct-api-ide/explorer/registerExplorer';
import { registerStatusBar } from '../features/direct-api-ide/ui/registerStatusBar';
import {
    formatFeatureDisabledEs,
    formatFeatureRegisteredEs,
    formatFeatureRegisterFailedEs,
    formatNoRegisterFunctionForFeatureEs,
} from '../core/i18n/pbUserMessages';

const REGISTRY: Record<string, (ctx: vscode.ExtensionContext) => vscode.Disposable[]> = {
    commands: registerCommands,
    diagnostics: registerDiagnostics,
    'diagnostics-panel': registerDiagnosticsPanel,
    hover: registerHover,
    definition: registerDefinition,
    references: registerReferences,
    rename: registerRename,
    'linked-editing': registerLinkedEditing,
    symbols: registerSymbols,
    completion: registerCompletion,
    'signature-help': registerSignatureHelp,
    'inlay-hints': registerInlayHints,
    formatting: registerFormatting,
    folding: registerFolding,
    'semantic-tokens': registerSemanticTokens,
    codelens: registerCodeLens,
    'code-actions': registerCodeActions,
    explorer: registerExplorer,
    'status-bar': registerStatusBar,
};

export function registerPhase4DirectApiIdeFeatures(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    for (const feature of FEATURE_MANIFEST) {
        if (!feature.enabled) {
            Logger.info(formatFeatureDisabledEs(feature.id));
            continue;
        }

        const registerFn = REGISTRY[feature.id];

        if (!registerFn) {
            Logger.warn(formatNoRegisterFunctionForFeatureEs(feature.id));
            continue;
        }

        try {
            const featureDisposables = registerFn(context);
            disposables.push(...featureDisposables);
            Logger.info(formatFeatureRegisteredEs(feature.id));
        } catch (error) {
            Logger.error(formatFeatureRegisterFailedEs(feature.id), error);
        }
    }

    return disposables;
}
