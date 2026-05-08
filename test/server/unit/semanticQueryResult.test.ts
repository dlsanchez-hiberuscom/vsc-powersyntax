import * as assert from 'assert/strict';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';
import { toSemanticQueryResult, type SemanticQuery } from '../../../src/server/knowledge/resolution/semanticQueryResult';
import type { ResolvedTargetInfo } from '../../../src/server/knowledge/resolution/semanticQueryService';

suite('unit/semanticQueryResult (PB-ARCH-P0)', () => {
  test('toSemanticQueryResult mapea correctamente un ResolvedTargetInfo existoso', () => {
    const entity: Entity = {
      id: 'of_test',
      name: 'of_Test',
      kind: EntityKind.Function,
      uri: 'file:///w_main.sru',
      line: 10,
      character: 5,
      containerName: 'w_main',
      lineage: {
        confidence: 'direct',
        sourceKind: 'document',
        authority: 'derived'
      }
    };

    const info: ResolvedTargetInfo = {
      context: { qualifier: 'this', identifier: 'of_test', separator: '.' },
      targets: [entity],
      reasonCodes: ['local-scope'],
      invocationKind: 'this-call',
      invocationRisk: 'safe',
      confidence: 'high',
      evidence: [
        {
          kind: 'winner-target',
          reasonCode: 'local-scope',
          confidence: 'direct',
          targetName: 'of_Test',
          targetKind: EntityKind.Function,
          targetUri: 'file:///w_main.sru'
        }
      ],
      candidatePool: [],
      trace: [],
      winnerLineage: {
        sourceKind: 'document',
        confidence: 'direct',
        resolutionKind: 'local-scope',
        authority: 'derived'
      }
    };

    const query: SemanticQuery = {
      uri: 'file:///w_main.sru',
      invocationKind: 'this-call'
    };

    const result = toSemanticQueryResult(info, query, 123);

    assert.equal(result.target, entity);
    assert.equal(result.kind, 'workspace-symbol');
    assert.equal(result.confidence.level, 'high');
    assert.equal(result.confidence.lineage, 'direct');
    assert.equal(result.semanticEpoch, 123);
    assert.deepEqual(result.reasons, ['local-scope']);
    assert.equal(result.owner?.name, 'w_main');
    assert.equal(result.evidence.length, 1);
    assert.equal(result.evidence[0].kind, 'winner-target');
  });

  test('toSemanticQueryResult maneja resoluciones fallidas', () => {
    const info: ResolvedTargetInfo = {
      context: { identifier: 'unknown_var' },
      targets: [],
      reasonCodes: [],
      invocationKind: 'local-symbol',
      invocationRisk: 'dynamic',
      confidence: 'low',
      evidence: [],
      candidatePool: [],
      trace: [],
      winnerLineage: null
    };

    const query: SemanticQuery = {
      uri: 'file:///w_main.sru'
    };

    const result = toSemanticQueryResult(info, query, 456);

    assert.equal(result.target, null);
    assert.equal(result.kind, 'unknown');
    assert.equal(result.confidence.level, 'low');
    assert.equal(result.confidence.lineage, 'unknown');
    assert.equal(result.semanticEpoch, 456);
  });
});
