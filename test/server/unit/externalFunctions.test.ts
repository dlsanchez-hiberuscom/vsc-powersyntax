import * as assert from 'assert/strict';
import { classifyExternalLibrary, parseExternalFunction } from '../../../src/server/parsing/externalFunctions';

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
    assert.equal(r?.externalCallableKind, 'library');
    assert.equal(r?.alias, 'BarA');
  });

  test('acepta nombres externos con $, # y %', () => {
    const fn = parseExternalFunction('function int Foo$() library "k.dll"');
    const sub = parseExternalFunction('subroutine Bar#%() library "k.dll" alias for "BarA"');
    assert.ok(fn);
    assert.ok(sub);
    assert.equal(fn?.name, 'Foo$');
    assert.equal(sub?.name, 'Bar#%');
  });

  test('línea no externa → null', () => {
    assert.equal(parseExternalFunction('integer i'), null);
  });

  test('clasifica dependencias dll, pbx y unknown', () => {
    assert.equal(classifyExternalLibrary('kernel32.dll'), 'dll');
    assert.equal(classifyExternalLibrary('native_driver.pbx'), 'pbx');
    assert.equal(classifyExternalLibrary('libcustom.so'), 'unknown');
  });

  test('function ... rpcfunc alias for', () => {
    const r = parseExternalFunction('function long sp_update(long al_id) rpcfunc alias for "sp_update_customer"');
    assert.ok(r);
    assert.equal(r?.kind, 'function');
    assert.equal(r?.name, 'sp_update');
    assert.equal(r?.returnType, 'long');
    assert.equal(r?.externalCallableKind, 'rpcfunc');
    assert.equal(r?.library, undefined);
    assert.equal(r?.alias, 'sp_update_customer');
  });

  test('subroutine ... rpcfunc', () => {
    const r = parseExternalFunction('subroutine sp_recalculate(long al_id) rpcfunc');
    assert.ok(r);
    assert.equal(r?.kind, 'subroutine');
    assert.equal(r?.name, 'sp_recalculate');
    assert.equal(r?.externalCallableKind, 'rpcfunc');
  });
});
