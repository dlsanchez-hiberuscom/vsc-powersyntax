import * as assert from 'assert/strict';
import { createFairScheduler } from '../../../src/server/runtime/fairScheduler';

suite('unit/fairScheduler (B129)', () => {
  test('round-robin entre dos proyectos', () => {
    const s = createFairScheduler<number>();
    s.enqueue('a', 1);
    s.enqueue('a', 2);
    s.enqueue('a', 3);
    s.enqueue('b', 10);
    s.enqueue('b', 20);

    const seq: string[] = [];
    while (s.size() > 0) {
      const next = s.dequeue();
      if (next) seq.push(next.project);
    }
    // Debe alternar a/b/a/b/a hasta agotar a.
    assert.deepEqual(seq, ['a', 'b', 'a', 'b', 'a']);
  });

  test('dequeue vacío → undefined', () => {
    const s = createFairScheduler<number>();
    assert.equal(s.dequeue(), undefined);
  });
});
