import * as assert from 'assert/strict';

import {
  buildExplainDiagnosticMarkdown,
  buildExplainDiagnosticReport,
  buildUnavailableExplainDiagnosticReport,
  pickExplainDiagnosticCandidate,
} from '../../../src/client/explainDiagnosticReport';
import type {
  ApiCurrentObjectContext,
  ApiSafeEditPlan,
} from '../../../src/shared/publicApi';

function createObjectContext(): ApiCurrentObjectContext {
  return {
    available: true,
    uri: 'file:///workspace/w_main.srw',
    objectInfo: {
      uri: 'file:///workspace/w_main.srw',
      globalType: 'w_main',
      objectKind: 'window',
      readiness: 'ready',
    },
    sourceExcerpt: {
      startLine: 9,
      endLine: 12,
      text: 'integer ll_total\nll_total = 1',
      truncated: false,
    },
    visibleVariables: [
      {
        name: 'll_total',
        uri: 'file:///workspace/w_main.srw',
        line: 9,
        character: 8,
        datatype: 'integer',
        scope: 'Local',
      },
    ],
    referencedSymbols: [
      {
        identifier: 'of_compute',
        line: 14,
        target: {
          name: 'of_compute',
          kind: 'function',
          uri: 'file:///workspace/w_main.srw',
          line: 25,
          character: 2,
        },
        confidence: 'medium',
        reasonCode: 'global-fallback',
        invocationKind: 'unqualified-call',
        invocationRisk: 'fallback',
      },
    ],
    dataWindowBindings: [
      {
        targetName: 'dw_main',
        line: 20,
        dataObject: 'd_orders',
        state: 'resolved',
        targetUri: 'file:///workspace/d_orders.srd',
        retrieveArguments: [],
      },
    ],
    evidence: {
      readiness: 'ready',
      primaryReasonCode: 'global-fallback',
      evidenceKinds: ['symbol'],
    },
  };
}

function createSafeEditPlan(): ApiSafeEditPlan {
  return {
    available: true,
    blocked: false,
    confidence: 'high',
    objects: [],
    files: [
      {
        uri: 'file:///workspace/w_main.srw',
        reason: 'diagnostic target',
        risk: 'low',
      },
    ],
    risks: [],
    recommendedTests: ['npm run test:unit -- --grep "diagnostics"'],
    docsToReview: ['docs/testing.md'],
    blockedReasons: [],
  };
}

suite('unit/explainDiagnosticReport (B379)', () => {
  test('explica variable no usada con evidencia minima y safe fix', () => {
    const report = buildExplainDiagnosticReport({
      request: {
        maxEvidence: 4,
      },
      diagnostic: {
        uri: 'file:///workspace/w_main.srw',
        message: "La variable 'll_total' no se usa.",
        code: 'SD4',
        severity: 'warning',
        line: 9,
        character: 8,
        endLine: 9,
        endCharacter: 16,
      },
      objectContext: createObjectContext(),
      safeEditPlan: createSafeEditPlan(),
    });

    assert.equal(report.available, true);
    assert.equal(report.explanation.area, 'unused');
    assert.equal(report.safeFix?.kind, 'remove-declaration');
    assert.ok(report.evidence.some((entry) => entry.kind === 'source-excerpt'));
    assert.ok(report.evidence.some((entry) => entry.kind === 'symbol' && entry.label === 'll_total'));
    assert.match(buildExplainDiagnosticMarkdown(report), /Explain Diagnostic/);
  });

  test('selecciona el diagnostic pedido por diagnosticIndex y conserva reasonCode', () => {
    const selected = pickExplainDiagnosticCandidate([
      {
        uri: 'file:///workspace/w_main.srw',
        message: 'Primero',
        code: 'SD4',
        severity: 'warning',
        line: 4,
        character: 2,
        endLine: 4,
        endCharacter: 6,
      },
      {
        uri: 'file:///workspace/w_main.srw',
        message: "La funcion 'of_compute' no se encuentra.",
        code: 'SD2',
        severity: 'warning',
        line: 14,
        character: 3,
        endLine: 14,
        endCharacter: 13,
        data: {
          reasonCodes: ['global-fallback'],
          candidateCount: 3,
          targetCount: 0,
          hasAmbiguity: true,
          confidence: 'medium',
        },
      },
    ], {
      diagnosticIndex: 1,
    });

    assert.equal(selected.diagnostic?.code, 'SD2');

    const report = buildExplainDiagnosticReport({
      diagnostic: selected.diagnostic!,
      objectContext: createObjectContext(),
    });

    assert.equal(report.explanation.area, 'semantic');
    assert.equal(report.explanation.reasonCode, 'global-fallback');
    assert.ok(report.evidence.some((entry) => entry.kind === 'dependency'));
  });

  test('devuelve unavailable cuando no hay diagnostic defendible', () => {
    const selection = pickExplainDiagnosticCandidate([], {
      line: 1,
      character: 1,
    });

    assert.match(selection.reason ?? '', /No hay diagnostics publicados/i);

    const report = buildUnavailableExplainDiagnosticReport(selection.reason ?? 'missing diagnostic');
    assert.equal(report.available, false);
    assert.equal(report.evidence.length, 0);
  });
});