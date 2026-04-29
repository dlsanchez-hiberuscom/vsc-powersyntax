import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateStructure, validateSemantics } from '../../../src/server/features/diagnostics';
import { DIAGNOSTIC_SOURCE } from '../../../src/shared/types';
import { loadFixture } from '../helpers/fixtureLoader';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { setAnalysisBackends, clearDocumentAnalysisCache } from '../../../src/server/analysis/analysisCache';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';

suite('unit/diagnostics', () => {
  let kb: KnowledgeBase;
  let systemCatalog: SystemCatalog;
  let inheritanceGraph: InheritanceGraph;
  let documentCache: DocumentCache;

  setup(() => {
    kb = new KnowledgeBase();
    systemCatalog = new SystemCatalog();
    inheritanceGraph = new InheritanceGraph(kb);
    documentCache = new DocumentCache();
    setAnalysisBackends(documentCache, kb);
  });

  teardown(() => {
    clearDocumentAnalysisCache();
  });

  test('validateStructure no devuelve errores en estructura simple válida', () => {
    const validSource = [
      'forward',
      'end forward',
      '',
      'forward prototypes',
      'end prototypes',
      '',
      'type variables',
      'end variables'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///valid.sru',
      'powerbuilder',
      1,
      validSource
    );

    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0);
  });

  test('validateStructure detecta bloque sin cierre', () => {
    const invalidSource = loadFixture('basic/sample_invalid.sru');
    const document = TextDocument.create(
      'file:///invalid.sru',
      'powerbuilder',
      1,
      invalidSource
    );

    const diagnostics = validateStructure(document);

    assert.ok(diagnostics.length > 0);
    assert.equal(diagnostics[0].source, DIAGNOSTIC_SOURCE);
    assert.match(diagnostics[0].message, /cerrado correctamente/i);
  });

  test('validateSemantics detecta todas las reglas (SD1-SD5)', () => {
    const source = loadFixture('diagnostics_semantic.srw');
    const document = TextDocument.create(
      'file:///diagnostics_semantic.srw',
      'powerbuilder',
      1,
      source
    );

    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    // Deben detectarse:
    // SD1: ls_bad
    // SD2: of_nonexistent_function, of_also_missing
    // SD3: (no hay tipo base inexistente aquí, window es builtin)
    // SD4: ls_unused_local
    // SD5: is_unused_var

    assert.ok(diagnostics.length > 0);

    const messages = diagnostics.map(d => d.message);
    const hasUnusedLocal = messages.some(m => m.includes("La variable local 'ls_unused_local' está declarada pero no se usa."));
    const hasUnusedPrivate = messages.some(m => m.includes("La variable de instancia privada 'is_unused_var' no se usa en ningún método o evento del archivo."));
    const hasUnknownFunc = messages.some(m => m.includes("La función 'of_nonexistent_function' no se encuentra"));
    const hasUnknownFunc2 = messages.some(m => m.includes("La función 'of_also_missing' no se encuentra"));

    assert.ok(hasUnusedLocal, 'No se detectó variable local no usada');
    assert.ok(hasUnusedPrivate, 'No se detectó variable privada no usada');
    assert.ok(hasUnknownFunc, 'No se detectó función no existente');
    assert.ok(hasUnknownFunc2, 'No se detectó segunda función no existente');
  });
});