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

  // ----- Multinivel: Near vs Background -----

  test('Near se ejecuta antes que Background aunque Background entre primero', async () => {
    const scheduler = new TaskScheduler();
    const order: string[] = [];

    const bgPromise = scheduler.enqueueBackground({
      id: 'bg-1',
      priority: TaskPriority.Background,
      execute: async () => {
        order.push('bg');
        return 'bg';
      }
    });

    const nearPromise = scheduler.enqueueNear({
      id: 'near-1',
      priority: TaskPriority.Near,
      execute: async () => {
        order.push('near');
        return 'near';
      }
    });

    await Promise.all([nearPromise, bgPromise]);
    assert.deepEqual(order, ['near', 'bg']);
  });

  test('Near cancela Background activo', async () => {
    const scheduler = new TaskScheduler();
    let bgStarted = false;
    let bgCancelled = false;

    const bgPromise = scheduler.enqueueBackground({
      id: 'bg-long',
      priority: TaskPriority.Background,
      execute: async (token) => {
        bgStarted = true;
        for (let i = 0; i < 100; i++) {
          if (token.isCancelled) {
            bgCancelled = true;
            throw new Error('Cancelled');
          }
          await new Promise((r) => setTimeout(r, 1));
        }
        return 'done';
      }
    });

    while (!bgStarted) {
      await new Promise((r) => setImmediate(r));
    }

    const nearResult = await scheduler.enqueueNear({
      id: 'near-pre',
      priority: TaskPriority.Near,
      execute: () => 'near-result'
    });
    assert.equal(nearResult, 'near-result');

    await assert.rejects(bgPromise, /Cancelled/);
    assert.equal(bgCancelled, true);
  });

  test('Interactive cancela Near activo', async () => {
    const scheduler = new TaskScheduler();
    let nearStarted = false;
    let nearCancelled = false;

    const nearPromise = scheduler.enqueueNear({
      id: 'near-long',
      priority: TaskPriority.Near,
      execute: async (token) => {
        nearStarted = true;
        for (let i = 0; i < 100; i++) {
          if (token.isCancelled) {
            nearCancelled = true;
            throw new Error('Cancelled');
          }
          await new Promise((r) => setTimeout(r, 1));
        }
        return 'done';
      }
    });

    while (!nearStarted) {
      await new Promise((r) => setImmediate(r));
    }

    await scheduler.runInteractive({
      id: 'inter-pre',
      priority: TaskPriority.Interactive,
      execute: () => 'inter'
    });

    await assert.rejects(nearPromise, /Cancelled/);
    assert.equal(nearCancelled, true);
  });

  test('cancelAllNear cancela pendientes', async () => {
    const scheduler = new TaskScheduler();
    scheduler['activeInteractiveCount'] = 1; // bloquear drain

    const p1 = scheduler.enqueueNear({
      id: 'near-1',
      priority: TaskPriority.Near,
      execute: () => 'r1'
    });
    const p2 = scheduler.enqueueNear({
      id: 'near-2',
      priority: TaskPriority.Near,
      execute: () => 'r2'
    });

    assert.equal(scheduler.pendingNearCount, 2);
    scheduler.cancelAllNear();
    assert.equal(scheduler.pendingNearCount, 0);

    await assert.rejects(p1, /cancelada/i);
    await assert.rejects(p2, /cancelada/i);
  });

  test('expone preempciones en getStatus', async () => {
    const scheduler = new TaskScheduler();
    let bgStarted = false;

    const bgPromise = scheduler.enqueueBackground({
      id: 'bg-status',
      priority: TaskPriority.Background,
      execute: async (token) => {
        bgStarted = true;
        while (!token.isCancelled) {
          await new Promise((r) => setTimeout(r, 1));
        }
        throw new Error('Cancelled');
      }
    });

    while (!bgStarted) {
      await new Promise((r) => setImmediate(r));
    }

    await scheduler.enqueueNear({
      id: 'near-status',
      priority: TaskPriority.Near,
      execute: () => 'near'
    });

    await assert.rejects(bgPromise, /Cancelled/);
    const status = scheduler.getStatus();
    assert.equal(status.preemptions.nearCancelledBackground, 1);
    assert.equal(status.activeBackgroundId, null);
  });

  test('pospone background mientras la puerta de admision esta cerrada', async () => {
    const scheduler = new TaskScheduler();
    let allowBackground = false;
    let started = false;

    scheduler.setBackgroundAdmissionGate(() => ({
      allowed: allowBackground,
      reason: 'latency-pressure:background-indexing'
    }));

    const backgroundPromise = scheduler.enqueueBackground({
      id: 'bg-gated',
      priority: TaskPriority.Background,
      workload: 'background-indexing',
      execute: () => {
        started = true;
        return 'background-result';
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(started, false);
    assert.equal(scheduler.getStatus().throttledBackgroundWorkload, 'background-indexing');
    assert.equal(scheduler.getStatus().throttledBackgroundReason, 'latency-pressure:background-indexing');

    allowBackground = true;
    scheduler.requestDrain();

    const result = await backgroundPromise;
    assert.equal(result, 'background-result');
    assert.equal(started, true);
  });

  test('expone pending workloads por clase mientras el background sigue throttled', async () => {
    const scheduler = new TaskScheduler();
    let allowBackground = false;

    scheduler.setBackgroundAdmissionGate((task) => ({
      allowed: allowBackground,
      reason: `latency-pressure:${task.workload ?? 'background-indexing'}`
    }));

    const backgroundPromise = scheduler.enqueueBackground({
      id: 'report-gated',
      priority: TaskPriority.Background,
      workload: 'export-reporting',
      execute: () => 'report-result'
    });

    const nearPromise = scheduler.enqueueNear({
      id: 'near-summary',
      priority: TaskPriority.Near,
      workload: 'near-context',
      execute: () => 'near-result'
    });

    assert.equal(await nearPromise, 'near-result');

    await new Promise((resolve) => setTimeout(resolve, 30));

    const status = scheduler.getStatus();
    assert.equal(status.pendingWorkloads['export-reporting'], 1);
    assert.equal(status.throttledBackgroundWorkload, 'export-reporting');
    assert.equal(status.throttledBackgroundReason, 'latency-pressure:export-reporting');

    allowBackground = true;
    scheduler.requestDrain();
    assert.equal(await backgroundPromise, 'report-result');
  });

  test('build preserva su ejecución activa frente a preempción interactiva', async () => {
    const scheduler = new TaskScheduler();
    let backgroundStarted = false;
    let backgroundCancelled = false;

    const backgroundPromise = scheduler.enqueueBackground({
      id: 'build-running',
      priority: TaskPriority.Background,
      workload: 'build',
      execute: async (token) => {
        backgroundStarted = true;
        token.onCancelled(() => {
          backgroundCancelled = true;
        });
        await new Promise((resolve) => setTimeout(resolve, 40));
        return 'build-result';
      }
    });

    while (!backgroundStarted) {
      await new Promise((resolve) => setImmediate(resolve));
    }

    const interactiveResult = await scheduler.runInteractive({
      id: 'interactive-during-build',
      priority: TaskPriority.Interactive,
      execute: () => 'interactive-result'
    });

    assert.equal(interactiveResult, 'interactive-result');
    assert.equal(await backgroundPromise, 'build-result');
    assert.equal(backgroundCancelled, false);
  });
});

