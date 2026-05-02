import * as assert from 'assert/strict';
import { SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideWorkspaceSymbols, queryApiSymbols } from '../../../src/server/features/workspaceSymbols';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/workspaceSymbols', () => {
  let kb: KnowledgeBase;

  setup(() => {
    kb = new KnowledgeBase();
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: 'file:///w_main.sru', line: 10, character: 4 },
      { id: 'u_my_button', name: 'u_my_button', kind: EntityKind.Type, uri: 'file:///w_main.sru', line: 20, character: 4 }
    ]);
    kb.upsertDocument('file:///n_cst_string.sru', [
      { id: 'of_replace', name: 'of_Replace', kind: EntityKind.Function, uri: 'file:///n_cst_string.sru', line: 5, character: 4 },
      { id: 'is_name', name: 'is_name', kind: EntityKind.Variable, uri: 'file:///n_cst_string.sru', line: 2, character: 4 }
    ]);
  });

  test('provideWorkspaceSymbols returns all entities on empty query', () => {
    const symbols = provideWorkspaceSymbols('', kb);
    assert.equal(symbols.length, 4);
  });

  test('provideWorkspaceSymbols filters by query (case insensitive)', () => {
    const symbols = provideWorkspaceSymbols('Of_', kb);
    assert.equal(symbols.length, 2);
    assert.ok(symbols.some(s => s.name === 'of_SetData'));
    assert.ok(symbols.some(s => s.name === 'of_Replace'));
  });

  test('provideWorkspaceSymbols maps EntityKind to SymbolKind correctly', () => {
    const symbols = provideWorkspaceSymbols('u_my_button', kb);
    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].kind, SymbolKind.Class); // Type -> Class
    assert.equal(symbols[0].location.uri, 'file:///w_main.sru');
  });

  test('provideWorkspaceSymbols returns empty array if no match', () => {
    const symbols = provideWorkspaceSymbols('non_existent', kb);
    assert.equal(symbols.length, 0);
  });

  test('queryApiSymbols preserva lineage rico para la API pública', () => {
    kb.upsertDocument('file:///ws_objects/w_api.srw', [
      {
        id: 'of_api',
        name: 'of_Api',
        kind: EntityKind.Function,
        uri: 'file:///ws_objects/w_api.srw',
        line: 4,
        character: 2,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'workspace-ws_objects',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);

    const symbols = queryApiSymbols('of_api', kb, 5);

    assert.equal(symbols.length, 1);
    assert.deepEqual(symbols[0].lineage, {
      sourceKind: 'document',
      sourceOrigin: 'workspace-ws_objects',
      authority: 'derived',
      phase: 'implementation',
      confidence: 'direct'
    });
  });

  test('workspace/api symbols incluyen el stub type publicado por un .srd', () => {
    const document = TextDocument.create(
      'file:///d_customer.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_customer.srd',
        'release 39;',
        'datawindow(units=0)'
      ].join('\r\n')
    );
    const analysis = analyzeDocument(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const workspaceSymbols = provideWorkspaceSymbols('d_customer', kb);
    const apiSymbols = queryApiSymbols('d_customer', kb, 5);

    assert.ok(workspaceSymbols.some((entry) => entry.name === 'd_customer' && entry.kind === SymbolKind.Class));
    assert.ok(apiSymbols.some((entry) => entry.name === 'd_customer' && entry.kind === 'Type'));
  });
});
