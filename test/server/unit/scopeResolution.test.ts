import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { EntityKind, ScopeKind } from '../../../src/server/knowledge/types';

suite('unit/scopeResolution', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  const uri = 'file:///w_test.sru';

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    
    // Simular un archivo con una variable de instancia y una función con variable local del mismo nombre
    kb.upsertDocument(uri, [
      { id: 'w_test', name: 'w_test', kind: EntityKind.Type, uri: uri, line: 0, character: 0 },
      { id: 'ls_data', name: 'ls_data', kind: EntityKind.Variable, datatype: 'string', containerName: 'w_test', uri: uri, line: 5, character: 0 },
      { id: 'of_test', name: 'of_test', kind: EntityKind.Function, containerName: 'w_test', uri: uri, line: 10, character: 0 }
    ], [
      {
        id: 'global',
        kind: ScopeKind.Global,
        uri: uri,
        startLine: 0,
        endLine: 100,
        children: [
          {
            id: 'w_test',
            kind: ScopeKind.Type,
            uri: uri,
            startLine: 0,
            endLine: 100,
            children: [
              {
                id: 'w_test.of_test',
                kind: ScopeKind.Function,
                uri: uri,
                startLine: 10,
                endLine: 20,
                children: [],
                symbols: [
                  { id: 'ls_data', name: 'ls_data', kind: EntityKind.Variable, datatype: 'integer', containerName: 'w_test.of_test', uri: uri, line: 12, character: 4 }
                ]
              }
            ],
            symbols: []
          }
        ],
        symbols: []
      }
    ]);

    kb.endBatchUpdate();
  });

  test('resolveTargetEntity: should prioritize local variable over instance variable', () => {
    // Resolvemos en la línea 15 (dentro de of_test)
    const targets = resolveTargetEntity(
      { identifier: 'ls_data' },
      uri,
      kb,
      graph,
      15
    );

    assert.equal(targets.length, 1);
    assert.equal(targets[0].containerName, 'w_test.of_test'); // Variable local
    assert.equal(targets[0].datatype, 'integer');
  });

  test('resolveTargetEntity: should fall back to instance variable outside function scope', () => {
    // Resolvemos en la línea 25 (fuera de of_test)
    const targets = resolveTargetEntity(
      { identifier: 'ls_data' },
      uri,
      kb,
      graph,
      25
    );

    assert.equal(targets.length, 1);
    assert.equal(targets[0].containerName, 'w_test'); // Variable de instancia
    assert.equal(targets[0].datatype, 'string');
  });

  test('resolveTargetEntity: should resolve qualifier using scope', () => {
    // Definimos un tipo para probar la resolución de miembros
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///n_cst.sru', [
      { id: 'n_cst', name: 'n_cst', kind: EntityKind.Type, uri: 'file:///n_cst.sru', line: 0, character: 0 },
      { id: 'of_foo', name: 'of_foo', kind: EntityKind.Function, containerName: 'n_cst', uri: 'file:///n_cst.sru', line: 5, character: 0 }
    ]);
    
    // Añadimos una variable local con ese tipo
    const scope = kb.getScopeAt(uri, 15);
    if (scope) {
        scope.symbols.push({
            id: 'lo_obj',
            name: 'lo_obj',
            kind: EntityKind.Variable,
            datatype: 'n_cst',
            containerName: 'w_test.of_test',
            uri: uri,
            line: 11,
            character: 4
        });
    }
    kb.endBatchUpdate();

    const targets = resolveTargetEntity(
      { identifier: 'of_foo', qualifier: 'lo_obj' },
      uri,
      kb,
      graph,
      15
    );

    assert.equal(targets.length, 1);
    assert.equal(targets[0].name, 'of_foo');
    assert.equal(targets[0].uri, 'file:///n_cst.sru');
  });
});
