import * as assert from 'assert/strict';

import type { PbAutoBuildRunnerRequest } from '../../../src/server/build/pbAutoBuildRunner';
import type { OrcaRunnerRequest } from '../../../src/server/build/orcaRunner';
import { createManagedBuildWorkloads } from '../../../src/server/runtime/managedBuildWorkloads';
import { createManagedRuntimeWorkloads } from '../../../src/server/runtime/managedRuntimeWorkloads';
import { TaskScheduler } from '../../../src/server/runtime/scheduler';
import type { PbAutoBuildRunResult } from '../../../src/shared/pbAutoBuildProtocol';
import type { OrcaRunResult } from '../../../src/shared/orcaProtocol';

function waitFor(condition: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const tick = (): void => {
      if (condition()) {
        resolve();
        return;
      }
      setImmediate(tick);
    };
    tick();
  });
}

suite('unit/managedBuildWorkloads (B354)', () => {
  test('runPbAutoBuildWithBackpressure cancela el runner cuando el background se cancela manualmente', async () => {
    const scheduler = new TaskScheduler();
    const runtimeWorkloads = createManagedRuntimeWorkloads(scheduler);
    const state = { started: false, cancelled: false };

    const pbAutoBuildRunner = {
      async run(_request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult> {
        state.started = true;
        while (!state.cancelled) {
          await new Promise((resolve) => setImmediate(resolve));
        }
        throw new Error('pbautobuild-cancelled');
      },
      cancel(): void {
        state.cancelled = true;
      },
    };

    const managedBuildWorkloads = createManagedBuildWorkloads({
      runBackgroundWorkload: runtimeWorkloads.runBackgroundWorkload,
      pbAutoBuildRunner,
      orcaRunner: {
        async run(_request: OrcaRunnerRequest): Promise<OrcaRunResult> {
          return { snapshot: { state: 'idle' }, output: '' };
        },
        cancel(): void {},
      },
    });

    const request: PbAutoBuildRunnerRequest = {
      executablePath: 'C:/tools/pbautobuild250.exe',
      buildFile: {
        uri: 'file:///workspace/build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///workspace/app.pbt'],
        status: 'usable',
      },
    };

    const promise = managedBuildWorkloads.runPbAutoBuildWithBackpressure(request);
    await waitFor(() => state.started);

    scheduler.cancelAllBackground();

    await assert.rejects(promise, /pbautobuild-cancelled/);
    assert.equal(state.cancelled, true);
  });

  test('runOrcaWithBackpressure cancela el runner cuando el background se cancela manualmente', async () => {
    const scheduler = new TaskScheduler();
    const runtimeWorkloads = createManagedRuntimeWorkloads(scheduler);
    const state = { started: false, cancelled: false };

    const managedBuildWorkloads = createManagedBuildWorkloads({
      runBackgroundWorkload: runtimeWorkloads.runBackgroundWorkload,
      pbAutoBuildRunner: {
        async run(_request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult> {
          return { snapshot: { state: 'idle' }, output: '' };
        },
        cancel(): void {},
      },
      orcaRunner: {
        async run(_request: OrcaRunnerRequest): Promise<OrcaRunResult> {
          state.started = true;
          while (!state.cancelled) {
            await new Promise((resolve) => setImmediate(resolve));
          }
          throw new Error('orca-cancelled');
        },
        cancel(): void {
          state.cancelled = true;
        },
      },
    });

    const promise = managedBuildWorkloads.runOrcaWithBackpressure({
      executablePath: 'C:/tools/orcascr250.exe',
      scriptUri: 'file:///workspace/build.orca',
    });
    await waitFor(() => state.started);

    scheduler.cancelAllBackground();

    await assert.rejects(promise, /orca-cancelled/);
    assert.equal(state.cancelled, true);
  });
});