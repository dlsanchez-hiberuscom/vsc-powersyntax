import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import {
  extractDocumentSymbols,
  extractDocumentSymbolsFromSnapshot
} from '../../../src/server/features/documentSymbols';
import { EntityKind, ScopeKind, type Scope } from '../../../src/server/knowledge/types';
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

  test('extractDocumentSymbolsFromSnapshot recompone tipos y callables desde snapshot', () => {
    const typeScope: Scope = {
      id: 'uo_demo',
      kind: ScopeKind.Type,
      uri: 'file:///snapshot-symbols.sru',
      startLine: 2,
      endLine: 5,
      children: [],
      symbols: []
    };
    const functionScope: Scope = {
      id: 'uo_demo.of_run',
      kind: ScopeKind.Function,
      uri: 'file:///snapshot-symbols.sru',
      startLine: 4,
      endLine: 5,
      parent: typeScope,
      children: [],
      symbols: []
    };
    typeScope.children.push(functionScope);

    const snapshot: SemanticDocumentSnapshot = {
      uri: 'file:///snapshot-symbols.sru',
      version: 1,
      fingerprint: 10,
      identity: 'file:///snapshot-symbols.sru@10',
      pass: 'enriched',
      readiness: 'nearby-semantic-ready',
      containerModel: {
        sections: [],
        typeBlocks: [{ name: 'uo_demo', startLine: 2, endLine: 3 }]
      },
      symbols: [
        {
          id: 'uo_demo',
          name: 'uo_demo',
          kind: EntityKind.Type,
          uri: 'file:///snapshot-symbols.sru',
          line: 2,
          character: 5,
          baseTypeName: 'nonvisualobject',
          signature: 'type from nonvisualobject'
        },
        {
          id: 'of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri: 'file:///snapshot-symbols.sru',
          line: 4,
          character: 24,
          containerName: 'uo_demo',
          signature: 'function : integer'
        }
      ],
      scopes: [typeScope],
      logicalStatements: [],
      maskedText: {
        lines: [
          'forward',
          'end forward',
          'type uo_demo from nonvisualobject',
          'end type',
          'public function integer of_run()',
          'end function'
        ],
        masks: Array.from({ length: 6 }, () => new Uint8Array())
      },
      controlBlocks: []
    };

    const symbols = extractDocumentSymbolsFromSnapshot(snapshot);
    const typeSymbol = symbols.find((symbol) => symbol.name === 'uo_demo');

    assert.ok(typeSymbol, 'Debe crear el símbolo de tipo desde snapshot.');
    assert.deepEqual(typeSymbol.children?.map((child) => child.name), ['of_run']);
    assert.equal(typeSymbol.children?.[0].range.end.line, 5);
  });
});