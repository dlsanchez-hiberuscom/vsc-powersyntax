import * as assert from 'assert/strict';

import {
  buildAiTaskContextBundle,
  buildUnavailableAiTaskContextBundle,
} from '../../../src/client/aiTaskContextBundle';
import type {
  ApiCurrentObjectContext,
  ApiExplainDiagnosticReport,
  ApiExplainSystemSymbolReport,
  ApiObjectCheckReport,
  ApiPowerBuilderDependencyGraph,
  ApiSafeEditPlan,
  ApiWorkspaceCheckReport,
} from '../../../src/shared/publicApi';

function createObjectCheck(): ApiObjectCheckReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-05-04T00:00:00.000Z',
    apiVersion: '2.17.0',
    available: true,
    status: 'passed',
    source: {
      kind: 'uri',
      uri: 'file:///workspace/sample.sru',
      objectName: 'sample',
      line: 12,
      character: 4,
    },
    summary: {
      objectName: 'sample',
      uri: 'file:///workspace/sample.sru',
      diagnostics: { error: 1, warning: 0, info: 0, hint: 0 },
      dependencyCount: 2,
      dependentCount: 1,
      unresolvedDependencyCount: 0,
      ambiguousDependencyCount: 0,
      dataWindowBindingCount: 0,
      unresolvedDataWindowBindingCount: 0,
      embeddedSqlCount: 0,
      dynamicSqlRiskCount: 0,
      blockingFindings: 1,
      warningFindings: 0,
      truncated: false,
    },
    findings: [],
    recommendedActions: ['Revisar el foco local.'],
  } as ApiObjectCheckReport;
}

function createCurrentObjectContext(): ApiCurrentObjectContext {
  return {
    available: true,
    objectInfo: {
      uri: 'file:///workspace/sample.sru',
      globalType: 'sample',
    },
  } as ApiCurrentObjectContext;
}

function createSafeEditPlan(): ApiSafeEditPlan {
  return {
    available: true,
    blocked: false,
    objects: [],
    files: [{
      uri: 'file:///workspace/sample.sru',
      reason: 'active focus',
      risk: 'low',
    }],
    risks: [],
    recommendedTests: ['npm run test:unit -- --grep "sample"'],
    docsToReview: ['docs/current-focus.md'],
    blockedReasons: [],
  };
}

function createDependencyGraph(): ApiPowerBuilderDependencyGraph {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-05-04T00:00:00.000Z',
    available: true,
    scope: 'immediate-neighborhood',
    focus: {
      objectName: 'sample',
      uri: 'file:///workspace/sample.sru',
    },
    summary: {
      nodeCount: 1,
      edgeCount: 0,
      dependencyCount: 0,
      dependentCount: 0,
      unresolvedDependencyCount: 0,
      ambiguousDependencyCount: 0,
    },
    nodes: [],
    edges: [],
    mermaidFlowchart: 'flowchart LR\nA --> B',
  } as ApiPowerBuilderDependencyGraph;
}

function createWorkspaceCheck(): ApiWorkspaceCheckReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-05-04T00:00:00.000Z',
    apiVersion: '2.17.0',
    mode: 'quick',
    status: 'passed',
    available: true,
    summary: {
      projectCount: 1,
      objectCount: 1,
      exportedSymbolCount: 1,
      diagnostics: { error: 0, warning: 0, info: 0, hint: 0 },
      catalogIssues: 0,
      blockingFindings: 0,
      warningFindings: 0,
      truncated: false,
    },
    findings: [],
    recommendedActions: [],
  } as ApiWorkspaceCheckReport;
}

function createOversizedWorkspaceCheck(): ApiWorkspaceCheckReport {
  return {
    ...createWorkspaceCheck(),
    findings: Array.from({ length: 48 }, (_, index) => ({
      code: `W${index}`,
      area: 'performance',
      severity: index % 2 === 0 ? 'warning' : 'info',
      category: 'workspace',
      message: `Finding ${index} ${'x'.repeat(240)}`,
      detail: `Detail ${index} ${'y'.repeat(360)}`,
    })),
    recommendedActions: Array.from({ length: 24 }, (_, index) => `Action ${index} ${'z'.repeat(180)}`),
  } as ApiWorkspaceCheckReport;
}

function createDiagnosticExplanation(): ApiExplainDiagnosticReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-05-04T00:00:00.000Z',
    apiVersion: '2.17.0',
    available: true,
    diagnostic: {
      uri: 'file:///workspace/sample.sru',
      message: 'Unused variable',
      severity: 'warning',
      line: 12,
      character: 4,
      endLine: 12,
      endCharacter: 8,
    },
    explanation: {
      title: 'Unused variable',
      summary: 'La variable no se usa.',
      area: 'semantic',
      confidence: 'high',
    },
    evidence: [],
    recommendedActions: ['Eliminar la variable.'],
  } as ApiExplainDiagnosticReport;
}

function createSystemSymbolExplanation(name = 'Abs'): ApiExplainSystemSymbolReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-05-04T00:00:00.000Z',
    apiVersion: '2.17.0',
    available: true,
    query: { name },
    resolution: {
      state: 'resolved',
      candidateCount: 1,
      confidence: 'high',
    },
    symbol: {
      name,
      kind: 'callable',
      domain: 'global-functions',
      summary: `${name} summary`,
      authority: 'generated',
    },
    findings: [],
    recommendedActions: ['Usar el simbolo con su signature oficial.'],
  };
}

suite('unit/aiTaskContextBundle (B381)', () => {
  test('compone un bundle bug-fix con safe edit plan y diagnostics', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'bug-fix',
        uri: 'file:///workspace/sample.sru',
      },
      objectCheck: createObjectCheck(),
      currentObjectContext: createCurrentObjectContext(),
      safeEditPlan: createSafeEditPlan(),
      diagnosticExplanations: [createDiagnosticExplanation()],
    });

    assert.equal(bundle.available, true);
    assert.equal(bundle.intent, 'bug-fix');
    assert.ok(bundle.context.objectCheck);
    assert.ok(bundle.context.safeEditPlan);
    assert.ok(bundle.context.diagnosticExplanations?.length);
    assert.ok(bundle.rules.some((rule) => rule.includes('Read-only')));
    assert.ok(bundle.validationCommands.includes('npm run build:test'));
  });

  test('prioriza dependencia y safe edit plan en refactor', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'refactor',
        objectName: 'sample',
      },
      objectCheck: createObjectCheck(),
      currentObjectContext: createCurrentObjectContext(),
      safeEditPlan: createSafeEditPlan(),
      dependencyGraph: createDependencyGraph(),
    });

    assert.equal(bundle.available, true);
    assert.ok(bundle.context.dependencyGraph);
    assert.ok(bundle.recommendedWorkflow.some((step) => step.includes('dependencyGraph')));
    assert.ok(bundle.recommendedWorkflow.some((step) => step.includes('safeEditPlan')));
  });

  test('mantiene explain-system-symbol como ancla principal en catalog-work', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'catalog-work',
        objectName: 'Abs',
      },
      systemSymbolExplanations: [createSystemSymbolExplanation('Abs')],
    });

    assert.equal(bundle.available, true);
    assert.equal(bundle.context.systemSymbolExplanations?.[0]?.symbol?.name, 'Abs');
    assert.ok(bundle.docsToReview.includes('docs/architecture.md'));
    assert.ok(bundle.rules.some((rule) => rule.includes('catalogo')));
  });

  test('degrada a unavailable cuando no hay foco ni contexto resoluble', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'unknown',
      },
    });

    assert.equal(bundle.available, false);
    assert.match(bundle.reason ?? '', /foco explicito/i);
  });

  test('marca truncado y registra omissions cuando el budget es muy bajo', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'diagnose',
        uri: 'file:///workspace/sample.sru',
        maxTokensHint: 80,
      },
      workspaceCheck: createWorkspaceCheck(),
      objectCheck: createObjectCheck(),
      currentObjectContext: createCurrentObjectContext(),
      safeEditPlan: createSafeEditPlan(),
      dependencyGraph: createDependencyGraph(),
      diagnosticExplanations: [createDiagnosticExplanation(), createDiagnosticExplanation()],
      systemSymbolExplanations: [createSystemSymbolExplanation('Abs'), createSystemSymbolExplanation('MessageBox')],
    });

    assert.equal(bundle.available, true);
    assert.equal(bundle.tokenBudget.truncated, true);
    assert.ok(bundle.reasonCodes.some((code) => code.startsWith('token-budget')));
    assert.ok((bundle.omissions.length ?? 0) > 0);
    assert.ok((bundle.tokenBudget.estimatedTokens ?? 0) <= 80);
  });

  test('expone reason codes y receipt de paginacion para secciones truncadas por límite', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'diagnose',
        uri: 'file:///workspace/sample.sru',
        maxTokensHint: 2400,
        maxDiagnostics: 1,
        maxSymbols: 1,
      },
      workspaceCheck: createWorkspaceCheck(),
      objectCheck: createObjectCheck(),
      currentObjectContext: createCurrentObjectContext(),
      safeEditPlan: createSafeEditPlan(),
      dependencyGraph: createDependencyGraph(),
      diagnosticExplanations: [createDiagnosticExplanation(), createDiagnosticExplanation()],
      systemSymbolExplanations: [createSystemSymbolExplanation('Abs'), createSystemSymbolExplanation('MessageBox')],
    });

    assert.ok(bundle.reasonCodes.includes('diagnostics-limit'));
    assert.ok(bundle.reasonCodes.includes('system-symbol-limit'));
    assert.deepEqual(bundle.pagination.diagnosticExplanations, {
      requested: 1,
      available: 2,
      included: 1,
      truncated: true,
      reasonCode: 'diagnostics-limit',
    });
    assert.deepEqual(bundle.pagination.systemSymbolExplanations, {
      requested: 1,
      available: 2,
      included: 1,
      truncated: true,
      reasonCode: 'system-symbol-limit',
    });
  });

  test('expone unavailable builder explicito', () => {
    const bundle = buildUnavailableAiTaskContextBundle('missing focus');
    assert.equal(bundle.available, false);
    assert.ok(bundle.reasonCodes.includes('missing-focus'));
    assert.ok(bundle.omissions.includes('missing focus'));
  });

  test('acota payloads grandes de workspace al budget declarado', () => {
    const bundle = buildAiTaskContextBundle({
      request: {
        intent: 'documentation-update',
        uri: 'file:///workspace/sample.sru',
        maxTokensHint: 220,
      },
      workspaceCheck: createOversizedWorkspaceCheck(),
      objectCheck: createObjectCheck(),
      currentObjectContext: createCurrentObjectContext(),
      systemSymbolExplanations: [createSystemSymbolExplanation('Abs')],
    });

    assert.equal(bundle.available, true);
    assert.equal(bundle.tokenBudget.truncated, true);
    assert.ok((bundle.tokenBudget.estimatedTokens ?? 0) <= 220);
    assert.ok(bundle.reasonCodes.some((code) => code.startsWith('token-budget')));
    assert.equal(bundle.context.workspaceCheck, undefined);
  });
});