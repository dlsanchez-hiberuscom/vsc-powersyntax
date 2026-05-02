import * as assert from 'assert/strict';
import { performance } from 'perf_hooks';

import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

const SYNTHETIC_DOCUMENTS = 5000;

suite('performance/knowledgeBase', () => {
  test('KnowledgeBase perf: upsert y remove incremental se mantienen acotados tras miles de documentos', function () {
    this.timeout(10000);

    const kb = new KnowledgeBase();
    const records = Array.from({ length: SYNTHETIC_DOCUMENTS }, (_, index) => {
      const uri = `file:///synthetic/doc-${index}.sru`;
      return {
        uri,
        facts: [
          {
            id: `u_doc_${index}`,
            name: `u_doc_${index}`,
            kind: EntityKind.Type,
            uri,
            line: 1,
            character: 0
          },
          {
            id: `u_doc_${index}.of_run`,
            name: 'of_run',
            kind: EntityKind.Function,
            uri,
            line: 5,
            character: 2,
            containerName: `u_doc_${index}`
          }
        ]
      };
    });

    kb.resyncDocuments(records);
    assert.equal(kb.countEntities(), SYNTHETIC_DOCUMENTS * 2);

    const targetUri = records[Math.floor(SYNTHETIC_DOCUMENTS / 2)].uri;

    const upsertStart = performance.now();
    kb.upsertDocument(targetUri, [
      {
        id: 'u_doc_hot',
        name: 'u_doc_hot',
        kind: EntityKind.Type,
        uri: targetUri,
        line: 1,
        character: 0
      },
      {
        id: 'u_doc_hot.of_run',
        name: 'of_run',
        kind: EntityKind.Function,
        uri: targetUri,
        line: 7,
        character: 2,
        containerName: 'u_doc_hot'
      }
    ]);
    const upsertElapsedMs = performance.now() - upsertStart;

    const removeStart = performance.now();
    kb.removeDocument(targetUri);
    const removeElapsedMs = performance.now() - removeStart;

    console.log(
      `[PERFORMANCE] KnowledgeBase incremental upsert=${upsertElapsedMs.toFixed(2)}ms remove=${removeElapsedMs.toFixed(2)}ms docs=${SYNTHETIC_DOCUMENTS}`
    );

    assert.ok(upsertElapsedMs < 150, `upsert incremental de KB demasiado lento: ${upsertElapsedMs.toFixed(2)}ms`);
    assert.ok(removeElapsedMs < 150, `remove incremental de KB demasiado lento: ${removeElapsedMs.toFixed(2)}ms`);
  });
});