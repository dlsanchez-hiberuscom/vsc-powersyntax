import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  clearDocumentAnalysisCache,
  getDocumentAnalysis,
  invalidateDocumentAnalysis
} from '../../../src/server/analysis/analysisCache';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('analysisCache devuelve misma instancia si no cambia la versión', () => {
  clearDocumentAnalysisCache();
  const document = TextDocument.create('file:///cache.sru', 'powerbuilder', 1, source);

  const a1 = getDocumentAnalysis(document);
  const a2 = getDocumentAnalysis(document);

  assert.equal(a1, a2);
});

test('analysisCache recalcula tras invalidación explícita', () => {
  clearDocumentAnalysisCache();
  const document = TextDocument.create('file:///cache-2.sru', 'powerbuilder', 1, source);

  const a1 = getDocumentAnalysis(document);
  invalidateDocumentAnalysis(document.uri);
  const a2 = getDocumentAnalysis(document);

  assert.notEqual(a1, a2);
});
