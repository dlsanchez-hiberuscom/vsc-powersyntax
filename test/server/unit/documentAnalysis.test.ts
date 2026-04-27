import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { getDocumentAnalysis, clearDocumentAnalysisCache } from '../../../src/server/analysis/analysisCache';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('analyzeDocument construye secciones y facts', () => {
  const document = TextDocument.create('file:///sample.sru', 'powerbuilder', 1, source);
  const analysis = analyzeDocument(document);

  assert.ok(analysis.sections.length >= 3);
  assert.ok(analysis.facts.some((fact) => fact.kind === 'section' && fact.name === 'forward'));
  assert.ok(analysis.facts.some((fact) => fact.kind === 'variable' && fact.name === 'ls_name'));
  assert.ok(analysis.facts.some((fact) => fact.kind === 'function' && fact.name === 'of_get_name'));
});

test('getDocumentAnalysis reutiliza caché por versión', () => {
  clearDocumentAnalysisCache();
  const document = TextDocument.create('file:///cache.sru', 'powerbuilder', 1, source);

  const a1 = getDocumentAnalysis(document);
  const a2 = getDocumentAnalysis(document);

  assert.equal(a1, a2);
});
