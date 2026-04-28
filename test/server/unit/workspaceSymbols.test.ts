import * as assert from 'assert/strict';
import { SymbolKind } from 'vscode-languageserver/node';
import { provideWorkspaceSymbols } from '../../../src/server/features/workspaceSymbols';
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
});
