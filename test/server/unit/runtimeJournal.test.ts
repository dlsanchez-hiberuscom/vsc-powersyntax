import * as assert from 'assert/strict';

import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';

suite('unit/runtimeJournal (B163)', () => {
  test('registra eventos exportables con fases y latencias', () => {
    const journal = new RuntimeJournal(4);

    journal.record({
      phase: 'query',
      kind: 'query-trace',
      action: 'definition',
      durationMs: 5,
      detail: { confidence: 'high' }
    });

    const snapshot = journal.snapshot();
    assert.equal(snapshot.total, 1);
    assert.equal(snapshot.events[0].phase, 'query');
    assert.equal(snapshot.events[0].durationMs, 5);
    assert.deepEqual(snapshot.events[0].detail, { confidence: 'high' });
  });

  test('mantiene ring buffer y contabiliza dropped events', () => {
    const journal = new RuntimeJournal(2);

    journal.record({ phase: 'cache', kind: 'serving-cache', action: 'hit', hits: 1 });
    journal.record({ phase: 'cache', kind: 'serving-cache', action: 'miss', misses: 1 });
    journal.record({ phase: 'invalidation', kind: 'semantic-invalidation', action: 'document-change', invalidationCount: 3 });

    const snapshot = journal.snapshot();
    assert.equal(snapshot.total, 3);
    assert.equal(snapshot.dropped, 1);
    assert.deepEqual(snapshot.events.map((event) => event.action), ['miss', 'document-change']);
  });
});