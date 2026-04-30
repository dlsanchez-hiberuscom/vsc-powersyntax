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

  test('validateSemantics detecta las reglas implementadas (SD2-SD5)', () => {
    const source = loadFixture('diagnostics_semantic.srw');
    const document = TextDocument.create(
      'file:///diagnostics_semantic.srw',
      'powerbuilder',
      1,
      source
    );

    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    // Deben detectarse:
    // SD2: of_nonexistent_function, of_also_missing
    // SD3: (no hay tipo base inexistente aquí, window es builtin)
    // SD4: ls_unused_local
    // SD5: is_unused_var
    // (SD1 está diferida hasta resolución fuerte; ver specs/010-diagnosticos-semanticos.)

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

  test('validateStructure soporta IF multi-línea con continuación &', () => {
    const source = [
      'public function integer of_test ();',
      'integer li_x = 1',
      'if li_x > 0 and &',
      '   li_x < 10 then',
      '   li_x = li_x + 1',
      'end if',
      'return li_x',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///multilineif.sru',
      'powerbuilder',
      1,
      source
    );

    const diagnostics = validateStructure(document);
    // Antes el `end if` se reportaba como cierre sin apertura porque el IF
    // multi-línea con `&` no se detectaba.
    assert.equal(
      diagnostics.length,
      0,
      `Estructura válida marcada como inválida: ${diagnostics.map(d => d.message).join(' | ')}`
    );
  });

  // -------------------------------------------------------------------------
  // SD8 / SD9 / SD10 (Specs 078, 079, 080)
  // -------------------------------------------------------------------------

  test('SD8: declaración duplicada en el mismo scope', () => {
    const source = [
      'public function integer of_test ()',
      '  integer li_x',
      '  integer li_x',
      '  return 0',
      'end function'
    ].join('\r\n');
    const document = TextDocument.create('file:///dup.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd8 = diags.filter(d => /ya está declarada/i.test(d.message));
    assert.ok(sd8.length >= 1, 'esperaba al menos 1 SD8');
  });

  test('SD9: return fuera de función/evento', () => {
    const source = [
      'integer li_root',
      'return 0',
      ''
    ].join('\r\n');
    const document = TextDocument.create('file:///ret.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd9 = diags.filter(d => /'return'/.test(d.message));
    assert.ok(sd9.length >= 1, 'esperaba al menos 1 SD9');
  });

  test('SD10: exit/continue fuera de bucle', () => {
    const source = [
      'public function integer of_test ()',
      '  if true then',
      '    exit',
      '  end if',
      '  return 0',
      'end function'
    ].join('\r\n');
    const document = TextDocument.create('file:///exit.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd10 = diags.filter(d => /'exit'/.test(d.message));
    assert.ok(sd10.length >= 1, 'esperaba al menos 1 SD10');
  });
});