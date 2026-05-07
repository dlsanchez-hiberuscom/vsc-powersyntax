import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind, ScopeKind } from '../../../src/server/knowledge/types';
import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';

function createSnapshot(
  uri: string,
  fingerprint: number,
  symbols: SemanticDocumentSnapshot['symbols'] = []
): SemanticDocumentSnapshot {
  return {
    uri,
    version: 1,
    fingerprint,
    identity: `${uri}@${fingerprint}`,
    pass: 'enriched',
    readiness: 'nearby-semantic-ready',
    containerModel: { sections: [], typeBlocks: [] },
    symbols,
    scopes: [],
    logicalStatements: [],
    maskedText: { lines: [], masks: [] },
    controlBlocks: []
  };
}

suite('unit/knowledge', () => {
  suite('KnowledgeBase', () => {
    test('upsertDocument indexa símbolos globales', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      const facts = [
        { id: 'f_test', name: 'f_test', kind: EntityKind.Function, uri, line: 10, character: 0 },
        { id: 'u_test', name: 'u_test', kind: EntityKind.Type, uri, line: 20, character: 0 }
      ];

      kb.upsertDocument(uri, facts);
      
      const f = kb.findDefinition('f_test');
      assert.ok(f);
      assert.equal(f?.name, 'f_test');
      assert.equal(f?.kind, EntityKind.Function);
      assert.equal(f?.line, 10);

      const u = kb.findDefinition('U_TEST'); // Case insensitive
      assert.ok(u);
      assert.equal(u?.name, 'u_test');
      assert.equal(kb.semanticEpoch, 1);
    });

    test('upsertDocument limpia conocimiento previo del mismo archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      
      kb.upsertDocument(uri, [{ id: 'old', name: 'old', kind: EntityKind.Function, uri, line: 1, character: 0 }]);
      kb.upsertDocument(uri, [{ id: 'new', name: 'new', kind: EntityKind.Function, uri, line: 5, character: 0 }]);

      assert.equal(kb.findDefinition('old'), null);
      assert.ok(kb.findDefinition('new'));
    });

    test('removeDocument elimina todo el conocimiento de un archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      kb.upsertDocument(uri, [{ id: 'f1', name: 'f1', kind: EntityKind.Function, uri, line: 1, character: 0 }]);
      
      kb.removeDocument(uri);
      assert.equal(kb.findDefinition('f1'), null);
    });

    test('soporta múltiples archivos con el mismo nombre de símbolo (D1)', () => {
      const kb = new KnowledgeBase();
      const uriA = 'file:///w_main.sru';
      const uriB = 'file:///w_detail.sru';

      kb.upsertDocument(uriA, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriA, line: 10, character: 0 }]);
      kb.upsertDocument(uriB, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriB, line: 20, character: 0 }]);

      // Ambas definiciones deben existir
      const all = kb.findAllDefinitions('of_SetData');
      assert.equal(all.length, 2);

      // findDefinition devuelve la primera
      const first = kb.findDefinition('of_SetData');
      assert.ok(first);
    });

    test('prioriza source real frente a orca-staging en buckets globales', () => {
      const kb = new KnowledgeBase();
      const stagedUri = 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru';
      const realUri = 'file:///proj/src/n_shared.sru';

      kb.upsertDocument(stagedUri, [{
        id: 'n_shared',
        name: 'n_shared',
        kind: EntityKind.Type,
        uri: stagedUri,
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'orca-staging',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }]);
      kb.upsertDocument(realUri, [{
        id: 'n_shared',
        name: 'n_shared',
        kind: EntityKind.Type,
        uri: realUri,
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'solution-source',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }]);

      assert.equal(kb.findDefinition('n_shared')?.uri, realUri);
      assert.deepEqual(kb.findAllDefinitions('n_shared').map((entity) => entity.uri), [realUri, stagedUri]);
    });

    test('removeDocument no elimina entidades de otros archivos con el mismo nombre (D1)', () => {
      const kb = new KnowledgeBase();
      const uriA = 'file:///w_main.sru';
      const uriB = 'file:///w_detail.sru';

      kb.upsertDocument(uriA, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriA, line: 10, character: 0 }]);
      kb.upsertDocument(uriB, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriB, line: 20, character: 0 }]);

      // Eliminar archivo A
      kb.removeDocument(uriA);

      // La entidad de archivo B debe sobrevivir
      const all = kb.findAllDefinitions('of_SetData');
      assert.equal(all.length, 1);
      assert.equal(all[0].uri, uriB);
    });

    test('mantiene snapshot publicado por documento', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///with-snapshot.sru';
      const symbols = [{ id: 'f', name: 'f', kind: EntityKind.Function, uri, line: 1, character: 0 }];

      kb.upsertDocument(
        uri,
        symbols,
        [],
        createSnapshot(uri, 77, symbols)
      );

      assert.equal(kb.getDocumentSnapshot(uri)?.fingerprint, 77);
      assert.equal(kb.getEntitiesByUri(uri)[0]?.id, 'f');
      assert.equal(kb.getStats().snapshotDocuments, 1);
    });

    test('indexa entidades por contenedor lógico y limpia el índice al reemplazar un documento', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///w_owner.sru';

      kb.upsertDocument(uri, [
        { id: 'w_owner', name: 'w_owner', kind: EntityKind.Type, uri, line: 0, character: 0 },
        { id: 'of_init', name: 'of_init', kind: EntityKind.Function, containerName: 'w_owner', uri, line: 5, character: 0 },
        { id: 'iv_count', name: 'iv_count', kind: EntityKind.Variable, containerName: 'w_owner', uri, line: 6, character: 0 }
      ]);

      assert.deepEqual(
        kb.getEntitiesByContainer('w_owner').map((entity) => entity.name),
        ['of_init', 'iv_count']
      );

      kb.upsertDocument(uri, [
        { id: 'w_owner', name: 'w_owner', kind: EntityKind.Type, uri, line: 0, character: 0 },
        { id: 'of_run', name: 'of_run', kind: EntityKind.Function, containerName: 'w_owner', uri, line: 9, character: 0 }
      ]);

      assert.deepEqual(
        kb.getEntitiesByContainer('w_owner').map((entity) => entity.name),
        ['of_run']
      );
    });

    test('indexa tipos por baseType y limpia el índice al reemplazar un documento', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///u_child.sru';

      kb.upsertDocument(uri, [
        { id: 'u_child', name: 'u_child', kind: EntityKind.Type, baseTypeName: 'u_base', uri, line: 0, character: 0 }
      ]);

      assert.deepEqual(
        kb.getTypeEntitiesByBaseType('u_base').map((entity) => entity.name),
        ['u_child']
      );

      kb.upsertDocument(uri, [
        { id: 'u_child', name: 'u_child', kind: EntityKind.Type, baseTypeName: 'u_other_base', uri, line: 0, character: 0 }
      ]);

      assert.deepEqual(kb.getTypeEntitiesByBaseType('u_base'), []);
      assert.deepEqual(
        kb.getTypeEntitiesByBaseType('u_other_base').map((entity) => entity.name),
        ['u_child']
      );
    });

    test('getStats desglosa snapshots por pass y readiness', () => {
      const kb = new KnowledgeBase();

      kb.upsertDocument(
        'file:///structural.sru',
        [],
        [],
        {
          ...createSnapshot('file:///structural.sru', 1),
          pass: 'structural',
          readiness: 'structural-only'
        }
      );
      kb.upsertDocument(
        'file:///enriched.sru',
        [],
        [],
        {
          ...createSnapshot('file:///enriched.sru', 2),
          pass: 'enriched',
          readiness: 'nearby-semantic-ready'
        }
      );

      const stats = kb.getStats();
      assert.equal(stats.snapshotDocuments, 2);
      assert.equal(stats.structuralSnapshots, 1);
      assert.equal(stats.enrichedSnapshots, 1);
      assert.equal(stats.structuralOnlySnapshots, 1);
      assert.equal(stats.nearbySemanticReadySnapshots, 1);
      assert.ok(stats.internedStrings > 0);
    });

    test('libera strings internados al eliminar un documento', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///compact.sru';

      kb.upsertDocument(uri, [
        {
          id: 'w_compact.of_init',
          name: 'of_init',
          kind: EntityKind.Function,
          uri,
          line: 1,
          character: 0,
          containerName: 'w_compact',
          ownerName: 'w_compact',
          datatype: 'string'
        },
        {
          id: 'w_compact.of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri,
          line: 5,
          character: 0,
          containerName: 'w_compact',
          ownerName: 'w_compact',
          datatype: 'string'
        }
      ]);

      assert.ok(kb.getStats().internedStrings > 0);

      kb.removeDocument(uri);
      assert.equal(kb.getStats().internedStrings, 0);
    });

    test('getEntitiesByUri prioriza symbols del snapshot publicado', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///snapshot-entities.sru';
      const facts = [{ id: 'stale', name: 'stale', kind: EntityKind.Function, uri, line: 1, character: 0 }];
      const snapshotSymbols = [{ id: 'fresh', name: 'fresh', kind: EntityKind.Function, uri, line: 5, character: 0 }];

      kb.upsertDocument(uri, facts, [], createSnapshot(uri, 91, snapshotSymbols));

      assert.deepEqual(kb.getEntitiesByUri(uri).map((entity) => entity.id), ['fresh']);
      assert.equal(kb.findDefinition('stale')?.id, 'stale');
    });

    test('queryEntities limita resultados y no expone referencias vivas', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///query.sru';

      kb.upsertDocument(uri, [
        { id: 'of_one', name: 'of_one', kind: EntityKind.Function, uri, line: 1, character: 0 },
        { id: 'of_two', name: 'of_two', kind: EntityKind.Function, uri, line: 2, character: 0 },
        { id: 'w_query', name: 'w_query', kind: EntityKind.Type, uri, line: 3, character: 0 }
      ]);

      const limited = kb.queryEntities({ query: 'of_', kinds: [EntityKind.Function], limit: 1 });
      assert.equal(limited.length, 1);
      limited[0].name = 'mutated';

      assert.equal(kb.findDefinition('of_one')?.name, 'of_one');
      assert.equal(kb.countEntities((entity) => entity.kind === EntityKind.Function), 2);
    });

    test('queryEntities y countEntities aceptan filtros por kind sin cambiar el contrato visible', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///kinds.sru';

      kb.upsertDocument(uri, [
        { id: 'w_kind', name: 'w_kind', kind: EntityKind.Type, uri, line: 1, character: 0 },
        { id: 'of_kind', name: 'of_kind', kind: EntityKind.Function, uri, line: 2, character: 0 },
        { id: 'ue_kind', name: 'ue_kind', kind: EntityKind.Event, uri, line: 3, character: 0 }
      ]);

      const onlyTypes = kb.queryEntities({ kinds: [EntityKind.Type] });
      assert.deepEqual(onlyTypes.map((entity) => entity.id), ['w_kind']);
      onlyTypes[0].name = 'mutated';

      assert.equal(kb.findDefinition('w_kind')?.name, 'w_kind');
      assert.equal(kb.countEntities({ kinds: [EntityKind.Type] }), 1);
      assert.equal(kb.countEntities({ kinds: [EntityKind.Type, EntityKind.Function] }), 2);
    });

    test('getScopeAt prioriza scopes del snapshot publicado', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///snapshot-scopes.sru';
      const staleScope = {
        id: 'stale_scope',
        kind: ScopeKind.Function,
        uri,
        startLine: 0,
        endLine: 3,
        children: [],
        symbols: []
      };
      const snapshotScope = {
        id: 'fresh_scope',
        kind: ScopeKind.Function,
        uri,
        startLine: 10,
        endLine: 20,
        children: [],
        symbols: []
      };

      kb.upsertDocument(
        uri,
        [{ id: 'f', name: 'f', kind: EntityKind.Function, uri, line: 10, character: 0 }],
        [staleScope],
        {
          ...createSnapshot(uri, 92),
          scopes: [snapshotScope]
        }
      );

      assert.equal(kb.getScopeAt(uri, 1), null);
      assert.equal(kb.getScopeAt(uri, 15)?.id, 'fresh_scope');
    });

    test('batch update publica atómicamente al final', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///atomic.sru';
      const scope = {
        id: 'atomic_scope',
        kind: ScopeKind.Function,
        uri,
        startLine: 1,
        endLine: 4,
        children: [],
        symbols: []
      };
      const symbols = [{ id: 'f_batch', name: 'f_batch', kind: EntityKind.Function, uri, line: 1, character: 0 }];
      const snapshot = {
        ...createSnapshot(uri, 101, symbols),
        scopes: [scope]
      };

      kb.beginBatchUpdate();
      kb.upsertDocument(uri, symbols, [scope], snapshot);

      assert.equal(kb.findDefinition('f_batch'), null);
      assert.deepEqual(kb.getEntitiesByUri(uri), []);
      assert.equal(kb.getScopeAt(uri, 2), null);
      assert.equal(kb.getDocumentSnapshot(uri), null);

      kb.commitBatchUpdate();

      assert.ok(kb.findDefinition('f_batch'));
      assert.deepEqual(kb.getEntitiesByUri(uri).map((entity) => entity.id), ['f_batch']);
      assert.equal(kb.getScopeAt(uri, 2)?.id, 'atomic_scope');
      assert.equal(kb.getDocumentSnapshot(uri)?.fingerprint, 101);
      assert.equal(kb.semanticEpoch, 1);
    });

    test('rollback descarta cambios staged', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///rollback.sru';

      kb.beginBatchUpdate();
      kb.upsertDocument(uri, [{ id: 'f_rollback', name: 'f_rollback', kind: EntityKind.Function, uri, line: 1, character: 0 }]);
      kb.rollbackBatchUpdate();

      assert.equal(kb.findDefinition('f_rollback'), null);
      assert.equal(kb.semanticEpoch, 0);
    });

    test('mantiene índice de dependencias inversas por símbolos exportados', () => {
      const kb = new KnowledgeBase();
      const baseUri = 'file:///parent.sru';
      const childUri = 'file:///child.sru';
      const baseSymbols = [{ id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: baseUri, line: 1, character: 0 }];
      const childSymbols = [{ id: 'n_child', name: 'n_child', kind: EntityKind.Type, uri: childUri, line: 1, character: 0, baseTypeName: 'n_parent' }];

      kb.upsertDocument(baseUri, baseSymbols, [], createSnapshot(baseUri, 99, baseSymbols));
      kb.upsertDocument(childUri, childSymbols, [], createSnapshot(childUri, 100, childSymbols));

      assert.deepEqual(kb.getDependentDocumentsForUri(baseUri), [childUri]);
      assert.equal(kb.getStats().reverseDependencyKeys, 1);
    });

    test('exporta registros documentales de la KB', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///export.sru';
      kb.upsertDocument(uri, [{ id: 'f_export', name: 'f_export', kind: EntityKind.Function, uri, line: 1, character: 0 }]);

      const records = kb.exportDocumentRecords();
      assert.equal(records.length, 1);
      assert.equal(records[0].uri, uri);
      assert.equal(records[0].facts[0].id, 'f_export');
    });

    test('lecturas públicas y entradas publicadas no exponen referencias vivas', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///defensive.sru';
      const inputFacts = [{ id: 'f_defensive', name: 'f_defensive', kind: EntityKind.Function, uri, line: 1, character: 0 }];
      const inputScopes = [{
        id: 'defensive_scope',
        kind: ScopeKind.Function,
        uri,
        startLine: 1,
        endLine: 5,
        children: [],
        symbols: []
      }];
      const inputSnapshot = {
        ...createSnapshot(uri, 777, inputFacts),
        scopes: inputScopes
      };

      kb.upsertDocument(uri, inputFacts, inputScopes, inputSnapshot);
      inputFacts[0].name = 'mutated-outside';
      inputScopes[0].id = 'mutated-outside';
      inputSnapshot.symbols[0].name = 'mutated-outside';

      const definition = kb.findDefinition('f_defensive');
      const allDefinitions = kb.findAllDefinitions('f_defensive');
      const entitiesByUri = kb.getEntitiesByUri(uri);
      const scope = kb.getScopeAt(uri, 2);
      const snapshot = kb.getDocumentSnapshot(uri);

      definition!.name = 'mutated-read';
      allDefinitions[0].name = 'mutated-read';
      entitiesByUri[0].name = 'mutated-read';
      scope!.id = 'mutated-read';
      snapshot!.symbols[0].name = 'mutated-read';

      assert.equal(kb.findDefinition('f_defensive')?.name, 'f_defensive');
      assert.equal(kb.findAllDefinitions('f_defensive')[0].name, 'f_defensive');
      assert.equal(kb.getEntitiesByUri(uri)[0].name, 'f_defensive');
      assert.equal(kb.getScopeAt(uri, 2)?.id, 'defensive_scope');
      assert.equal(kb.getDocumentSnapshot(uri)?.symbols[0].name, 'f_defensive');
    });
    test('lecturas públicas readonly devuelven referencia congelada', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///readonly.sru';
      const inputFacts = [{ id: 'f_readonly', name: 'f_readonly', kind: EntityKind.Function, uri, line: 1, character: 0 }];
      const inputSnapshot = createSnapshot(uri, 999, inputFacts);

      kb.upsertDocument(uri, inputFacts, [], inputSnapshot);

      const readonlyDefinition = kb.findDefinitionReadonly('f_readonly');
      const readonlyEntities = kb.getEntitiesByUriReadonly(uri);
      const readonlySnapshot = kb.getDocumentSnapshotReadonly(uri);

      assert.ok(readonlyDefinition);
      assert.equal(readonlyEntities.length, 1);
      assert.ok(readonlySnapshot);

      // En development, freezeValue llama a Object.freeze
      if (process.env.NODE_ENV === 'development') {
        assert.throws(() => {
          (readonlyDefinition as any).name = 'mutated';
        }, /Cannot assign to read only property/);
        
        assert.throws(() => {
          (readonlySnapshot as any).version = 99;
        }, /Cannot assign to read only property/);
      }
    });
  });
});
