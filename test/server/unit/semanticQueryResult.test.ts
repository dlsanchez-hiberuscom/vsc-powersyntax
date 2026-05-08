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
        sourceOrigin: 'solution-source',
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
      invocationKind: 'this-call',
      sourceOriginPolicy: {
        allowStaging: false,
        allowGenerated: false,
        allowExternal: true,
      },
      budgetMs: 50,
      resultCap: 8,
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
    assert.equal(result.scope?.currentObject, 'w_main');
    assert.equal(result.source?.origin, 'solution-source');
    assert.equal(result.source?.authority, 'derived');
    assert.equal(result.source?.snapshotIdentity, 'semantic-epoch:123');
    assert.equal(result.query.resultCap, 8);
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
    assert.equal(result.degraded?.state, 'dynamic');
  });

  test('toSemanticQueryResult marca timeout degradado cuando la traza excede el budget', () => {
    const info: ResolvedTargetInfo = {
      context: { identifier: 'of_slow' },
      targets: [],
      reasonCodes: ['global-fallback'],
      invocationKind: 'local-symbol',
      invocationRisk: 'fallback',
      confidence: 'low',
      evidence: [],
      candidatePool: [],
      trace: [
        {
          name: 'budget:exceeded',
          phase: 'budget',
          action: 'exceeded',
          detail: {
            budgetMs: 25,
            durationMs: 40,
            exceededByMs: 15,
          },
          ts: 0,
        },
      ],
      winnerLineage: null
    };

    const result = toSemanticQueryResult(info, { uri: 'file:///w_main.sru', budgetMs: 25 }, 789);

    assert.equal(result.degraded?.state, 'timeout');
    assert.match(result.degraded?.reason ?? '', /25ms/i);
  });
});
