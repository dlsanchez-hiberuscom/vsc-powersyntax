import type { FeatureHandlerContext } from './featureHandlers';
import {
  registerCodeActionHandler,
  registerCodeLensHandler,
  registerCompletionHandler,
  registerDefinitionHandler,
  registerDocumentSymbolHandler,
  registerHoverHandler,
  registerLinkedEditingHandler,
  registerReferencesHandler,
  registerRenameHandlers,
  registerSemanticTokensHandler,
  registerSignatureHelpHandler,
  registerWorkspaceSymbolHandler,
} from './featureHandlers';

export function registerPrimaryFeatureHandlers(context: FeatureHandlerContext): void {
  registerDocumentSymbolHandler(context);
  registerHoverHandler(context);
  registerWorkspaceSymbolHandler(context);
  registerDefinitionHandler(context);
  registerReferencesHandler(context);
  registerSignatureHelpHandler(context);
  registerCompletionHandler(context);
  registerSemanticTokensHandler(context);
}

export function registerAuxiliaryFeatureHandlers(context: FeatureHandlerContext): void {
  registerLinkedEditingHandler(context);
  registerCodeActionHandler(context);
  registerCodeLensHandler(context);
  registerRenameHandlers(context);
}