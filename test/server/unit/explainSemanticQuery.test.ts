import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildExplainSemanticQueryMarkdown } from '../../../src/client/explainSemanticQueryReport';
import { buildExplainSemanticQueryReport } from '../../../src/server/features/explainSemanticQuery';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/explainSemanticQuery (B284)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      {
        id: 'of_setdata_base',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_base',
        uri: 'file:///w_base.sru',
        line: 10,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);

    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      {
        id: 'of_setdata_main',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 20,
        character: 4,
        lineage: { sourceKind: 'document', sourceOrigin: 'solution-source', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_ambiguous_a',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 30,
        character: 4,
        lineage: { sourceKind: 'document', sourceOrigin: 'solution-source', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_ambiguous_b',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 40,
        character: 4,
        lineage: { sourceKind: 'document', sourceOrigin: 'solution-source', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);
    kb.endBatchUpdate();
  });

  test('exporta plan legible para winner unico con discards y coste', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_SetData()');
    const report = buildExplainSemanticQueryReport({
      uri: document.uri,
      line: 0,
      character: 5,
    }, {
      knowledgeBase: kb,
      inheritanceGraph: graph,
      document,
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'resolved');
    assert.equal(report.resolution.primaryReasonCode, 'member-hierarchy');
    assert.equal(report.winner?.name, 'of_SetData');
    assert.equal(report.winner?.sourceOrigin, 'solution-source');
    assert.ok((report.discards?.length ?? 0) > 0);
    assert.ok(report.discards?.some((item) => item.kind === 'discarded-distance'));
    assert.ok(report.phases.some((phase) => phase.name === 'resolution' && phase.status === 'resolved'));
    assert.equal(report.cost.traceSteps > 0, true);
    assert.match(buildExplainSemanticQueryMarkdown(report), /Explain Semantic Query/);
  });

  test('exporta plan ambiguo con findings y candidatos multiples', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_Ambiguous()');
    const report = buildExplainSemanticQueryReport({
      uri: document.uri,
      line: 0,
      character: 5,
      maxCandidates: 2,
    }, {
      knowledgeBase: kb,
      inheritanceGraph: graph,
      document,
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'ambiguous');
    assert.equal(report.resolution.ambiguityKind, 'distance-minimum');
    assert.equal(report.winner, undefined);
    assert.equal(report.candidates?.length, 2);
    assert.ok(report.findings.some((finding) => finding.code === 'query-ambiguous'));
    assert.ok(report.recommendedActions.some((action) => action.includes('qualifier')));
    assert.ok(report.phases.some((phase) => phase.name === 'candidates' && phase.status === 'ambiguous'));
  });
});