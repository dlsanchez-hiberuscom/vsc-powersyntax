import * as assert from 'assert/strict';

import {
  applyJournalToCheckpoint,
  createCacheCheckpoint,
  resolveCheckpointRestore
} from '../../../src/server/cache/cacheCheckpoint';
import { createCacheJournal } from '../../../src/server/cache/cacheJournal';
import { CACHE_SCHEMA_VERSION } from '../../../src/server/cache/cacheSchema';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/cachePersistence', () => {
  test('journal trunca al máximo configurado', () => {
    const journal = createCacheJournal(2);
    journal.append({ semanticEpoch: 1, kind: 'clear', uris: [] });
    journal.append({ semanticEpoch: 2, kind: 'remove', uris: ['file:///a.sru'] });
    journal.append({ semanticEpoch: 3, kind: 'remove', uris: ['file:///b.sru'] });

    const entries = journal.list();
    assert.equal(entries.length, 2);
    assert.equal(entries[0].semanticEpoch, 2);
  });

  test('checkpoint aplica journal de upsert y remove', () => {
    const checkpoint = createCacheCheckpoint(3, [
      {
        uri: 'file:///a.sru',
        facts: [{ id: 'a', name: 'a', kind: EntityKind.Function, uri: 'file:///a.sru', line: 1, character: 0 }],
        scopes: []
      }
    ], {
      workspaceMode: 'workspace',
      rootUris: ['file:///workspace']
    });

    const restored = applyJournalToCheckpoint(checkpoint, [
      {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sequence: 1,
        semanticEpoch: 4,
        kind: 'upsert',
        uris: ['file:///b.sru'],
        documents: [{
          uri: 'file:///b.sru',
          facts: [{ id: 'b', name: 'b', kind: EntityKind.Function, uri: 'file:///b.sru', line: 1, character: 0 }],
          scopes: []
        }]
      },
      {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sequence: 2,
        semanticEpoch: 5,
        kind: 'remove',
        uris: ['file:///a.sru']
      }
    ]);

    assert.equal(restored.semanticEpoch, 5);
    assert.equal(restored.documents.length, 1);
    assert.equal(restored.documents[0].uri, 'file:///b.sru');
    assert.deepEqual(restored.metadata.rootUris, ['file:///workspace']);
  });

  test('checkpoint con schema desconocido fuerza rebuild seguro', () => {
    const restored = resolveCheckpointRestore(
      {
        schemaVersion: CACHE_SCHEMA_VERSION + 1,
        semanticEpoch: 12,
        createdAt: 1,
        metadata: { workspaceMode: 'workspace', rootUris: ['file:///workspace'] },
        documents: [{ uri: 'file:///stale.sru', facts: [], scopes: [] }]
      },
      [],
      { workspaceMode: 'workspace', rootUris: ['file:///workspace'] }
    );

    assert.equal(restored.decision.action, 'rebuild');
    assert.equal(restored.decision.reason, 'unsupported-schema-version');
    assert.equal(restored.checkpoint.documents.length, 0);
  });

  test('payload compatible sin schemaVersion explicito migra al schema actual y se reutiliza', () => {
    const restored = resolveCheckpointRestore(
      {
        semanticEpoch: 12,
        createdAt: 1,
        metadata: { workspaceMode: 'workspace', rootUris: ['file:///workspace'] },
        documents: [{ uri: 'file:///stale.sru', facts: [], scopes: [] }]
      },
      [
        {
          sequence: 1,
          semanticEpoch: 13,
          kind: 'remove',
          uris: ['file:///stale.sru']
        }
      ],
      { workspaceMode: 'workspace', rootUris: ['file:///workspace'] }
    );

    assert.equal(restored.decision.action, 'reuse');
    assert.equal(restored.checkpoint.schemaVersion, CACHE_SCHEMA_VERSION);
    assert.equal(restored.checkpoint.semanticEpoch, 13);
    assert.equal(restored.checkpoint.documents.length, 0);
  });

  test('journal inválido por secuencia duplicada fuerza rebuild limpio', () => {
    const restored = resolveCheckpointRestore(
      createCacheCheckpoint(2, [{ uri: 'file:///a.sru', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }),
      [
        {
          schemaVersion: CACHE_SCHEMA_VERSION,
          sequence: 1,
          semanticEpoch: 3,
          kind: 'remove',
          uris: ['file:///a.sru']
        },
        {
          schemaVersion: CACHE_SCHEMA_VERSION,
          sequence: 1,
          semanticEpoch: 4,
          kind: 'clear',
          uris: []
        }
      ]
    );

    assert.equal(restored.decision.action, 'rebuild');
    assert.equal(restored.decision.reason, 'invalid-journal-sequence');
    assert.equal(restored.checkpoint.documents.length, 0);
  });

  test('metadata incompatible fuerza rebuild por roots distintos', () => {
    const restored = resolveCheckpointRestore(
      createCacheCheckpoint(2, [{ uri: 'file:///a.sru', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace-a']
      }),
      [],
      {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace-b']
      }
    );

    assert.equal(restored.decision.action, 'rebuild');
    assert.equal(restored.decision.reason, 'root-uris-mismatch');
  });

  test('checkpoint normaliza y conserva snapshot de discovery en metadata', () => {
    const restored = resolveCheckpointRestore(
      createCacheCheckpoint(2, [{ uri: 'file:///a.sru', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace'],
        discovery: {
          sourceFiles: ['file:///workspace/lib.pbl/u_demo.sru', 'file:///workspace/lib.pbl/u_demo.sru'],
          sourceOrigins: {
            'file:///workspace/lib.pbl/u_demo.sru': 'pbl-folder-source'
          },
          roots: {
            workspaces: ['file:///workspace/app.pbw'],
            targets: [],
            libraries: ['file:///workspace/lib.pbl', 'file:///workspace/lib.pbl'],
            solutions: [],
            projects: []
          }
        }
      }),
      [],
      {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }
    );

    assert.equal(restored.decision.action, 'reuse');
    assert.deepEqual(restored.checkpoint.metadata.discovery, {
      sourceFiles: ['file:///workspace/lib.pbl/u_demo.sru'],
      sourceOrigins: {
        'file:///workspace/lib.pbl/u_demo.sru': 'pbl-folder-source'
      },
      roots: {
        workspaces: ['file:///workspace/app.pbw'],
        targets: [],
        libraries: ['file:///workspace/lib.pbl'],
        solutions: [],
        projects: []
      }
    });
  });

  test('KnowledgeBase exporta y restaura registros documentales', () => {
    const kb = new KnowledgeBase();
    kb.upsertDocument('file:///persist.sru', [{ id: 'persist', name: 'persist', kind: EntityKind.Function, uri: 'file:///persist.sru', line: 1, character: 0 }]);

    const exported = kb.exportDocumentRecords();
    const restored = new KnowledgeBase();
    restored.restoreDocumentRecords(exported, 7);

    assert.ok(restored.findDefinition('persist'));
    assert.equal(restored.semanticEpoch, 7);
  });

  test('exportDocumentRecords devuelve payload desacoplado de la KB', () => {
    const kb = new KnowledgeBase();
    kb.upsertDocument('file:///persist.sru', [{ id: 'persist', name: 'persist', kind: EntityKind.Function, uri: 'file:///persist.sru', line: 1, character: 0 }]);

    const exported = kb.exportDocumentRecords();
    exported[0].facts[0].name = 'mutated';

    assert.equal(kb.findDefinition('persist')?.name, 'persist');
  });

  test('restoreDocumentRecords copia defensivamente el input', () => {
    const kb = new KnowledgeBase();
    kb.upsertDocument('file:///persist.sru', [{ id: 'persist', name: 'persist', kind: EntityKind.Function, uri: 'file:///persist.sru', line: 1, character: 0 }]);

    const exported = kb.exportDocumentRecords();
    const restored = new KnowledgeBase();
    restored.restoreDocumentRecords(exported, 7);
    exported[0].facts[0].name = 'mutated';

    assert.equal(restored.findDefinition('persist')?.name, 'persist');
  });
});