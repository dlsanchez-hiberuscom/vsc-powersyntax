/**
 * Sprint 3: tests para diagnosticsExtra (Specs 113-115).
 */
import { strictEqual, ok } from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import {
  checkUnreachableAfterReturn,
  checkUnbalancedParens,
  checkMissingReturn,
  runExtraDiagnostics
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
    strictEqual(ds[0].code, DIAGNOSTIC_CODES.sd11UnreachableAfterReturn);
    strictEqual(ds[0].range.start.line, 2);
  });

  test('SD11: no marca cierres estructurales tras return', () => {
    const lines = [
      'public function integer f_test()',
      '  if true then',
      '    return 1',
      '  end if',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkUnreachableAfterReturn(scope, lines);
    strictEqual(ds.length, 0);
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
    strictEqual(ds[0].code, DIAGNOSTIC_CODES.sd12UnbalancedParens);
  });

  test('SD13: warning si función con returnType no tiene return y tiene código', () => {
    const lines = [
      'public function integer f_test()',
      '  ls_x = 1',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkMissingReturn(scope, lines);
    strictEqual(ds.length, 1);
    ok(ds[0].source!.includes('SD13'));
    strictEqual(ds[0].code, DIAGNOSTIC_CODES.sd13MissingReturn);
  });

  test('SD13: no warning si función con returnType tiene cuerpo vacío (hook)', () => {
    const lines = [
      'public function integer f_test()',
      '  // Hook for descendants',
      'end function'
    ];
    const scope = makeScope('file:///x.pbl', lines.length, lines);
    const ds = checkMissingReturn(scope, lines);
    strictEqual(ds.length, 0);
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

  test('SD13: no warning si el return va inline tras el encabezado', () => {
    const lines = [
      'public function integer f_test(); return 0',
      'end function'
    ];
    const scope = makeScope('file:///x_inline.pbl', lines.length, lines);
    strictEqual(checkMissingReturn(scope, lines).length, 0);
  });

  test('runExtraDiagnostics consume snapshot publicado extremo a extremo', () => {
    const document = TextDocument.create(
      'file:///extra-diagnostics.sru',
      'powerbuilder',
      1,
      [
        'forward',
        'global type uo_demo from nonvisualobject',
        'end type',
        'end forward',
        '',
        'global type uo_demo from nonvisualobject',
        'end type',
        '',
        'forward prototypes',
        'public function integer of_run()',
        'end prototypes',
        '',
        'public function integer of_run();',
        '  return 1',
        '  li_value = 2',
        'end function'
      ].join('\n')
    );

    const diagnostics = runExtraDiagnostics(document);

    strictEqual(diagnostics.length, 1);
    ok(diagnostics[0].source!.includes('SD11'));
    strictEqual(diagnostics[0].code, DIAGNOSTIC_CODES.sd11UnreachableAfterReturn);
    strictEqual(diagnostics[0].range.start.line, 14);
  });
});
