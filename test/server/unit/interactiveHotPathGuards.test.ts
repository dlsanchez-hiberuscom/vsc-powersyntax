import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Position } from 'vscode-languageserver/node';

import { provideCompletion } from '../../../src/server/features/completion';
import { provideDefinition } from '../../../src/server/features/definition';
import { extractDocumentSymbolsWithReconciliation } from '../../../src/server/features/documentSymbols';
import { provideHover } from '../../../src/server/features/hover';
import { provideSemanticTokens } from '../../../src/server/features/semanticTokens';
import { provideSignatureHelp } from '../../../src/server/features/signatureHelp';
import {
  assertNoHotPathSideEffects,
  createHotPathDocument,
  createHotPathHarness,
  resetHotPathAnalysisCache,
  withHotPathSpies,
} from '../helpers/hotPathTestHarness';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/interactiveHotPathGuards', () => {
  setup(() => {
    resetHotPathAnalysisCache();
  });

  teardown(() => {
    resetHotPathAnalysisCache();
  });

  test('los providers interactivos no importan IO ni discovery global en hot path', () => {
    for (const relativePath of [
      'src/server/features/hover.ts',
      'src/server/features/completion.ts',
      'src/server/features/signatureHelp.ts',
      'src/server/features/definition.ts',
      'src/server/features/semanticQueryFacade.ts',
      'src/server/features/dataWindowFastContext.ts',
      'src/server/features/dataWindowServingAdapters.ts',
      'src/server/features/documentSymbols.ts',
      'src/server/features/semanticTokens.ts',
    ]) {
      const source = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
      assert.doesNotMatch(source, /from ['"](?:node:)?fs['"]/i, relativePath);
      assert.doesNotMatch(source, /workspace\/(?:discovery|workspaceState|topology)/i, relativePath);
      assert.doesNotMatch(source, /discoverWorkspace|getAllSourceFiles|readdirSync|readFileSync/i, relativePath);
    }
  });

  test('providers LSP interactivos no hacen IO ni full parse cuando el contexto ya está caliente', () => {
    const harness = createHotPathHarness();

    const completionDoc = createHotPathDocument('file:///completion_hot.sru', 'powerbuilder', `
global type completion_hot from nonvisualobject
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  integer li_count
  l
end subroutine
    `);
    harness.warmDocument(completionDoc);

    const signatureDoc = createHotPathDocument('file:///signature_hot.srw', 'powerbuilder-window', 'integer li_rtn\nli_rtn = MessageBox("Title", "Message"');
    harness.warmDocument(signatureDoc);

    const hoverDoc = createHotPathDocument('file:///hover_hot.sru', 'powerbuilder', 'MessageBox("Hola", "Mundo")');

    const { stats } = withHotPathSpies(() => {
      const hover = provideHover(hoverDoc, Position.create(0, 2), harness.kb, harness.systemCatalog, harness.graph);
      const completion = provideCompletion(completionDoc, Position.create(9, 3), harness.kb, harness.systemCatalog, harness.graph);
      const signature = provideSignatureHelp(signatureDoc, Position.create(1, 38), harness.kb, harness.systemCatalog, harness.graph);
      const definition = provideDefinition(completionDoc, Position.create(8, 10), harness.kb, harness.graph, undefined, undefined, harness.systemCatalog);
      const documentSymbols = extractDocumentSymbolsWithReconciliation(completionDoc);
      const semanticTokens = provideSemanticTokens(completionDoc, harness.kb, harness.graph, harness.systemCatalog);

      assert.ok(hover);
      assert.ok(completion);
      assert.ok(signature);
      assert.ok(definition !== undefined);
      assert.equal(documentSymbols.reconciliation.status, 'healthy');
      assert.ok((semanticTokens as any).data.length > 0);
    });

    assertNoHotPathSideEffects(stats);
  });
});