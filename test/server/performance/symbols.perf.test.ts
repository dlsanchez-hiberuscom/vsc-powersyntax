import * as assert from 'assert/strict';
import { performance } from 'perf_hooks';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { loadFixture } from '../helpers/fixtureLoader';

suite('performance/documentSymbols', () => {
  test('Document Symbols se ejecuta en menos de 50ms para un archivo pequeño', () => {
    const source = loadFixture('basic/sample.sru');
    const document = TextDocument.create('file:///sample.sru', 'powerbuilder', 1, source);

    const start = performance.now();
    
    // Calentamiento y ejecución real
    for (let i = 0; i < 5; i++) {
      extractDocumentSymbols(document);
    }
    
    const elapsedMs = (performance.now() - start) / 5; // media de 5 ejecuciones

    // Presupuesto de rendimiento: < 50ms
    if (elapsedMs > 25) {
      console.warn(`[PERFORMANCE WARNING] Document Symbols tomó ${elapsedMs.toFixed(2)}ms (cerca del límite de 50ms)`);
    }

    assert.ok(elapsedMs < 50, `Document Symbols superó el presupuesto: ${elapsedMs.toFixed(2)}ms`);
    console.log(`[PERFORMANCE] Document Symbols en sample.sru: ${elapsedMs.toFixed(2)}ms`);
  });
});
