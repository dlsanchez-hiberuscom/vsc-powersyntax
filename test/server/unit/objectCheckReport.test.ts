import * as assert from 'assert/strict';

import {
  buildObjectCheckMarkdown,
  buildObjectCheckReport,
  buildUnavailableObjectCheckReport,
} from '../../../src/client/objectCheckReport';
import type {
  ApiCurrentObjectContext,
  ApiImpactAnalysis,
  ApiPowerBuilderDependencyGraph,
  ApiSafeEditPlan,
} from '../../../src/shared/publicApi';

function createContext(): ApiCurrentObjectContext {
  return {
    available: true,
    uri: 'file:///workspace/w_main.srw',
    objectInfo: {
      uri: 'file:///workspace/w_main.srw',
      globalType: 'w_main',
      objectKind: 'window',
      readiness: 'ready',
    },
    diagnostics: {
      total: 0,
      byCode: {},
      bySeverity: {},
      items: [],
    },
    dataWindowBindings: [
      {
        targetName: 'dw_main',
        line: 10,
        dataObject: 'd_main',
        state: 'resolved',
        targetUri: 'file:///workspace/d_main.srd',
        retrieveArguments: [],
      },
    ],
    embeddedSqlAnchors: [],
    ancestorChain: [
      {
        name: 'w_base',
        uri: 'file:///workspace/w_base.srw',
      },
    ],
    frameworkKnowledgeConflict: {
      state: 'workspace-wins',
      reasonCode: 'workspace-source-overrides-framework-pack',
      summary: 'El símbolo real del workspace prevalece y el pack queda advisory.',
      matchedOwnerTypes: ['w_main', 'window'],
      packs: [
        {
          id: 'appeon-webbrowser-webview2',
          version: '1.0.0',
          title: 'WebBrowser / WebView2',
          ownerTypes: ['webbrowser'],
          source: 'VSC PowerSyntax curated framework pack',
        },
      ],
      sourceOrigin: 'pbl-folder-source',
      confidence: 'high',
    },
  };
}

function createDependencyGraph(): ApiPowerBuilderDependencyGraph {
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    available: true,
    scope: 'immediate-neighborhood',
    focus: {
      objectName: 'w_main',
      uri: 'file:///workspace/w_main.srw',
    },
    summary: {
      nodeCount: 2,
      edgeCount: 1,
      dependencyCount: 1,
      dependentCount: 0,
      unresolvedDependencyCount: 0,
      ambiguousDependencyCount: 0,
    },
    nodes: [
      {
        id: 'focus:w_main',
        label: 'w_main',
        kind: 'focus-object',
        resolution: 'resolved',
        uri: 'file:///workspace/w_main.srw',
      },
      {
        id: 'dep:w_base',
        label: 'w_base',
        kind: 'workspace-object',
        resolution: 'resolved',
        uri: 'file:///workspace/w_base.srw',
      },
    ],
    edges: [
      {
        sourceId: 'focus:w_main',
        targetId: 'dep:w_base',
        relation: 'inherits',
        reason: 'base type',
        resolved: true,
      },
    ],
    mermaidFlowchart: 'flowchart LR\n  focus --> base',
  };
}

function createImpactAnalysis(): ApiImpactAnalysis {
  return {
    available: true,
    safeReferences: [],
    probableImpactFiles: [],
    descendants: [],
    overrides: [],
    relatedEvents: [],
    relatedDataWindows: [],
    affectedSymbols: [],
    buildTargets: [],
  };
}

function createSafeEditPlan(): ApiSafeEditPlan {
  return {
    available: true,
    blocked: false,
    confidence: 'high',
    objects: [],
    files: [],
    risks: [],
    recommendedTests: [],
    docsToReview: [],
    blockedReasons: [],
  };
}

suite('unit/objectCheckReport (B377)', () => {
  test('devuelve passed cuando el objeto esta sano', () => {
    const report = buildObjectCheckReport({
      source: {
        kind: 'active-editor',
        uri: 'file:///workspace/w_main.srw',
      },
      objectContext: createContext(),
      dependencyGraph: createDependencyGraph(),
      safeEditPlan: createSafeEditPlan(),
    });

    assert.equal(report.available, true);
    assert.equal(report.status, 'passed');
    assert.equal(report.summary.objectName, 'w_main');
    assert.match(buildObjectCheckMarkdown(report), /# Object Check/);
  });

  test('devuelve failed con diagnostics de error o safe edit blocked', () => {
    const context = createContext();
    context.diagnostics = {
      total: 1,
      byCode: { PB1001: 1 },
      bySeverity: { error: 1 },
      items: [
        {
          message: 'error de compilacion',
          code: 'PB1001',
          severity: 'error',
          line: 8,
          character: 2,
        },
      ],
    };

    const safeEditPlan = createSafeEditPlan();
    safeEditPlan.blocked = true;
    safeEditPlan.blockedReasons = ['sourceOrigin dynamic'];

    const report = buildObjectCheckReport({
      source: {
        kind: 'uri',
        uri: 'file:///workspace/w_main.srw',
      },
      objectContext: context,
      dependencyGraph: createDependencyGraph(),
      safeEditPlan,
    });

    assert.equal(report.status, 'failed');
    assert.ok(report.findings.some((finding) => finding.code === 'object-diagnostics-errors'));
    assert.ok(report.findings.some((finding) => finding.code === 'safe-edit-plan-blocked'));
  });

  test('devuelve warning con dependencias ambiguas, binding missing y sql execute', () => {
    const context = createContext();
    context.dataWindowBindings = [
      {
        targetName: 'dw_main',
        line: 10,
        dataObject: 'd_missing',
        state: 'missing',
        retrieveArguments: [],
      },
    ];
    context.embeddedSqlAnchors = [
      {
        startLine: 20,
        endLine: 22,
        keyword: 'EXECUTE',
        preview: 'EXECUTE IMMEDIATE :ls_sql;',
        confidence: 'medium',
      },
    ];
    context.diagnostics = {
      total: 1,
      byCode: { PB2001: 1 },
      bySeverity: { warning: 1 },
      items: [
        {
          message: 'warning semantico',
          code: 'PB2001',
          severity: 'warning',
          line: 12,
          character: 1,
        },
      ],
    };

    const dependencyGraph = createDependencyGraph();
    dependencyGraph.summary.unresolvedDependencyCount = 1;
    dependencyGraph.summary.ambiguousDependencyCount = 1;
    dependencyGraph.summary.nodeCount = 6;

    const report = buildObjectCheckReport({
      request: {
        maxFindings: 3,
      },
      source: {
        kind: 'active-editor',
        uri: 'file:///workspace/w_main.srw',
      },
      objectContext: context,
      dependencyGraph,
      safeEditPlan: createSafeEditPlan(),
      impactAnalysis: createImpactAnalysis(),
    });

    assert.equal(report.status, 'warning');
    assert.equal(report.summary.unresolvedDataWindowBindingCount, 1);
    assert.equal(report.summary.dynamicSqlRiskCount, 1);
    assert.equal(report.summary.truncated, true);
    assert.equal(report.findings.length, 3);
  });

  test('reporta en findings la policy de knowledge packs sin degradar un objeto sano', () => {
    const report = buildObjectCheckReport({
      source: {
        kind: 'active-editor',
        uri: 'file:///workspace/w_main.srw',
      },
      objectContext: createContext(),
      dependencyGraph: createDependencyGraph(),
      safeEditPlan: createSafeEditPlan(),
    });

    assert.equal(report.status, 'passed');
    assert.ok(report.findings.some((finding) => finding.code === 'framework-knowledge-workspace-wins'));
    assert.ok(report.recommendedActions.some((action) => action.includes('knowledge pack aplicable')));
  });

  test('expone unavailable si no hay context pack', () => {
    const report = buildUnavailableObjectCheckReport('missing object', {
      kind: 'object-name',
      objectName: 'w_missing',
    });

    assert.equal(report.available, false);
    assert.equal(report.status, 'failed');
    assert.match(report.reason ?? '', /missing object/);
  });
});