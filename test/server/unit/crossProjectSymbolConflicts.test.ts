import * as assert from 'assert/strict';

import { buildCrossProjectSymbolConflicts } from '../../../src/server/features/crossProjectSymbolConflicts';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { buildSymbolKey } from '../../../src/server/knowledge/symbolKey';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/crossProjectSymbolConflicts (B255)', () => {
  let kb: KnowledgeBase;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    workspaceState = new WorkspaceState();

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj_a/app_a.pbt',
        name: 'app_a',
        libraries: ['file:///proj_a/lib_app.pbl'],
      },
    });
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj_b/app_b.pbt',
        name: 'app_b',
        libraries: ['file:///proj_b/lib_app.pbl'],
      },
    });
    workspaceState.registerLibrarySourceAlias(
      'file:///proj_a/lib_app.pbl',
      'file:///proj_a/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source'
    );

    addEntityDocument('file:///proj_a/lib_app.pbl/n_shared.sru', 'solution-source', [
      { id: 'n_shared', name: 'n_shared', kind: EntityKind.Type, uri: 'file:///proj_a/lib_app.pbl/n_shared.sru', line: 0, character: 0 },
    ]);
    addEntityDocument('file:///proj_a/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru', 'orca-staging', [
      { id: 'n_shared', name: 'n_shared', kind: EntityKind.Type, uri: 'file:///proj_a/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru', line: 0, character: 0 },
    ]);
    addEntityDocument('file:///proj_b/lib_app.pbl/n_shared.sru', 'solution-source', [
      { id: 'n_shared', name: 'n_shared', kind: EntityKind.Type, uri: 'file:///proj_b/lib_app.pbl/n_shared.sru', line: 0, character: 0 },
    ]);

    addEntityDocument('file:///proj_a/lib_app.pbl/gf_conflict.srf', 'solution-source', [
      { id: 'gf_conflict', name: 'gf_conflict', kind: EntityKind.Function, uri: 'file:///proj_a/lib_app.pbl/gf_conflict.srf', line: 3, character: 0, parameterCount: 0 },
    ]);
    addEntityDocument('file:///proj_b/lib_app.pbl/gf_conflict.srf', 'solution-source', [
      { id: 'gf_conflict', name: 'gf_conflict', kind: EntityKind.Function, uri: 'file:///proj_b/lib_app.pbl/gf_conflict.srf', line: 4, character: 0, parameterCount: 0 },
    ]);

    addEntityDocument('file:///proj_a/lib_app.pbl/n_unique.sru', 'solution-source', [
      { id: 'n_unique', name: 'n_unique', kind: EntityKind.Type, uri: 'file:///proj_a/lib_app.pbl/n_unique.sru', line: 0, character: 0 },
    ]);

    workspaceState.refreshProjectRouting();
  });

  function addEntityDocument(uri: string, sourceOrigin: SourceOrigin, entities: Entity[]): void {
    kb.upsertDocument(uri, entities.map((entity) => ({
      ...entity,
      lineage: {
        sourceKind: 'document',
        sourceOrigin,
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    })));
    workspaceState.addSourceFile(uri, sourceOrigin);
  }

  test('agrupa conflictos por family key y colapsa staging dentro de la misma ubicación', () => {
    const conflicts = buildCrossProjectSymbolConflicts(
      {
        maxConflicts: 8,
        maxCandidatesPerConflict: 4,
      },
      kb,
      workspaceState,
    );

    assert.equal(conflicts.available, true);
    assert.equal(conflicts.summary.totalConflictCount, 2);
    assert.equal(conflicts.summary.returnedConflictCount, 2);
    assert.equal(conflicts.summary.totalCandidateCount, 4);
    assert.equal(conflicts.summary.crossProjectConflictCount, 2);
    assert.equal(conflicts.summary.crossLibraryConflictCount, 0);
    assert.equal(conflicts.summary.truncated, false);

    const sharedTypeConflict = conflicts.conflicts.find((conflict) => conflict.symbolName === 'n_shared' && conflict.kind === 'Type');
    assert.ok(sharedTypeConflict);
    assert.equal(sharedTypeConflict?.scope, 'cross-project');
    assert.equal(sharedTypeConflict?.candidateCount, 2);
    assert.equal(sharedTypeConflict?.projectCount, 2);
    assert.equal(sharedTypeConflict?.libraryCount, 2);
    assert.deepEqual(sharedTypeConflict?.sourceOrigins, ['solution-source']);
    assert.ok(sharedTypeConflict?.evidence.includes('multiple-projects'));
    assert.ok(sharedTypeConflict?.evidence.includes('collapsed-same-location'));
    assert.ok(sharedTypeConflict?.candidates.every((candidate) => candidate.sourceOrigin === 'solution-source'));
    assert.ok(!sharedTypeConflict?.candidates.some((candidate) => candidate.uri.includes('orca-staging')));
    assert.deepEqual(
      sharedTypeConflict?.candidates.map((candidate) => candidate.identityKey),
      ['file:///proj_a/lib_app.pbl/n_shared.sru', 'file:///proj_b/lib_app.pbl/n_shared.sru']
        .map((uri) => kb.getEntitiesByUri(uri)[0])
        .filter((entity): entity is Entity => Boolean(entity))
        .map((entity) => buildSymbolKey(entity))
    );
    assert.deepEqual(
      sharedTypeConflict?.candidates.map((candidate) => candidate.projectUri),
      ['file:///proj_a/app_a.pbt', 'file:///proj_b/app_b.pbt']
    );
  });

  test('permite filtrar por nombre y limitar los candidatos devueltos por conflicto', () => {
    const conflicts = buildCrossProjectSymbolConflicts(
      {
        symbolName: 'gf_conflict',
        maxConflicts: 1,
        maxCandidatesPerConflict: 1,
      },
      kb,
      workspaceState,
    );

    assert.equal(conflicts.available, true);
    assert.equal(conflicts.summary.totalConflictCount, 1);
    assert.equal(conflicts.summary.returnedConflictCount, 1);
    assert.equal(conflicts.summary.totalCandidateCount, 2);
    assert.equal(conflicts.summary.truncated, false);
    assert.equal(conflicts.conflicts[0]?.symbolName, 'gf_conflict');
    assert.equal(conflicts.conflicts[0]?.candidateCount, 2);
    assert.equal(conflicts.conflicts[0]?.truncatedCandidates, true);
    assert.equal(conflicts.conflicts[0]?.candidates.length, 1);
  });
});
