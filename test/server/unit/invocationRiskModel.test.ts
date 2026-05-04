import * as assert from 'assert/strict';

import { buildInvocationRiskSummary } from '../../../src/server/features/invocationRiskModel';

suite('unit/invocationRiskModel (B312)', () => {
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
});