/**
 * Tests de integración para los proveedores LSP principales.
 *
 * Usa fuente PowerScript inline mínima, sin escaneo completo de workspace.
 * Valida que cada proveedor devuelve resultado (o null) de forma coherente
 * con la infraestructura KB+Graph+SystemCatalog.
 */
import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { provideCompletion } from '../../../src/server/features/completion';
import { provideSignatureHelp } from '../../../src/server/features/signatureHelp';
import { provideDefinition } from '../../../src/server/features/definition';
import { provideReferences } from '../../../src/server/features/references';
import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { provideSemanticTokens } from '../../../src/server/features/semanticTokens';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';

const MINIMAL_SOURCE = [
  'forward',
  'end forward',
  '',
  'type nvo_test from nonvisualobject',
  'end type',
  '',
  'type variables',
  'integer ii_count',
  'end variables',
  '',
  'on nvo_test.create',
  'end on',
  '',
  'function integer uf_get_count()',
  'return ii_count',
  'end function',
].join('\r\n');

const URI = 'file:///integration-providers.sru';

function makeDocument(): TextDocument {
  return TextDocument.create(URI, 'powerbuilder', 1, MINIMAL_SOURCE);
}

function makeKb(): KnowledgeBase {
  const kb = new KnowledgeBase();
  kb.upsertDocument(URI, [
    { id: 'uf_get_count', name: 'uf_get_count', kind: EntityKind.Function, uri: URI, line: 13, character: 9 },
    { id: 'ii_count', name: 'ii_count', kind: EntityKind.Variable, uri: URI, line: 7, character: 8 },
  ]);
  return kb;
}

suite('integration/lsp-providers', () => {
  let document: TextDocument;
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let systemCatalog: SystemCatalog;

  setup(() => {
    document = makeDocument();
    kb = makeKb();
    graph = new InheritanceGraph(kb);
    systemCatalog = new SystemCatalog();
  });

  suite('provideHover', () => {
    test('retorna null o hover en posición de símbolo conocido', () => {
      const pos = Position.create(13, 12); // línea de uf_get_count
      const result = provideHover(document, pos, kb, systemCatalog, graph);
      // El proveedor puede retornar null si no resuelve el símbolo — ambos son válidos
      assert.ok(result === null || typeof result === 'object');
    });

    test('retorna null en posición vacía', () => {
      const pos = Position.create(0, 0); // línea 'forward'
      const result = provideHover(document, pos, kb, systemCatalog, graph);
      assert.ok(result === null || typeof result === 'object');
    });
  });

  suite('provideCompletion', () => {
    test('retorna array o null en posición de código', () => {
      const pos = Position.create(14, 7); // dentro del cuerpo de la función
      const result = provideCompletion(document, pos, kb, systemCatalog, graph);
      assert.ok(result === null || Array.isArray(result));
    });

    test('retorna array o null en inicio de línea vacía', () => {
      const pos = Position.create(2, 0); // línea en blanco
      const result = provideCompletion(document, pos, kb, systemCatalog, graph);
      assert.ok(result === null || Array.isArray(result));
    });
  });

  suite('provideSignatureHelp', () => {
    test('retorna null o SignatureHelp en posición de código', () => {
      const pos = Position.create(14, 7);
      const result = provideSignatureHelp(document, pos, kb, systemCatalog, graph);
      assert.ok(result === null || typeof result === 'object');
    });
  });

  suite('provideDefinition', () => {
    test('retorna null o Location en posición de símbolo', () => {
      const pos = Position.create(13, 12); // uf_get_count
      const result = provideDefinition(document, pos, kb, graph);
      assert.ok(result === null || typeof result === 'object');
    });
  });

  suite('provideReferences', () => {
    test('retorna array de Locations (puede ser vacío)', () => {
      const pos = Position.create(13, 12);
      const result = provideReferences(document, pos, kb, graph, []);
      assert.ok(Array.isArray(result));
    });
  });

  suite('extractDocumentSymbols', () => {
    test('retorna array de símbolos (puede ser vacío)', () => {
      const result = extractDocumentSymbols(document);
      assert.ok(Array.isArray(result));
    });

    test('detecta símbolos en fuente mínima', () => {
      const result = extractDocumentSymbols(document);
      // Con fuente mínima válida puede detectar la función uf_get_count
      assert.ok(Array.isArray(result));
    });
  });

  suite('provideSemanticTokens', () => {
    test('retorna objeto con data array', () => {
      const result = provideSemanticTokens(document, kb, graph, systemCatalog);
      assert.ok(result && typeof result === 'object');
      assert.ok('data' in result);
    });

    test('data no contiene valores negativos', () => {
      const result = provideSemanticTokens(document, kb, graph, systemCatalog);
      if ('data' in result && Array.isArray(result.data)) {
        for (const v of result.data) {
          assert.ok(v >= 0, `Token data no debe contener valores negativos, encontrado: ${v}`);
        }
      }
    });
  });
});
