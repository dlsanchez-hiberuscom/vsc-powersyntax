import * as assert from 'assert/strict';
import { EventEmitter } from 'events';

import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';
import {
  PbAutoBuildRunner,
  buildPbAutoBuildArgs,
  selectPbAutoBuildBuildFile,
  type PbAutoBuildProcessLike,
  type PbAutoBuildSpawnProcess
} from '../../../src/server/build/pbAutoBuildRunner';
import type { PbAutoBuildBuildFileInfo } from '../../../src/server/workspace/pbAutoBuildBuildFiles';

suite('unit/pbAutoBuildRunner (B183)', () => {
  test('selecciona el build file solicitado si es usable', () => {
    const selected = selectPbAutoBuildBuildFile([
      buildFile('file:///c:/workspace/app.json', 'usable', 'file:///c:/workspace/app.pbproj')
    ], null, 'file:///c:/workspace/app.json');

    assert.equal(selected.buildFile?.uri, 'file:///c:/workspace/app.json');
    assert.equal(selected.reasonCode, undefined);
  });

  test('prioriza el build file del proyecto activo cuando hay varios usables', () => {
    const selected = selectPbAutoBuildBuildFile([
      buildFile('file:///c:/workspace/a.json', 'usable', 'file:///c:/workspace/a.pbproj'),
      buildFile('file:///c:/workspace/b.json', 'usable', 'file:///c:/workspace/b.pbproj')
    ], 'file:///c:/workspace/b.pbproj');

    assert.equal(selected.buildFile?.uri, 'file:///c:/workspace/b.json');
  });

  test('marca selección ambigua cuando hay varios build files usables sin match único', () => {
    const selected = selectPbAutoBuildBuildFile([
      buildFile('file:///c:/workspace/a.json', 'usable', 'file:///c:/workspace/a.pbproj'),
      buildFile('file:///c:/workspace/b.json', 'usable', 'file:///c:/workspace/b.pbproj')
    ], null);

    assert.equal(selected.buildFile, undefined);
    assert.equal(selected.reasonCode, 'ambiguous-usable-build-file');
  });

  test('construye args mínimos para ejecutar un build file JSON', () => {
    assert.deepEqual(buildPbAutoBuildArgs('C:/workspace/app.json'), ['/f', 'C:/workspace/app.json']);
  });

  test('ejecuta PBAutoBuild y captura stdout/stderr con journal', async () => {
    const fakeProcess = new FakeProcess();
    const journal = new RuntimeJournal();
    const spawnCalls: Array<{ executablePath: string; args: string[]; cwd?: string | URL }> = [];
    const runner = new PbAutoBuildRunner({
      journal,
      spawnProcess: createSpawn((executablePath, args, options) => {
        spawnCalls.push({ executablePath, args, cwd: options.cwd });
        return fakeProcess;
      }),
      now: createNow([100, 135])
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      buildFile: buildFile('file:///c:/workspace/app.json', 'usable', 'file:///c:/workspace/app.pbproj'),
      timeoutMs: 2000
    });

    fakeProcess.stdout.emitData('build ok\n');
    fakeProcess.stderr.emitData('warning\n');
    fakeProcess.emitClose(0, null);

    const result = await resultPromise;
    assert.equal(spawnCalls.length, 1);
    assert.equal(String(spawnCalls[0]?.cwd).toLowerCase(), 'c:\\workspace');
    assert.deepEqual(spawnCalls[0]?.args.map((value) => value.toLowerCase()), ['/f', 'c:\\workspace\\app.json']);
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
    const runner = new PbAutoBuildRunner({
      spawnProcess: createSpawn(() => fakeProcess),
      now: createNow([200, 255])
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      buildFile: buildFile('file:///c:/workspace/app.json', 'usable', 'file:///c:/workspace/app.pbproj')
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
    const runner = new PbAutoBuildRunner({
      spawnProcess: createSpawn(() => fakeProcess),
      now: createNow([300, 360]),
      setTimer: (callback) => {
        timeoutCallback = callback;
        return setTimeout(() => undefined, 0);
      },
      clearTimer: (handle) => clearTimeout(handle)
    });

    const resultPromise = runner.run({
      executablePath: 'C:/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      buildFile: buildFile('file:///c:/workspace/app.json', 'usable', 'file:///c:/workspace/app.pbproj'),
      timeoutMs: 50
    });

    timeoutCallback?.();
    assert.equal(fakeProcess.killCalls, 1);
    fakeProcess.emitClose(null, 'SIGTERM');

    const result = await resultPromise;
    assert.equal(result.snapshot.state, 'timed-out');
    assert.match(result.snapshot.detail ?? '', /timeout/i);
  });
});

function buildFile(
  uri: string,
  status: PbAutoBuildBuildFileInfo['status'],
  representedProjectUri?: string
): PbAutoBuildBuildFileInfo {
  return {
    uri,
    hasBuildPlan: true,
    referencedProjectUris: representedProjectUri ? [representedProjectUri] : [],
    status,
    ...(representedProjectUri ? { representedProjectUri } : {})
  };
}

function createSpawn(factory: PbAutoBuildSpawnProcess): PbAutoBuildSpawnProcess {
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

class FakeProcess extends EventEmitter implements PbAutoBuildProcessLike {
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