import * as assert from 'assert/strict';

import { systemProvenanceToLineage } from '../../../src/server/knowledge/system/normalization';

suite('unit/systemNormalization', () => {
  test('systemProvenanceToLineage mapea provenance oficial al vocabulario común', () => {
    assert.deepEqual(
      systemProvenanceToLineage({ kind: 'generated', authority: 'official', source: 'pb2025' }),
      {
        sourceKind: 'system',
        authority: 'official',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct'
      }
    );
  });

  test('systemProvenanceToLineage degrada project/workspace/custom a confianza fallback', () => {
    assert.deepEqual(
      systemProvenanceToLineage({ kind: 'custom', authority: 'custom', source: 'user-catalog' }),
      {
        sourceKind: 'system',
        authority: 'custom',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'fallback'
      }
    );
  });
});