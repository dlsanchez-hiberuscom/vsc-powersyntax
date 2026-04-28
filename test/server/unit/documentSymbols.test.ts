import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/documentSymbols', () => {
  test('extractDocumentSymbols devuelve secciones y símbolos reales', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///documentSymbols-unit.sru',
      'powerbuilder',
      1,
      source
    );

    const symbols = extractDocumentSymbols(document);
    const names = symbols.map((symbol) => symbol.name);

    assert.ok(symbols.length > 0, 'Debe devolver símbolos.');
    assert.ok(names.includes('forward'));
    assert.ok(names.includes('prototypes'));
    assert.ok(names.includes('variables'));

    assert.ok(
      names.includes('uf_inicializar') ||
      names.includes('constructor') ||
      names.includes('uf_dame_empresas_filtradas'),
      'No se detectó ningún símbolo funcional esperado del fixture.'
    );
  });
});