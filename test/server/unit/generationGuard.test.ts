import * as assert from 'assert/strict';

import {
  GenerationGuard,
  SchedulerGenerationRegistry,
} from '../../../src/server/runtime/generationGuard';

suite('unit/generationGuard', () => {
  suite('GenerationGuard', () => {
    test('current empieza en 0', () => {
      const g = new GenerationGuard();
      assert.equal(g.current(), 0);
    });

    test('increment retorna la nueva generación', () => {
      const g = new GenerationGuard();
      assert.equal(g.increment(), 1);
      assert.equal(g.increment(), 2);
    });

    test('isStale retorna true para generaciones anteriores', () => {
      const g = new GenerationGuard();
      const gen = g.increment(); // gen=1
      g.increment(); // gen=2
      assert.ok(g.isStale(gen), 'gen 1 es stale cuando actual es 2');
    });

    test('isCurrent retorna true para la generación actual', () => {
      const g = new GenerationGuard();
      const gen = g.increment(); // gen=1
      assert.ok(g.isCurrent(gen));
    });

    test('isCurrent retorna false para generaciones anteriores', () => {
      const g = new GenerationGuard();
      g.increment(); // gen=1
      const old = 0;
      assert.ok(!g.isCurrent(old));
    });
  });

  suite('SchedulerGenerationRegistry', () => {
    let registry: SchedulerGenerationRegistry;

    setup(() => {
      registry = new SchedulerGenerationRegistry();
    });

    test('getGuard crea guard nuevo para id desconocido', () => {
      const guard = registry.getGuard('uri-a');
      assert.ok(guard instanceof GenerationGuard);
    });

    test('getGuard retorna el mismo guard en llamadas sucesivas', () => {
      const g1 = registry.getGuard('uri-a');
      const g2 = registry.getGuard('uri-a');
      assert.equal(g1, g2);
    });

    test('cancelGeneration incrementa el guard', () => {
      const gen = registry.cancelGeneration('uri-a');
      assert.equal(gen, 1);
      assert.equal(registry.cancelGeneration('uri-a'), 2);
    });

    test('guard stale tras cancelGeneration', () => {
      const gen = registry.cancelGeneration('uri-b');
      registry.cancelGeneration('uri-b'); // 2ª cancelación
      assert.ok(registry.getGuard('uri-b').isStale(gen));
    });

    test('clearGuard elimina el guard', () => {
      const g1 = registry.getGuard('uri-c');
      g1.increment();
      registry.clearGuard('uri-c');
      // El nuevo guard debe empezar desde 0
      const g2 = registry.getGuard('uri-c');
      assert.equal(g2.current(), 0);
    });

    test('clear vacía todos los guards', () => {
      registry.getGuard('uri-x').increment();
      registry.getGuard('uri-y').increment();
      registry.clear();
      // Después de clear, nuevos guards empiezan en 0
      assert.equal(registry.getGuard('uri-x').current(), 0);
    });
  });
});
