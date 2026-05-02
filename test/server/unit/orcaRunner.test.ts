import * as assert from 'assert/strict';
import { EventEmitter } from 'events';

import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';
import {
  OrcaRunner,
  buildOrcaArgs,
  type OrcaProcessLike,
  type OrcaSpawnProcess,
} from '../../../src/server/build/orcaRunner';

suite('unit/orcaRunner (B188)', () => {
  test('construye args mínimos para ejecutar un script ORCA', () => {
    assert.deepEqual(buildOrcaArgs('C:/workspace/run.orca'), ['C:/workspace/run.orca']);
  });

  test('ejecuta ORCA y captura stdout/stderr con journal', async () => {
    const fakeProcess = new FakeProcess();
    const journal = new RuntimeJournal();
    const spawnCalls: Array<{ executablePath: string; args: string[]; cwd?: string | URL }> = [];
    const runner = new OrcaRunner({
      journal,
      spawnProcess: createSpawn((executablePath, args, options) => {
        spawnCalls.push({ executablePath, args, cwd: options.cwd });
        return fakeProcess;
      }),
      now: createNow([100, 135]),
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Tools/orca.exe',
      scriptUri: 'file:///c:/workspace/run.orca',
      timeoutMs: 2000,
    });

    fakeProcess.stdout.emitData('orca ok\n');
    fakeProcess.stderr.emitData('warning\n');
    fakeProcess.emitClose(0, null);

    const result = await resultPromise;
    assert.equal(spawnCalls.length, 1);
    assert.equal(String(spawnCalls[0]?.cwd).toLowerCase(), 'c:\\workspace');
    assert.deepEqual(spawnCalls[0]?.args.map((value) => value.toLowerCase()), ['c:\\workspace\\run.orca']);
    assert.equal(result.snapshot.state, 'succeeded');
    assert.equal(result.snapshot.durationMs, 35);
    assert.match(result.output, /\[stdout\]/);
    assert.match(result.output, /warning/);

    const events = journal.snapshot().events;
    assert.equal(events.length, 2);
    assert.equal(events[0]?.action, 'started');
    assert.equal(events[1]?.action, 'succeeded');
  });

  test('permite cancelar una ejecución en curso', async () => {
    const fakeProcess = new FakeProcess();
    const runner = new OrcaRunner({
      spawnProcess: createSpawn(() => fakeProcess),
      now: createNow([200, 255]),
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Tools/orca.exe',
      scriptUri: 'file:///c:/workspace/run.orca',
    });

    const snapshot = runner.cancel();
    assert.equal(snapshot?.state, 'running');
    assert.equal(fakeProcess.killCalls, 1);

    fakeProcess.emitClose(null, 'SIGTERM');
    const result = await resultPromise;
    assert.equal(result.snapshot.state, 'cancelled');
  });

  test('marca timeout cuando el proceso excede el presupuesto', async () => {
    const fakeProcess = new FakeProcess();
    let timeoutCallback: (() => void) | undefined;
    const runner = new OrcaRunner({
      spawnProcess: createSpawn(() => fakeProcess),
      now: createNow([300, 360]),
      setTimer: (callback) => {
        timeoutCallback = callback;
        return setTimeout(() => undefined, 0);
      },
      clearTimer: (handle) => clearTimeout(handle),
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Tools/orca.exe',
      scriptUri: 'file:///c:/workspace/run.orca',
      timeoutMs: 50,
    });

    timeoutCallback?.();
    assert.equal(fakeProcess.killCalls, 1);
    fakeProcess.emitClose(null, 'SIGTERM');

    const result = await resultPromise;
    assert.equal(result.snapshot.state, 'timed-out');
    assert.match(result.snapshot.detail ?? '', /timeout/i);
  });
});

function createSpawn(factory: OrcaSpawnProcess): OrcaSpawnProcess {
  return factory;
}

function createNow(values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)] ?? values[values.length - 1] ?? 0;
}

class FakeReadable extends EventEmitter {
  emitData(text: string): void {
    this.emit('data', Buffer.from(text, 'utf8'));
  }
}

class FakeProcess extends EventEmitter implements OrcaProcessLike {
  readonly stdout = new FakeReadable();
  readonly stderr = new FakeReadable();
  killCalls = 0;

  kill(): boolean {
    this.killCalls++;
    return true;
  }

  emitClose(code: number | null, signal: NodeJS.Signals | null): void {
    this.emit('close', code, signal);
  }
}