import * as assert from 'assert/strict';

const { auditDocsDriftFromSources } = require('../../../../tools/docs-drift-audit.cjs') as {
  auditDocsDriftFromSources: (sources: {
    backlog: string;
    doneLog: string;
    currentFocus: string;
    roadmap: string;
    specs: Array<{ name: string; hasSpec: boolean; hasTasks: boolean }>;
  }) => {
    status: string;
    findings: Array<{ code: string; severity: string }>;
  };
};

suite('unit/docsLifecycleGuard (B317)', () => {
  test('detecta estados done dentro del backlog y entradas canónicas sin validación o docs', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## B317 — Backlog lifecycle automation guard',
        '- **Estado:** Done',
        '',
        '## B314 — Build/ORCA failure classification v2',
        '- **Estado:** Open',
      ].join('\n'),
      doneLog: [
        '## 1.160 B317. Backlog lifecycle automation guard — **Cerrada**',
        '',
        '**Resultado registrado:**',
        '- guard aplicado;',
      ].join('\n'),
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`B314 — Build/ORCA failure classification v2`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `B314`**',
      specs: [
        { name: '411-documentation-drift-detector', hasSpec: true, hasTasks: true },
      ],
    });

    assert.equal(report.status, 'failed');
    assert.ok(report.findings.some((finding) => finding.code === 'done-state-still-in-backlog'));
    assert.ok(report.findings.some((finding) => finding.code === 'done-log-missing-validation'));
    assert.ok(report.findings.some((finding) => finding.code === 'done-log-missing-docs'));
  });
});