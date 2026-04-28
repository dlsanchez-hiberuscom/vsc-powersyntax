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

    const names: string[] = [];
    const extractNames = (syms: typeof symbols) => {
      for (const sym of syms) {
        names.push(sym.name);
        if (sym.children && sym.children.length > 0) {
          extractNames(sym.children);
        }
      }
    };
    extractNames(symbols);

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

    // Verificar que los símbolos funcionales NO están en la raíz, 
    // demostrando que se están anidando en el contenedor jerárquico.
    const rootNames = symbols.map(s => s.name);
    assert.ok(!rootNames.includes('uf_inicializar'));
  });
});