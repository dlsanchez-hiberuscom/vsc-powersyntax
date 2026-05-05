import * as assert from 'assert/strict';

import type { Connection, InitializeParams, InitializeResult } from 'vscode-languageserver/node';

import { registerInitializeHandler } from '../../../src/server/handlers/lifecycleHandlers';

suite('unit/lspCapabilitiesContract', () => {
  test('publica completionItem/resolve y mantiene CodeLens sin resolveProvider', () => {
    let initialize: ((params: InitializeParams) => InitializeResult) | undefined;
    const connection = {
      onInitialize(callback: (params: InitializeParams) => InitializeResult): void {
        initialize = callback;
      },
      onDidChangeConfiguration(): void {},
      console: {
        log(): void {},
      },
    } as unknown as Connection;

    registerInitializeHandler({
      connection,
      serverStartTime: performance.now(),
      buildOrcaJournal: { configure(): void {} } as never,
      setWorkspaceFolders(): void {},
      setCacheStorageUri(): void {},
      setDocumentationLocaleSetting(): void {},
      setUiLocale(): void {},
    });

    const result = initialize?.({
      processId: null,
      rootUri: null,
      capabilities: {},
      workspaceFolders: [],
      initializationOptions: {},
    });

    assert.equal(result?.capabilities.completionProvider && typeof result.capabilities.completionProvider === 'object'
      ? result.capabilities.completionProvider.resolveProvider
      : undefined, true);
    assert.equal(result?.capabilities.codeLensProvider?.resolveProvider, false);
  });
});