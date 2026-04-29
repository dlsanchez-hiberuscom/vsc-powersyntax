import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateStructure, validateSemantics } from '../../../src/server/features/diagnostics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { setAnalysisBackends, clearDocumentAnalysisCache } from '../../../src/server/analysis/analysisCache';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';

suite('unit/comments_bug', () => {
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

  test('ignora if dentro de comentario de línea', () => {
    const source = [
      '// if true then',
      '// end if'
    ].join('\r\n');

    const document = TextDocument.create('file:///test.sru', 'powerbuilder', 1, source);
    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0, 'No debería detectar bloques dentro de comentarios');
  });

  test('ignora if dentro de comentario de línea con espacio inicial', () => {
    const source = [
      '  // if true then',
      '  // otra cosa'
    ].join('\r\n');

    const document = TextDocument.create('file:///test.sru', 'powerbuilder', 1, source);
    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0, 'No debería detectar bloques dentro de comentarios con indentación');
  });

  test('detecta if con comentario al final de la línea', () => {
    const source = [
      'if true then // if comment here',
      '  messagebox("", "")',
      'end if'
    ].join('\r\n');

    const document = TextDocument.create('file:///test.sru', 'powerbuilder', 1, source);
    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0, 'Debería detectar el if aunque tenga un comentario al final');
  });

  test('ignora funciones dentro de comentarios en validación semántica', () => {
    const source = [
      'type w_test from window',
      'end type',
      'public function integer of_test()',
      '// of_nonexistent()',
      '/* of_another_missing() */',
      'return 0',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create('file:///test.sru', 'powerbuilder', 1, source);
    // Necesitamos que el documento sea analizado para que validateSemantics funcione
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    const hasMissingFunc = diagnostics.some(d => d.message.includes('of_nonexistent'));
    const hasMissingFunc2 = diagnostics.some(d => d.message.includes('of_another_missing'));

    assert.equal(hasMissingFunc, false, 'No debería detectar llamadas a funciones en comentarios //');
    assert.equal(hasMissingFunc2, false, 'No debería detectar llamadas a funciones en comentarios /* */');
  });

  test('ignora comentarios anidados /* /* ... */ */', () => {
    const source = [
      'if true then',
      '  /* outer start',
      '     /* inner block */',
      '     outer end */',
      '  messagebox("", "")',
      'end if'
    ].join('\r\n');

    const document = TextDocument.create('file:///test.sru', 'powerbuilder', 1, source);
    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0, 'No debería detectar errores de estructura con comentarios anidados');
  });
});
