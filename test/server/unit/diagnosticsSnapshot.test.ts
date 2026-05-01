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
    assert.equal(snap.bySeverity.warning, 2);
  });

  test('agrupa por proyecto y objeto y conserva versiones del snapshot', () => {
    const map = new Map<string, {
      diagnostics: any[];
      projectKey: string;
      projectLabel: string;
      objectKey: string;
      objectLabel: string;
      documentVersion: number;
      snapshotVersion: number;
      snapshotIdentity: string;
    }>([
      [
        'file:///demo/w_main.srw',
        {
          diagnostics: [
            {
              severity: DiagnosticSeverity.Error,
              range: Range.create(0, 0, 0, 1),
              message: 'x',
              source: 'PowerScript',
              code: 'SD1'
            }
          ],
          projectKey: 'file:///demo/demo.pbt',
          projectLabel: 'demo',
          objectKey: 'w_main',
          objectLabel: 'w_main',
          documentVersion: 7,
          snapshotVersion: 7,
          snapshotIdentity: 'file:///demo/w_main.srw@123'
        }
      ],
      [
        'file:///demo/n_cst.sru',
        {
          diagnostics: [
            {
              severity: DiagnosticSeverity.Warning,
              range: Range.create(0, 0, 0, 1),
              message: 'y',
              source: 'PowerScript',
              code: 'SD7'
            }
          ],
          projectKey: 'file:///demo/demo.pbt',
          projectLabel: 'demo',
          objectKey: 'n_cst',
          objectLabel: 'n_cst',
          documentVersion: 3,
          snapshotVersion: 2,
          snapshotIdentity: 'file:///demo/n_cst.sru@456'
        }
      ]
    ]);

    const snap = buildDiagnosticsSnapshot(map);
    const wMain = snap.projects[0].objects.find((objectNode) => objectNode.label === 'w_main');
    const nCst = snap.projects[0].objects.find((objectNode) => objectNode.label === 'n_cst');

    assert.equal(snap.projects.length, 1);
    assert.equal(snap.projects[0].label, 'demo');
    assert.equal(snap.projects[0].objects.length, 2);
    assert.ok(wMain);
    assert.ok(nCst);
    assert.equal(wMain?.documents[0].documentVersion, 7);
    assert.equal(wMain?.documents[0].snapshotVersion, 7);
    assert.equal(nCst?.documents[0].snapshotIdentity, 'file:///demo/n_cst.sru@456');
  });
});
