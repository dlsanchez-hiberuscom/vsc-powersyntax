import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/documentAnalysis', () => {
  test('analyzeDocument construye secciones y facts', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///documentAnalysis-unit.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocument(document);

    assert.ok(analysis.sections.length >= 3);
    assert.ok(analysis.facts.length > 0);

    assert.ok(analysis.sections.some((section) => section.kind === 'forward'));
    assert.ok(analysis.sections.some((section) => section.kind === 'prototypes'));
    assert.ok(analysis.sections.some((section) => section.kind === 'variables'));

    assert.ok(
      analysis.facts.some(
        (fact) => fact.kind === 'variable' && fact.name === 'ib_inicializado'
      ),
      'No se detectó la variable esperada ib_inicializado.'
    );

    assert.ok(
      analysis.facts.some(
        (fact) => ['function', 'subroutine', 'event'].includes(fact.kind) && fact.name === 'uf_inicializar'
      ),
      'No se detectó el símbolo esperado uf_inicializar.'
    );
  });
});