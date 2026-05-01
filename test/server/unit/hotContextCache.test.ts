import * as assert from 'assert/strict';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import type { Entity } from '../../../src/server/knowledge/types';

function makeEntity(name: string): Entity {
  return {
    id: name.toLowerCase(),
    name,
    kind: 'function' as Entity['kind'],
    uri: 'file:///x.sru',
    line: 0,
    character: 0
  };
}

suite('unit/HotContextCache', () => {
  test('setActive con misma URI/version no invalida', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);

    cache.setActive('file:///a.sru', 1);
    assert.equal(cache.getActiveEntities()?.length, 1);
  });

  test('cambio de URI invalida', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);

    cache.setActive('file:///b.sru', 1);
    assert.equal(cache.getActiveEntities(), undefined);
    assert.equal(cache.getActiveUri(), 'file:///b.sru');
  });

  test('cambio de kbVersion invalida', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);
    cache.setInheritedMembers('n_cst_a', [makeEntity('bar')]);

    cache.setActive('file:///a.sru', 2);
    assert.equal(cache.getActiveEntities(), undefined);
    assert.equal(cache.getInheritedMembers('n_cst_a'), undefined);
  });

  test('invalidateForUri(activeUri) limpia entradas pero conserva activeUri', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);
    cache.setInheritedMembers('n_cst_a', [makeEntity('bar')]);

    cache.invalidateForUri('file:///a.sru');

    assert.equal(cache.getActiveUri(), 'file:///a.sru');
    assert.equal(cache.getActiveEntities(), undefined);
    assert.equal(cache.getInheritedMembers('n_cst_a'), undefined);
  });

  test('invalidateForUri(otra) limpia inheritedMembers y conserva activeEntities', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);
    cache.setInheritedMembers('n_cst_a', [makeEntity('bar')]);

    cache.invalidateForUri('file:///c.sru');

    assert.equal(cache.getActiveUri(), 'file:///a.sru');
    assert.equal(cache.getActiveEntities()?.length, 1);
    assert.equal(cache.getInheritedMembers('n_cst_a'), undefined);
  });

  test('reset limpia identidad y entradas', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities([makeEntity('foo')]);

    cache.reset();
    assert.equal(cache.getActiveUri(), null);
    assert.equal(cache.getKbVersion(), -1);
    assert.equal(cache.getActiveEntities(), undefined);
  });

  test('getInheritedMembers es case-insensitive', () => {
    const cache = new HotContextCache();
    cache.setActive('file:///a.sru', 1);
    cache.setInheritedMembers('N_Cst_A', [makeEntity('bar')]);

    assert.equal(cache.getInheritedMembers('n_cst_a')?.length, 1);
    assert.equal(cache.getInheritedMembers('N_CST_A')?.length, 1);
  });

  test('getters y setters copian defensivamente', () => {
    const cache = new HotContextCache();
    const activeEntities = [makeEntity('foo')];
    const inheritedMembers = [makeEntity('bar')];

    cache.setActive('file:///a.sru', 1);
    cache.setActiveEntities(activeEntities);
    cache.setInheritedMembers('n_cst_a', inheritedMembers);

    activeEntities[0].name = 'mutated-outside';
    inheritedMembers[0].name = 'mutated-outside';

    const readActive = cache.getActiveEntities()!;
    const readMembers = cache.getInheritedMembers('n_cst_a')!;
    readActive[0].name = 'mutated-read';
    readMembers[0].name = 'mutated-read';

    assert.equal(cache.getActiveEntities()?.[0].name, 'foo');
    assert.equal(cache.getInheritedMembers('n_cst_a')?.[0].name, 'bar');
  });
});
