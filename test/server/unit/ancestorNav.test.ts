import * as assert from 'assert/strict';
import { getAncestorChain } from '../../../src/server/features/ancestorNav';

suite('unit/ancestorNav (B065)', () => {
  test('cadena lineal', () => {
    const map: Record<string, string | undefined> = {
      w_child: 'w_parent',
      w_parent: 'window'
    };
    const chain = getAncestorChain('w_child', (n) => map[n.toLowerCase()]);
    assert.deepEqual(chain, ['w_parent', 'window']);
  });

  test('sin ancestor', () => {
    assert.deepEqual(getAncestorChain('window', () => undefined), []);
  });

  test('ciclo no causa bucle', () => {
    const map: Record<string, string> = { a: 'b', b: 'a' };
    const chain = getAncestorChain('a', (n) => map[n]);
    assert.ok(chain.length <= 2);
  });
});
