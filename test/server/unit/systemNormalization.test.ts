import * as assert from 'assert/strict';

import {
  buildSystemSymbolId,
  systemProvenanceToLineage,
} from '../../../src/server/knowledge/system/normalization';

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

  test('buildSystemSymbolId distingue enumerated-values homónimos por enumValueOf', () => {
    const borderId = buildSystemSymbolId({
      dataset: 'manual-core',
      domain: 'enumerated-values',
      kind: 'enumerated-value',
      namespace: 'powerbuilder-runtime',
      invocation: 'global',
      name: 'StyleBox!',
      enumValueOf: 'Border',
      ownerTypes: undefined,
    });
    const borderStyleId = buildSystemSymbolId({
      dataset: 'manual-core',
      domain: 'enumerated-values',
      kind: 'enumerated-value',
      namespace: 'powerbuilder-runtime',
      invocation: 'global',
      name: 'StyleBox!',
      enumValueOf: 'BorderStyle',
      ownerTypes: undefined,
    });

    assert.notEqual(borderId, borderStyleId);
    assert.match(borderId, /:border:stylebox!:all$/);
    assert.match(borderStyleId, /:borderstyle:stylebox!:all$/);
  });
});