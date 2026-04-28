import * as assert from 'assert/strict';

import { TaskScheduler, TaskPriority } from '../../../src/server/runtime/scheduler';

suite('unit/scheduler', () => {
  test('ejecuta tarea interactiva inmediatamente', async () => {
    const scheduler = new TaskScheduler();
    
    const result = await scheduler.runInteractive({
      id: 'test-interactive',
      priority: TaskPriority.Interactive,
      execute: () => 'interactive-result'
    });

    assert.equal(result, 'interactive-result');
    assert.equal(scheduler.isInteractiveBusy, false);
  });

  test('ejecuta tarea background si no hay interactivas', async () => {
    const scheduler = new TaskScheduler();
    
    const resultPromise = scheduler.enqueueBackground({
      id: 'test-background',
      priority: TaskPriority.Background,
      execute: () => 'background-result'
    });

    assert.equal(scheduler.pendingBackgroundCount, 1);
    
    const result = await resultPromise;
    assert.equal(result, 'background-result');
  });

  test('tarea interactiva cancela tarea background en curso', async () => {
    const scheduler = new TaskScheduler();
    
    let bgStarted = false;
    let bgCancelled = false;

    const bgPromise = scheduler.enqueueBackground({
      id: 'test-background',
      priority: TaskPriority.Background,
      execute: async (token) => {
        bgStarted = true;
        // Simular trabajo largo
        for (let i = 0; i < 50; i++) {
          if (token.isCancelled) {
            bgCancelled = true;
            throw new Error('Cancelled');
          }
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        return 'done';
      }
    });

    // Esperar a que el scheduler empiece la tarea background
    while (!bgStarted) {
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(bgStarted, true);

    // Lanzar una interactiva
    await scheduler.runInteractive({
      id: 'test-interactive',
      priority: TaskPriority.Interactive,
      execute: () => 'interactive-result'
    });

    // La interactiva debería haber cancelado la background
    await assert.rejects(bgPromise, /Cancelled/);

    // Ahora sí la tarea tuvo la oportunidad de procesar la cancelación
    assert.equal(bgCancelled, true);
  });

  test('cancelAllBackground cancela tareas encoladas', async () => {
    const scheduler = new TaskScheduler();
    
    // Forzar que el scheduler esté ocupado para que encole
    scheduler['activeInteractiveCount'] = 1; // Hack para el test
    
    const bgPromise1 = scheduler.enqueueBackground({
      id: 'test-background-1',
      priority: TaskPriority.Background,
      execute: () => 'done 1'
    });

    const bgPromise2 = scheduler.enqueueBackground({
      id: 'test-background-2',
      priority: TaskPriority.Background,
      execute: () => 'done 2'
    });

    assert.equal(scheduler.pendingBackgroundCount, 2);

    scheduler.cancelAllBackground();

    assert.equal(scheduler.pendingBackgroundCount, 0);

    await assert.rejects(bgPromise1, /cancelada/i);
    await assert.rejects(bgPromise2, /cancelada/i);
  });
});
