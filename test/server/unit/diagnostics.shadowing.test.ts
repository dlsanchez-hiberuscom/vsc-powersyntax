import * as assert from 'assert/strict';
import { Diagnostic } from 'vscode-languageserver/node';
import { checkShadowing } from '../../../src/server/features/diagnostics';
import { EntityKind, ScopeKind, type Fact, type Scope } from '../../../src/server/knowledge/types';

function makeScope(): Scope {
  const fnScope: Scope = {
    id: 'w_main.f',
    kind: ScopeKind.Function,
    uri: 'file:///x.sru',
    startLine: 5,
    endLine: 20,
    children: [],
    symbols: [
      // local 'i' declarada en línea 7 (no es la línea de la función → no es parámetro)
      { id: 'i', name: 'i', kind: EntityKind.Variable, uri: 'file:///x.sru', line: 7, character: 8, scope: 'Local' }
    ]
  };
  return fnScope;
}

suite('unit/diagnostics.shadowing (B035)', () => {
  test('detecta shadowing con variable instancia', () => {
    const facts: Fact[] = [
      { id: 'i', name: 'i', kind: EntityKind.Variable, uri: 'file:///x.sru', line: 1, character: 0, scope: 'Instancia' }
    ];
    const diags: Diagnostic[] = [];
    checkShadowing(makeScope(), facts, diags);
    assert.equal(diags.length, 1);
    assert.match(diags[0].message, /Instancia/);
  });

  test('detecta shadowing con variable global', () => {
    const facts: Fact[] = [
      { id: 'i', name: 'i', kind: EntityKind.Variable, uri: 'file:///x.sru', line: 1, character: 0, scope: 'Global' }
    ];
    const diags: Diagnostic[] = [];
    checkShadowing(makeScope(), facts, diags);
    assert.equal(diags.length, 1);
    assert.match(diags[0].message, /Global/);
  });

  test('sin colisión no emite', () => {
    const facts: Fact[] = [
      { id: 'j', name: 'j', kind: EntityKind.Variable, uri: 'file:///x.sru', line: 1, character: 0, scope: 'Instancia' }
    ];
    const diags: Diagnostic[] = [];
    checkShadowing(makeScope(), facts, diags);
    assert.equal(diags.length, 0);
  });
});
