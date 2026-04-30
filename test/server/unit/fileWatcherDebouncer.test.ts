import * as assert from 'assert/strict';
import { createFileWatcherDebouncer, FsEvent } from '../../../src/server/system/fileWatcherDebouncer';

suite('unit/fileWatcherDebouncer (B127)', () => {
  test('múltiples eventos sobre misma URI colapsan al último', () => {
    let flushed: FsEvent[] = [];
    const d = createFileWatcherDebouncer({ delayMs: 1000, onFlush: (e) => { flushed = e; } });
    d.push({ uri: 'a', kind: 'change' });
    d.push({ uri: 'a', kind: 'change' });
    d.push({ uri: 'a', kind: 'change' });
    d.flushNow();
    assert.equal(flushed.length, 1);
    assert.equal(flushed[0].kind, 'change');
  });

  test('eventos en URIs distintas se agrupan', () => {
    let flushed: FsEvent[] = [];
    const d = createFileWatcherDebouncer({ delayMs: 1000, onFlush: (e) => { flushed = e; } });
    d.push({ uri: 'a', kind: 'change' });
    d.push({ uri: 'b', kind: 'create' });
    d.flushNow();
    assert.equal(flushed.length, 2);
  });

  test('delete final descarta change previo', () => {
    let flushed: FsEvent[] = [];
    const d = createFileWatcherDebouncer({ delayMs: 1000, onFlush: (e) => { flushed = e; } });
    d.push({ uri: 'a', kind: 'change' });
    d.push({ uri: 'a', kind: 'delete' });
    d.flushNow();
    assert.equal(flushed[0].kind, 'delete');
  });

  test('dispose cancela flush pendiente', () => {
    let calls = 0;
    const d = createFileWatcherDebouncer({ delayMs: 5, onFlush: () => { calls++; } });
    d.push({ uri: 'a', kind: 'change' });
    d.dispose();
    return new Promise((r) => setTimeout(() => { assert.equal(calls, 0); r(undefined); }, 20));
  });
});
