import * as assert from 'assert/strict';
import { DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { buildDiagnosticsSnapshot } from '../../../src/server/features/diagnosticsSnapshot';

suite('unit/diagnosticsSnapshot (B063)', () => {
  test('agrega totales y agrupa por código', () => {
    const map = new Map<string, any[]>([
      [
        'file:///a',
        [
          {
            severity: DiagnosticSeverity.Error,
            range: Range.create(0, 0, 0, 1),
            message: 'x',
            source: 'PowerScript',
            code: 'SD1'
          },
          {
            severity: DiagnosticSeverity.Warning,
            range: Range.create(0, 0, 0, 1),
            message: 'y',
            source: 'PowerScript',
            code: 'SD7'
          }
        ]
      ],
      [
        'file:///b',
        [
          {
            severity: DiagnosticSeverity.Warning,
            range: Range.create(0, 0, 0, 1),
            message: 'z',
            source: 'PowerScript',
            code: 'SD7'
          }
        ]
      ]
    ]);
    const snap = buildDiagnosticsSnapshot(map);
    assert.equal(snap.totals.error, 1);
    assert.equal(snap.totals.warning, 2);
    assert.equal(snap.byFile['file:///a'], 2);
    assert.equal(snap.byCode['PowerScript:SD7'], 2);
  });
});
