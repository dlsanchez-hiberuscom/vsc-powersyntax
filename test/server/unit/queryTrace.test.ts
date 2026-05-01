import * as assert from 'assert/strict';
import { getLastTrace, recordTraceStep, withTrace } from '../../../src/server/knowledge/queryTrace';

suite('unit/queryTrace (B136)', () => {
  test('captura pasos en orden', () => {
    const r = withTrace('q', () => {
      recordTraceStep('a');
      recordTraceStep('resolve:start', { hint: 1 });
      return 42;
    });
    assert.equal(r.result, 42);
    assert.deepEqual(r.trace.map((s) => s.name), ['a', 'resolve:start']);
    assert.equal(r.trace[0].phase, undefined);
    assert.equal(r.trace[0].action, undefined);
    assert.equal(r.trace[1].phase, 'resolve');
    assert.equal(r.trace[1].action, 'start');
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

  test('expone la última traza capturada', () => {
    withTrace('last', () => {
      recordTraceStep('winner');
      return 1;
    });

    const trace = getLastTrace();
    assert.equal(trace?.label, 'last');
    assert.ok((trace?.startedAt ?? 0) > 0);
    assert.ok((trace?.endedAt ?? 0) >= (trace?.startedAt ?? 0));
    assert.ok((trace?.durationMs ?? -1) >= 0);
    assert.equal(trace?.stepCount, 1);
    assert.equal(trace?.lastStepName, 'winner');
    assert.deepEqual(trace?.steps.map((step) => step.name), ['winner']);
  });

  test('getLastTrace devuelve clones de pasos y no expone mutaciones externas', () => {
    withTrace('clone', () => {
      recordTraceStep('targets:member-hierarchy');
      return 1;
    });

    const firstRead = getLastTrace();
    assert.ok(firstRead);
    firstRead.steps[0].name = 'mutated';

    const secondRead = getLastTrace();
    assert.equal(secondRead?.steps[0].name, 'targets:member-hierarchy');
  });

  test('expone el resumen ordenado de fases únicas', () => {
    withTrace('phases', () => {
      recordTraceStep('resolve:start');
      recordTraceStep('targets:member-hierarchy');
      recordTraceStep('resolve:end');
      return 1;
    });

    const trace = getLastTrace();
    assert.deepEqual(trace?.phases, ['resolve', 'targets']);
  });

  test('expone el resumen ordenado de acciones únicas', () => {
    withTrace('actions', () => {
      recordTraceStep('resolve:start');
      recordTraceStep('targets:member-hierarchy');
      recordTraceStep('resolve:start');
      return 1;
    });

    const trace = getLastTrace();
    assert.deepEqual(trace?.actions, ['start', 'member-hierarchy']);
  });
});
