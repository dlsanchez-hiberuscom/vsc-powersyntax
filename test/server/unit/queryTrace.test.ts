import * as assert from 'assert/strict';
import { withTrace, recordTraceStep } from '../../../src/server/knowledge/queryTrace';

suite('unit/queryTrace (B136)', () => {
  test('captura pasos en orden', () => {
    const r = withTrace('q', () => {
      recordTraceStep('a');
      recordTraceStep('b', { hint: 1 });
      return 42;
    });
    assert.equal(r.result, 42);
    assert.deepEqual(r.trace.map((s) => s.name), ['a', 'b']);
    assert.deepEqual((r.trace[1].detail as any).hint, 1);
  });

  test('recordTraceStep fuera de trace es no-op', () => {
    recordTraceStep('huérfano');
  });

  test('traces anidados son independientes', () => {
    const outer = withTrace('outer', () => {
      recordTraceStep('o1');
      const inner = withTrace('inner', () => {
        recordTraceStep('i1');
        return 'x';
      });
      assert.deepEqual(inner.trace.map((s) => s.name), ['i1']);
      recordTraceStep('o2');
      return 1;
    });
    assert.deepEqual(outer.trace.map((s) => s.name), ['o1', 'o2']);
  });
});
