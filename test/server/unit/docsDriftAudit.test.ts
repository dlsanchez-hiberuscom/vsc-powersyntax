import * as assert from 'assert/strict';

import { resolveRepoRoot } from '../helpers/fixtureLoader';

const { auditDocsDrift, auditDocsDriftFromSources } = require('../../../../tools/docs-drift-audit.cjs') as {
  auditDocsDrift: (repoRoot: string) => {
    status: string;
    findings: Array<{ code: string; severity: string }>;
    summary: { errorFindings: number; warningFindings: number; currentFocusId?: string; roadmapFocusId?: string };
  };
  auditDocsDriftFromSources: (sources: {
    backlog: string;
    doneLog: string;
    currentFocus: string;
    roadmap: string;
    specs: Array<{ name: string; hasSpec: boolean; hasTasks: boolean }>;
  }) => {
    status: string;
    findings: Array<{ code: string; severity: string }>;
    summary: { errorFindings: number; warningFindings: number; currentFocusId?: string; roadmapFocusId?: string };
  };
};

suite('unit/docsDriftAudit (B316)', () => {
  test('detecta done activos, foco inconsistente y specs rotas', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## B316 — Documentation drift detector',
        '- **Estado:** Open',
        '',
        '## B317 — Backlog lifecycle automation guard',
        '- **Estado:** Open',
      ].join('\n'),
      doneLog: [
        '## 1.001 B316. Documentation drift detector — **Cerrada**',
      ].join('\n'),
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`B317 — Backlog lifecycle automation guard`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `B316`**',
      specs: [
        { name: '411-documentation-drift-detector', hasSpec: true, hasTasks: false },
        { name: '412-healthy-closed-slice', hasSpec: true, hasTasks: true },
      ],
    });

    assert.equal(report.status, 'failed');
    assert.ok(report.findings.some((finding) => finding.code === 'done-item-still-active'));
    assert.ok(report.findings.some((finding) => finding.code === 'roadmap-focus-mismatch'));
    assert.ok(report.findings.some((finding) => finding.code === 'spec-missing-docs'));
  });

  test('el repo actual pasa el audit documental sin errores ni warnings', () => {
    const report = auditDocsDrift(resolveRepoRoot());

    assert.equal(report.status, 'passed');
    assert.equal(report.summary.errorFindings, 0);
    assert.equal(report.summary.warningFindings, 0);
  });
});