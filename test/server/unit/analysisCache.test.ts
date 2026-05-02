import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  clearAnalysisBackends,
  clearDocumentAnalysisCache,
  evictDocumentAnalysis,
  getDocumentAnalysis,
  invalidateDocumentAnalysis,
  setAnalysisBackends
} from '../../../src/server/analysis/analysisCache';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

suite('unit/analysisCache', () => {
  setup(() => {
    clearDocumentAnalysisCache();
    clearAnalysisBackends();
  });

  test('analysisCache devuelve misma instancia si no cambia la versión', () => {
    const document = TextDocument.create('file:///cache.sru', 'powerbuilder', 1, source);

    const a1 = getDocumentAnalysis(document);
    const a2 = getDocumentAnalysis(document);

    assert.equal(a1, a2);
  });

  test('analysisCache recalcula tras invalidación explícita', () => {
    const document = TextDocument.create('file:///cache-2.sru', 'powerbuilder', 1, source);

    const a1 = getDocumentAnalysis(document);
    invalidateDocumentAnalysis(document.uri);
    const a2 = getDocumentAnalysis(document);

    assert.notEqual(a1, a2);
  });

  test('evictDocumentAnalysis no borra snapshots publicados ni DocumentCache', () => {
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const document = TextDocument.create('file:///cache-close.sru', 'powerbuilder', 1, source);

    setAnalysisBackends(documentCache, knowledgeBase);
    const first = getDocumentAnalysis(document);

    assert.ok(documentCache.get(document.uri));
    assert.ok(knowledgeBase.getDocumentSnapshot(document.uri));

    evictDocumentAnalysis(document.uri);

    assert.ok(documentCache.get(document.uri));
    assert.ok(knowledgeBase.getDocumentSnapshot(document.uri));
    assert.notEqual(getDocumentAnalysis(document), first);
  });

  test('invalidateDocumentAnalysis borra backends para eliminación real de archivo', () => {
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const document = TextDocument.create('file:///cache-delete.sru', 'powerbuilder', 1, source);

    setAnalysisBackends(documentCache, knowledgeBase);
    getDocumentAnalysis(document);

    invalidateDocumentAnalysis(document.uri);

    assert.equal(documentCache.get(document.uri), undefined);
    assert.equal(knowledgeBase.getDocumentSnapshot(document.uri), null);
  });

  test('reanaliza si cambia el sourceOrigin contextual sin cambiar la versión', () => {
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const document = TextDocument.create('file:///proj/src/cache-origin.sru', 'powerbuilder', 1, source);
    let currentSourceOrigin: SourceOrigin = 'unknown';

    setAnalysisBackends(documentCache, knowledgeBase, undefined, () => currentSourceOrigin);

    const first = getDocumentAnalysis(document);
    const firstType = first.semanticFacts.find((fact) => fact.kind.toString().toLowerCase() === 'type');

    currentSourceOrigin = 'solution-source';

    const second = getDocumentAnalysis(document);
    const secondType = second.semanticFacts.find((fact) => fact.kind.toString().toLowerCase() === 'type');
    const persistedType = knowledgeBase.getDocumentSnapshot(document.uri)?.symbols.find(
      (fact) => fact.kind.toString().toLowerCase() === 'type'
    );

    assert.notEqual(first, second);
    assert.equal(firstType?.lineage?.sourceOrigin, 'unknown');
    assert.equal(secondType?.lineage?.sourceOrigin, 'solution-source');
    assert.equal(persistedType?.lineage?.sourceOrigin, 'solution-source');
  });
});
