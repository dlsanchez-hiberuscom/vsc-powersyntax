import * as assert from 'assert/strict';

import {
  getQueryConsumerPolicy,
  listQueryConsumerPolicies,
} from '../../../src/server/features/queryScopePolicy';
import { INTERACTIVE_PAYLOAD_BUDGETS } from '../../../src/server/serving/payloadBudget';

suite('unit/queryScopePolicy (B266)', () => {
  test('declara budget, cap, readiness, confidence y fallback para cada consumer semantico actual', () => {
    const policies = listQueryConsumerPolicies();

    assert.ok(policies.length >= 10);
    for (const policy of policies) {
      assert.ok(policy.budgetMs > 0, `budget invalido para ${policy.consumer}`);
      assert.ok(policy.resultCap >= 0, `resultCap invalido para ${policy.consumer}`);
      assert.ok(policy.requiredReadiness.length > 0, `requiredReadiness vacio para ${policy.consumer}`);
      assert.ok(policy.requiredResolutionConfidence.length > 0, `requiredResolutionConfidence vacio para ${policy.consumer}`);
      assert.ok(['allow', 'degrade', 'block'].includes(policy.fallbackAction), `fallback invalido para ${policy.consumer}`);
    }
  });

  test('references, rename y code lens quedan acotados a project sin staging/generated ni external', () => {
    assert.equal(getQueryConsumerPolicy('references').maxScope, 'project');
    assert.equal(getQueryConsumerPolicy('references').allowStaging, false);
    assert.equal(getQueryConsumerPolicy('references').allowGenerated, false);
    assert.equal(getQueryConsumerPolicy('references').allowExternal, false);

    assert.equal(getQueryConsumerPolicy('rename').maxScope, 'project');
    assert.equal(getQueryConsumerPolicy('rename').allowStaging, false);
    assert.equal(getQueryConsumerPolicy('rename').allowGenerated, false);
    assert.equal(getQueryConsumerPolicy('rename').allowExternal, false);

    assert.equal(getQueryConsumerPolicy('code-lens-references').maxScope, 'project');
    assert.equal(getQueryConsumerPolicy('code-lens-references').allowStaging, false);
    assert.equal(getQueryConsumerPolicy('code-lens-references').allowGenerated, false);
    assert.equal(getQueryConsumerPolicy('code-lens-references').allowExternal, false);
  });

  test('features LSP criticas tienen payload budget documentable o policy semantica explicita', () => {
    for (const feature of [
      'hover',
      'completion',
      'completion-resolve',
      'signatureHelp',
      'definition',
      'references',
      'documentSymbols',
      'semanticTokens',
    ] as const) {
      assert.ok(INTERACTIVE_PAYLOAD_BUDGETS[feature].budgetBytes > 0, `payload budget faltante para ${feature}`);
    }

    assert.equal(getQueryConsumerPolicy('signature-help').budgetMs, 50);
    assert.equal(getQueryConsumerPolicy('definition').budgetMs, 50);
    assert.equal(getQueryConsumerPolicy('references').resultCap, 512);
    assert.equal(getQueryConsumerPolicy('code-lens-references').resultCap, 128);
  });

  test('currentObjectContext e impactAnalysis declaran scopes y caps mas estrechos que workspace', () => {
    const currentObjectContext = getQueryConsumerPolicy('current-object-context');
    const impactAnalysis = getQueryConsumerPolicy('impact-analysis');

    assert.equal(currentObjectContext.maxScope, 'dependency-neighborhood');
    assert.equal(currentObjectContext.resultCap, 24);
    assert.equal(currentObjectContext.allowStaging, false);
    assert.equal(currentObjectContext.allowGenerated, false);

    assert.equal(impactAnalysis.maxScope, 'project');
    assert.equal(impactAnalysis.resultCap, 64);
    assert.equal(impactAnalysis.allowStaging, false);
    assert.equal(impactAnalysis.allowGenerated, false);
  });
});