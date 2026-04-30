import * as assert from 'assert/strict';
import { parseOnEvents } from '../../../src/server/parsing/onEventParser';

suite('unit/onEventParser (B104)', () => {
  test('detecta on w_main.create', () => {
    const events = parseOnEvents('on w_main.create\nend on\n');
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], { owner: 'w_main', event: 'create', line: 0 });
  });

  test('detecta varios', () => {
    const src = 'on w_main.create\nend on\non w_main.destroy\nend on\n';
    const events = parseOnEvents(src);
    assert.equal(events.length, 2);
    assert.equal(events[1].event, 'destroy');
  });

  test('ignora dentro de comentario', () => {
    const src = '// on w_main.create\n';
    assert.equal(parseOnEvents(src).length, 0);
  });
});
