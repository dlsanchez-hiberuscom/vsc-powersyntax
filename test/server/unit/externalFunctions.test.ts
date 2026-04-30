import * as assert from 'assert/strict';
import { parseExternalFunction } from '../../../src/server/parsing/externalFunctions';

suite('unit/externalFunctions (B073)', () => {
  test('function ... library', () => {
    const r = parseExternalFunction('function int Foo(int a) library "k.dll"');
    assert.ok(r);
    assert.equal(r?.kind, 'function');
    assert.equal(r?.name, 'Foo');
    assert.equal(r?.returnType, 'int');
    assert.equal(r?.library, 'k.dll');
  });

  test('subroutine ... library alias for', () => {
    const r = parseExternalFunction('subroutine Bar() library "k.dll" alias for "BarA"');
    assert.ok(r);
    assert.equal(r?.kind, 'subroutine');
    assert.equal(r?.name, 'Bar');
    assert.equal(r?.alias, 'BarA');
  });

  test('línea no externa → null', () => {
    assert.equal(parseExternalFunction('integer i'), null);
  });
});
