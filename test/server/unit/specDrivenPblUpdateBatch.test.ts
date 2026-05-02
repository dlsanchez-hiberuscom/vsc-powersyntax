import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  applySpecDrivenPblUpdateBatch,
} from '../../../src/server/build/specDrivenPblUpdate';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import type { IFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/specDrivenPblUpdateBatch (B200)', () => {
  test('agrega múltiples updates PBL exitosos', async () => {
    const executed: string[] = [];
    const result = await applySpecDrivenPblUpdateBatch({
      requests: [
        {
          label: 'uno',
          uri: 'file:///c:/workspace/source/uno.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/uno.srw', content: 'uno' }],
        },
        {
          label: 'dos',
          uri: 'file:///c:/workspace/source/dos.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/dos.srw', content: 'dos' }],
        },
      ],
    }, buildBatchOptions(async (_document, request) => {
      executed.push(request.uri ?? '');
      return {
        available: true,
        blocked: false,
        blockedReasons: [],
        safeEditPlan: buildPlan(request.uri ?? ''),
        appliedEdits: [],
      };
    }));

    assert.equal(result.blocked, false);
    assert.equal(result.stoppedEarly, false);
    assert.equal(result.total, 2);
    assert.equal(result.succeeded, 2);
    assert.equal(result.blockedCount, 0);
    assert.deepEqual(executed, [
      'file:///c:/workspace/source/uno.srw',
      'file:///c:/workspace/source/dos.srw',
    ]);
    assert.equal(result.items[0]?.label, 'uno');
    assert.equal(result.items[1]?.label, 'dos');
  });

  test('corta el batch al primer bloqueo cuando stopOnError es true', async () => {
    let executions = 0;
    const result = await applySpecDrivenPblUpdateBatch({
      requests: [
        {
          uri: 'file:///c:/workspace/source/uno.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/uno.srw', content: 'uno' }],
        },
        {
          uri: 'file:///c:/workspace/source/dos.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/dos.srw', content: 'dos' }],
        },
      ],
      stopOnError: true,
    }, buildBatchOptions(async (_document, request) => {
      executions++;
      return {
        available: true,
        blocked: request.uri?.includes('uno') ?? false,
        reason: 'Bloqueado a propósito',
        blockedReasons: ['Bloqueado a propósito'],
        safeEditPlan: buildPlan(request.uri ?? ''),
        appliedEdits: [],
      };
    }));

    assert.equal(result.blocked, true);
    assert.equal(result.stoppedEarly, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.blockedCount, 1);
    assert.equal(executions, 1);
  });

  test('continúa el batch cuando stopOnError es false', async () => {
    let executions = 0;
    const result = await applySpecDrivenPblUpdateBatch({
      requests: [
        {
          uri: 'file:///c:/workspace/source/uno.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/uno.srw', content: 'uno' }],
        },
        {
          uri: 'file:///c:/workspace/source/dos.srw',
          executablePath: 'C:/Tools/pborca.exe',
          sessionLibrary: 'pborc250.dll',
          edits: [{ uri: 'file:///c:/workspace/source/dos.srw', content: 'dos' }],
        },
      ],
      stopOnError: false,
    }, buildBatchOptions(async (_document, request) => {
      executions++;
      return {
        available: true,
        blocked: request.uri?.includes('uno') ?? false,
        reason: request.uri?.includes('uno') ? 'Bloqueado a propósito' : undefined,
        blockedReasons: request.uri?.includes('uno') ? ['Bloqueado a propósito'] : [],
        safeEditPlan: buildPlan(request.uri ?? ''),
        appliedEdits: [],
      };
    }));

    assert.equal(result.blocked, true);
    assert.equal(result.stoppedEarly, false);
    assert.equal(result.items.length, 2);
    assert.equal(result.succeeded, 1);
    assert.equal(result.blockedCount, 1);
    assert.equal(executions, 2);
  });
});

function buildBatchOptions(
  executeSingle: NonNullable<Parameters<typeof applySpecDrivenPblUpdateBatch>[1]['executeSingle']>,
): Parameters<typeof applySpecDrivenPblUpdateBatch>[1] {
  return {
    workspaceFolders: ['file:///c:/workspace'],
    workspaceState: new WorkspaceState(),
    fs: {} as IFileSystem,
    kb: new KnowledgeBase(),
    graph: new InheritanceGraph(new KnowledgeBase()),
    systemCatalog: new SystemCatalog(),
    runOrca: async () => ({
      snapshot: { state: 'succeeded' },
      output: '',
    }),
    loadSource: async () => null,
    loadDocument: async (uri) => TextDocument.create(uri, 'powerbuilder', 1, 'forward\r\nend forward'),
    executeSingle,
    journalUri: 'file:///c:/workspace/.vsc-powersyntax/runtime/build-orca-journal.json',
  };
}

function buildPlan(uri: string) {
  return {
    available: true,
    blocked: false,
    objects: [],
    files: [{ uri, reason: 'Objeto foco', risk: 'medium' as const }],
    risks: [],
    recommendedTests: [],
    docsToReview: [],
    blockedReasons: [],
  };
}
