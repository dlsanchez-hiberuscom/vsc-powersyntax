import * as assert from 'assert/strict';

import { InteractiveLoopGuard } from '../../../src/server/runtime/interactiveLoopGuard';

suite('unit/interactiveLoopGuard', () => {
  test('reutiliza la misma promesa mientras la key sigue en vuelo', async () => {
    const guard = new InteractiveLoopGuard();
    let executions = 0;
    let resolveFirst: ((value: number) => void) | undefined;
    const first = new Promise<number>((resolve) => {
      resolveFirst = resolve;
    });

    const requestA = guard.run('hover|file:///test.sru|7|4:12', () => {
      executions++;
      return first;
    });
    const requestB = guard.run('hover|file:///test.sru|7|4:12', () => {
      executions++;
      return 99;
    });

    assert.strictEqual(requestA, requestB);
    assert.equal(guard.getInFlightCount(), 1);

    resolveFirst?.(42);
    const result = await requestB;

    assert.equal(result, 42);
    assert.equal(executions, 1);
    assert.equal(guard.getInFlightCount(), 0);
  });

  test('libera la key al completar para permitir una nueva ejecución', async () => {
    const guard = new InteractiveLoopGuard();
    let executions = 0;

    const first = await guard.run('definition|file:///test.sru|7|9:3', async () => {
      executions++;
      return 'first';
    });
    const second = await guard.run('definition|file:///test.sru|7|9:3', async () => {
      executions++;
      return 'second';
    });

    assert.equal(first, 'first');
    assert.equal(second, 'second');
    assert.equal(executions, 2);
    assert.equal(guard.getInFlightCount(), 0);
  });
});