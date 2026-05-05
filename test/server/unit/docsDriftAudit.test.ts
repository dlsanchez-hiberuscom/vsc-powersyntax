import * as assert from 'assert/strict';

import { resolveRepoRoot } from '../helpers/fixtureLoader';

const { auditDocsDrift, auditDocsDriftFromSources } = require('../../../../tools/docs-drift-audit.cjs') as {
  auditDocsDrift: (repoRoot: string) => {
    status: string;
    findings: Array<{ code: string; severity: string }>;
    summary: { errorFindings: number; warningFindings: number; currentFocusId?: string; roadmapFocusId?: string; promptFiles?: number; agentFiles?: number; skillFiles?: number };
  };
  auditDocsDriftFromSources: (sources: {
    backlog: string;
    doneLog: string;
    currentFocus: string;
    roadmap: string;
    specs: Array<{ name: string; hasSpec: boolean; hasTasks: boolean }>;
    promptReferences?: Array<{ path: string; exists: boolean }>;
    promptFiles?: Array<{ path: string }>;
    agentFiles?: Array<{ name: string; path: string }>;
    skillFiles?: Array<{ name: string; path: string }>;
    customizationDocs?: string[];
  }) => {
    status: string;
    findings: Array<{ code: string; severity: string }>;
    summary: { errorFindings: number; warningFindings: number; currentFocusId?: string; roadmapFocusId?: string; promptReferences?: number; promptFiles?: number; agentFiles?: number; skillFiles?: number };
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

  test('acepta IDs canónicos no B cuando backlog, foco y roadmap están alineados', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## VSIX-01 — Installed VSIX startup hardening',
        '- **Estado:** Ready for closure',
        '',
        '## DOC-01 — Canonical docs realignment',
        '- **Estado:** Open',
      ].join('\n'),
      doneLog: [
        '## 1.177 AUDIT-01. Installed VSIX activation audit — **Cerrada**',
        '',
        '**Validación registrada:**',
        '- smoke instalada en verde',
        '',
        '**Documentación alineada:**',
        '- docs/backlog.md',
      ].join('\n'),
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`VSIX-01 — Installed VSIX startup hardening`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `VSIX-01`**',
      specs: [
        { name: '418-vsix-01-installed-vsix-hardening', hasSpec: true, hasTasks: true },
        { name: '419-doc-01-canonical-doc-realignment', hasSpec: true, hasTasks: true },
      ],
    });

    assert.equal(report.status, 'passed');
    assert.equal(report.summary.currentFocusId, 'VSIX-01');
    assert.equal(report.summary.roadmapFocusId, 'VSIX-01');
  });

  test('normaliza encabezados BLOQUE con espacio como IDs promovidos', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## BLOQUE 13 — Multi-Audit Final',
        '- **Estado:** Open',
      ].join('\n'),
      doneLog: [
        '## 1.217 BLOQUE 12. Legacy Isolation — **Cerrada**',
        '',
        '**Validación registrada:**',
        '- ok',
        '',
        '**Documentación alineada:**',
        '- docs/done-log.md',
      ].join('\n'),
      currentFocus: [
        '## 1. Foco activo',
        '',
        'Bloque 13 — Multi-Audit Final.',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `BLOQUE-13`**',
      specs: [{ name: '413-multi-audit-final', hasSpec: true, hasTasks: true }],
    });

    assert.equal(report.status, 'passed');
    assert.equal(report.summary.currentFocusId, 'BLOQUE-13');
    assert.equal(report.summary.roadmapFocusId, 'BLOQUE-13');
  });

  test('detecta referencias a prompts inexistentes en backlog o foco', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## B400 — Prompt reference guard',
        '- **Estado:** Open',
        '- **Prompt:** `.github/prompts/missing.prompt.md`',
      ].join('\n'),
      doneLog: '',
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`B400 — Prompt reference guard`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `B400`**',
      specs: [{ name: '400-prompt-reference-guard', hasSpec: true, hasTasks: true }],
      promptReferences: [{ path: '.github/prompts/missing.prompt.md', exists: false }],
    });

    assert.equal(report.status, 'failed');
    assert.ok(report.findings.some((finding) => finding.code === 'prompt-reference-missing'));
  });

  test('detecta prompt files sin extension .prompt.md', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## B401 — Prompt naming guard',
        '- **Estado:** Open',
        '- **Prompt:** `.github/prompts/valid.prompt.md`',
      ].join('\n'),
      doneLog: '',
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`B401 — Prompt naming guard`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `B401`**',
      specs: [{ name: '401-prompt-naming-guard', hasSpec: true, hasTasks: true }],
      promptReferences: [{ path: '.github/prompts/valid.prompt.md', exists: true }],
      promptFiles: [
        { path: '.github/prompts/valid.prompt.md' },
        { path: '.github/prompts/legacy-audit.md' },
      ],
    });

    assert.equal(report.status, 'failed');
    assert.equal(report.summary.promptFiles, 2);
    assert.ok(report.findings.some((finding) => finding.code === 'prompt-file-extension-invalid'));
  });

  test('detecta agentes y skills versionados sin documentación AI', () => {
    const report = auditDocsDriftFromSources({
      backlog: [
        '## B402 — Customization reference guard',
        '- **Estado:** Open',
      ].join('\n'),
      doneLog: '',
      currentFocus: [
        '## 1. Foco activo',
        '',
        '`B402 — Customization reference guard`',
      ].join('\n'),
      roadmap: '**Bloque pedido por el usuario — continuidad `B402`**',
      specs: [{ name: '402-customization-reference-guard', hasSpec: true, hasTasks: true }],
      agentFiles: [{ name: 'missing-agent', path: '.github/agents/missing-agent.agent.md' }],
      skillFiles: [{ name: 'missing-skill', path: '.github/skills/missing-skill/SKILL.md' }],
      customizationDocs: ['## Active agents\n- `planner`\n\n## Skills\n- `testing-validation`'],
    });

    assert.equal(report.status, 'failed');
    assert.equal(report.summary.agentFiles, 1);
    assert.equal(report.summary.skillFiles, 1);
    assert.ok(report.findings.some((finding) => finding.code === 'agent-reference-missing'));
    assert.ok(report.findings.some((finding) => finding.code === 'skill-reference-missing'));
  });

  test('el repo actual pasa el audit documental sin errores ni warnings', () => {
    const report = auditDocsDrift(resolveRepoRoot());

    assert.equal(report.status, 'passed');
    assert.equal(report.summary.errorFindings, 0);
    assert.equal(report.summary.warningFindings, 0);
  });
});