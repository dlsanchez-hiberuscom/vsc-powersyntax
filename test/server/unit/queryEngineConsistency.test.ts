import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideCompletion } from '../../../src/server/features/completion';
import { provideDefinition } from '../../../src/server/features/definition';
import { provideReferences } from '../../../src/server/features/references';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/queryEngineConsistency (B156)', () => {
  test('definition, references y completion mantienen el mismo contexto semántico base', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const systemCatalog = new SystemCatalog();

    function setupDocument(uri: string, content: string): TextDocument {
      const doc = TextDocument.create(uri, 'powerbuilder', 1, content);
      const analysis = analyzeDocument(doc);
      kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes);
      return doc;
    }

    setupDocument('file:///n_cst_math.sru', `
global type n_cst_math from nonvisualobject
end type
forward prototypes
public function integer of_shared()
public function integer of_math_only()
end prototypes
public function integer of_shared();
  return 1
end function
public function integer of_math_only();
  return 2
end function
    `);

    setupDocument('file:///n_cst_other.sru', `
global type n_cst_other from nonvisualobject
end type
forward prototypes
public function integer of_shared()
public function integer of_other_only()
end prototypes
public function integer of_shared();
  return 3
end function
public function integer of_other_only();
  return 4
end function
    `);

    const doc = setupDocument('file:///u_test.sru', `
global type u_test from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  n_cst_math calc
  calc.of_shared()
  calc.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('calc.of_shared()'));
    const completionLine = lines.findIndex((line) => line.trim() === 'calc.');
    const definition = provideDefinition(doc, Position.create(callLine, lines[callLine].indexOf('of_shared') + 1), kb, graph);
    const references = provideReferences(doc, Position.create(callLine, lines[callLine].indexOf('of_shared') + 1), kb, graph, [{ uri: doc.uri, content: doc.getText() }]);
    const completions = provideCompletion(doc, Position.create(completionLine, lines[completionLine].indexOf('calc.') + 5), kb, systemCatalog, graph);

    assert.ok(definition && !Array.isArray(definition));
    assert.equal(definition.uri, 'file:///n_cst_math.sru');
    assert.ok(references.some((reference) => reference.uri === 'file:///n_cst_math.sru'));
    assert.ok(!references.some((reference) => reference.uri === 'file:///n_cst_other.sru'));
    assert.ok(completions?.some((item) => item.label === 'of_shared'));
    assert.ok(completions?.some((item) => item.label === 'of_math_only'));
    assert.ok(!completions?.some((item) => item.label === 'of_other_only'));
  });
});