import * as assert from 'assert/strict';

import {
  buildInvocationRiskSummary,
  combineInvocationRisk,
  dynamicStringRisk,
  sourceOriginRisk,
} from '../../../src/server/features/invocationRiskModel';

function dynamicHit(overrides: Partial<{
  classification: 'safe-literal' | 'probable' | 'dynamic' | 'unknown';
  api: string;
}> = {}) {
  return {
    uri: 'file:///proj/w_dyn.srw',
    line: 8,
    literal: 'payload',
    classification: 'dynamic' as const,
    ...(overrides.api ? { api: overrides.api } : {}),
    ...(overrides.classification ? { classification: overrides.classification } : {}),
  };
}

suite('unit/invocationRiskModel (B312)', () => {
  test('combineInvocationRisk conserva el riesgo más alto e ignora undefined', () => {
    assert.equal(combineInvocationRisk(undefined, 'safe', 'inherited', 'fallback'), 'fallback');
    assert.equal(combineInvocationRisk('dynamic', undefined, 'external'), 'external');
  });

  test('sourceOriginRisk distingue origins canónicos y no canónicos', () => {
    assert.equal(sourceOriginRisk('solution-source'), undefined);
    assert.equal(sourceOriginRisk('generated'), 'dynamic');
    assert.equal(sourceOriginRisk('orca-staging'), 'dynamic');
    assert.equal(sourceOriginRisk('manual-export-source'), 'fallback');
    assert.equal(sourceOriginRisk('backup'), 'fallback');
  });

  test('dynamicStringRisk escala a dynamic para hits dynamic/probable y a fallback para unknown', () => {
    assert.equal(dynamicStringRisk([dynamicHit({ classification: 'safe-literal' })]), undefined);
    assert.equal(dynamicStringRisk([dynamicHit({ classification: 'unknown' })]), 'fallback');
    assert.equal(dynamicStringRisk([dynamicHit({ classification: 'probable' })]), 'dynamic');
    assert.equal(dynamicStringRisk([dynamicHit({ classification: 'dynamic' })]), 'dynamic');
  });

  test('desglosa SQL dinámico como reason code específico sin perder el contador genérico', () => {
    const summary = buildInvocationRiskSummary({
      dynamicStringHits: [
        {
          uri: 'file:///proj/w_sql.srw',
          line: 8,
          literal: 'select of_customer from sales_order',
          classification: 'dynamic',
          api: 'dynamic-sql',
        },
      ],
    });

    assert.equal(summary.risk, 'dynamic');
    assert.ok(summary.reasons.includes('dynamic-strings:1'));
    assert.ok(summary.reasons.includes('dynamic-sql:1'));
    assert.equal(summary.dynamicStringReferenceCount, 1);
  });

  test('buildInvocationRiskSummary combina external, dynamic, fallback y deduplica reasons', () => {
    const summary = buildInvocationRiskSummary({
      baseRisk: 'fallback',
      hasExternalTarget: true,
      sourceOrigin: 'generated',
      dynamicStringHits: [
        dynamicHit({ classification: 'probable', api: 'json-path' }),
        dynamicHit({ classification: 'unknown' }),
        dynamicHit({ classification: 'safe-literal' }),
      ],
      dataWindowBindingStates: ['missing', 'dynamic'],
      evidenceKinds: ['discarded-context', 'fallback-ambiguity', 'discarded-context'],
    });

    assert.equal(summary.risk, 'external');
    assert.equal(summary.dynamicStringReferenceCount, 2);
    assert.deepEqual(summary.reasons, [
      'query:fallback',
      'external-target',
      'source-origin:generated',
      'dynamic-strings:2',
      'datawindow-binding-dynamic',
      'evidence:discarded-context',
      'evidence:fallback-ambiguity',
    ]);
  });

  test('buildInvocationRiskSummary no añade reasons para safe-literal ni source canónico', () => {
    const summary = buildInvocationRiskSummary({
      sourceOrigin: 'solution-source',
      dynamicStringHits: [dynamicHit({ classification: 'safe-literal' })],
      dataWindowBindingStates: ['resolved'],
      evidenceKinds: ['winner-target'],
    });

    assert.equal(summary.risk, 'safe');
    assert.deepEqual(summary.reasons, []);
    assert.equal(summary.dynamicStringReferenceCount, undefined);
  });
});