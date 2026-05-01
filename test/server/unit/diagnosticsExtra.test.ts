/**
 * Sprint 3: tests para diagnosticsExtra (Specs 113-115).
 */
import { strictEqual, ok } from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  checkUnreachableAfterReturn,
  checkUnbalancedParens,
  checkMissingReturn
} from '../../../src/server/features/diagnosticsExtra';
import { ScopeKind, type Scope } from '../../../src/server/knowledge/types';

function makeScope(uri: string, lines: number, body: string[]): Scope {
  return {
    id: 'test.f',
    kind: ScopeKind.Function,
    uri,
    startLine: 0,
    endLine: lines - 1,
    children: [],
    symbols: []
  };
}

suite('Sprint 3 / diagnosticsExtra', () => {
  test('SD11: detecta línea ejecutiva tras return', () => {
    const lines = [
      'public function integer f_test()',
      '  return 1',
      '  ls_x = 2',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkUnreachableAfterReturn(scope, lines);
    strictEqual(ds.length, 1, 'SD11 esperado');
    ok(ds[0].source!.includes('SD11'));
    strictEqual(ds[0].range.start.line, 2);
  });

  test('SD12: detecta paréntesis desbalanceados', () => {
    const lines = [
      'public function integer f_test()',
      '  ls_x = abs(1 + 2',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkUnbalancedParens(scope, lines);
    strictEqual(ds.length, 1);
    ok(ds[0].source!.includes('SD12'));
  });

  test('SD13: warning si función con returnType no tiene return', () => {
    const lines = [
      'public function integer f_test()',
      '  ls_x = 1',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkMissingReturn(scope, lines);
    strictEqual(ds.length, 1);
    ok(ds[0].source!.includes('SD13'));
  });

  test('SD13: no warning si tiene return', () => {
    const lines = [
      'public function integer f_test()',
      '  return 0',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    strictEqual(checkMissingReturn(scope, lines).length, 0);
  });
});
