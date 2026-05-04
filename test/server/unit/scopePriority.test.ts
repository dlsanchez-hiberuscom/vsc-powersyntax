import * as assert from 'assert/strict';
import { VARIABLE_SCOPE_PRIORITY, getVariableScopePriority, type VariableScope } from '../../../src/server/knowledge/scopePriority';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { Entity, EntityKind, ScopeKind } from '../../../src/server/knowledge/types';

suite('unit/scopePriority', () => {
  suite('VARIABLE_SCOPE_PRIORITY table', () => {
    test('Local has highest priority (0)', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.get('Local'), 0);
    });

    test('Argumento has same priority as Local (0)', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.get('Argumento'), 0);
    });

    test('Compartida has priority 1', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.get('Compartida'), 1);
    });

    test('Global has priority 2', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.get('Global'), 2);
    });

    test('Instancia has lowest priority (3)', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.get('Instancia'), 3);
    });

    test('PowerBuilder scope resolution order: Local/Argumento > Compartida > Global > Instancia', () => {
      const scopes: VariableScope[] = ['Local', 'Argumento', 'Compartida', 'Global', 'Instancia'];
      const priorities = scopes.map((scope) => getVariableScopePriority(scope));

      // Local = Argumento
      assert.equal(priorities[0], priorities[1], 'Local and Argumento must have equal priority');

      // Local/Argumento < Compartida < Global < Instancia (lower number = higher priority)
      assert.ok(priorities[0] < priorities[2], 'Local must have higher priority than Compartida');
      assert.ok(priorities[2] < priorities[3], 'Compartida must have higher priority than Global');
      assert.ok(priorities[3] < priorities[4], 'Global must have higher priority than Instancia');
    });

    test('table has exactly 5 entries', () => {
      assert.equal(VARIABLE_SCOPE_PRIORITY.size, 5);
    });
  });

  suite('getVariableScopePriority helper', () => {
    test('undefined scope falls back to Instancia priority', () => {
      assert.equal(getVariableScopePriority(undefined), getVariableScopePriority('Instancia'));
    });

    test('returns MAX_SAFE_INTEGER for unknown scope cast', () => {
      // Casting to simulate an unexpected value
      assert.equal(getVariableScopePriority('Unknown' as VariableScope), Number.MAX_SAFE_INTEGER);
    });
  });

  suite('cross-module consistency', () => {
    let kb: KnowledgeBase;
    let graph: InheritanceGraph;
    const uri = 'file:///w_scope_test.sru';

    setup(() => {
      kb = new KnowledgeBase();
      graph = new InheritanceGraph(kb);

      kb.beginBatchUpdate();
      kb.upsertDocument(uri, [
        { id: 'w_scope_test', name: 'w_scope_test', kind: EntityKind.Type, uri, line: 0, character: 0 },
        // Instance variable
        { id: 'ls_name', name: 'ls_name', kind: EntityKind.Variable, datatype: 'string', scope: 'Instancia', containerName: 'w_scope_test', uri, line: 2, character: 0 },
        // Shared variable with same name
        { id: 'ls_name', name: 'ls_name', kind: EntityKind.Variable, datatype: 'long', scope: 'Compartida', containerName: 'w_scope_test', uri, line: 3, character: 0 },
        // Global variable with same name
        { id: 'ls_name', name: 'ls_name', kind: EntityKind.Variable, datatype: 'decimal', scope: 'Global', uri, line: 4, character: 0 },
        // Another variable with different name to test Global vs Instancia
        { id: 'total', name: 'total', kind: EntityKind.Variable, datatype: 'string', scope: 'Instancia', containerName: 'w_scope_test', uri, line: 5, character: 0 },
        { id: 'total', name: 'total', kind: EntityKind.Variable, datatype: 'decimal', scope: 'Global', uri, line: 6, character: 0 },
        // Control
        { id: 'cb_1', name: 'cb_1', kind: EntityKind.Type, uri, line: 20, character: 0, containerName: 'w_scope_test', containerKind: 'Type' },
        // Function
        { id: 'of_run', name: 'of_run', kind: EntityKind.Function, containerName: 'w_scope_test', uri, line: 10, character: 0 },
      ], [
        {
          id: 'global',
          kind: ScopeKind.Global,
          uri,
          startLine: 0,
          endLine: 100,
          children: [{
            id: 'w_scope_test',
            kind: ScopeKind.Type,
            uri,
            startLine: 0,
            endLine: 100,
            children: [{
              id: 'w_scope_test.of_run',
              kind: ScopeKind.Function,
              uri,
              startLine: 10,
              endLine: 30,
              children: [],
              symbols: [
                // Local variable with same name as instance + shared
                { id: 'ls_name', name: 'ls_name', kind: EntityKind.Variable, datatype: 'integer', scope: 'Local', containerName: 'w_scope_test.of_run', uri, line: 12, character: 4 }
              ]
            }],
            symbols: []
          }],
          symbols: []
        }
      ]);
      kb.endBatchUpdate();
    });

    test('resolveTargetEntity prefers Local over Instancia over Compartida (inside function)', () => {
      // Inside of_run: Local ls_name (integer) should win over Instancia (string) and Compartida (long)
      const targets = resolveTargetEntity(
        { identifier: 'ls_name' },
        uri,
        kb,
        graph,
        15
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].datatype, 'integer', 'Local variable (integer) should be the winner');
    });

    test('resolveTargetEntity prefers Compartida over Instancia (outside function)', () => {
      // Outside of_run: Compartida ls_name (long) should win over Instancia (string)
      const targets = resolveTargetEntity(
        { identifier: 'ls_name' },
        uri,
        kb,
        graph,
        35
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].datatype, 'long', 'Compartida variable (long) should win over Instancia (string)');
    });

    test('resolveTargetEntity prefers Global over Instancia (outside function)', () => {
      // Outside of_run: Global total (decimal) should win over Instancia (string)
      const targets = resolveTargetEntity(
        { identifier: 'total' },
        uri,
        kb,
        graph,
        35
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].datatype, 'decimal', 'Global variable (decimal) should win over Instancia (string)');
    });

    test('resolveTargetEntity with :: explicitly resolves Global and bypasses others', () => {
      // Inside of_run: local is integer, instance is string, shared is long, global is decimal
      // ::ls_name should resolve to decimal (Global)
      const targets = resolveTargetEntity(
        { identifier: 'ls_name', separator: '::' },
        uri,
        kb,
        graph,
        15
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].scope, 'Global', 'Should resolve to Global scope');
      assert.equal(targets[0].datatype, 'decimal', 'Should resolve to Global decimal variable');
    });

    test('resolveTargetEntity with This. qualifier resolves instance and bypasses local', () => {
      // Inside of_run: local is integer, instance is string
      // This.ls_name should resolve to string (Instancia)
      const targets = resolveTargetEntity(
        { identifier: 'ls_name', qualifier: 'This', separator: '.' },
        uri,
        kb,
        graph,
        15
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].scope, 'Compartida', 'Should resolve to Compartida scope (wins over Instancia)');
      assert.equal(targets[0].datatype, 'long', 'Should resolve to shared long variable');
    });

    test('resolveTargetEntity with Parent. qualifier resolves to container members', () => {
      // Parent.ls_name in cb_1 (line 21) should resolve to members of w_scope_test
      const targets = resolveTargetEntity(
        { identifier: 'ls_name', qualifier: 'Parent', separator: '.' },
        uri,
        kb,
        graph,
        21 // line inside cb_1
      );

      assert.ok(targets.length >= 1, 'Should resolve at least one target');
      assert.equal(targets[0].containerName, 'w_scope_test', 'Should resolve to member of w_scope_test');
    });

    test('getMemberClosure sorts Compartida before Instancia at same distance', () => {
      const closure = graph.getMemberClosure('w_scope_test');
      const variables = closure.filter(
        (entry) => entry.entity.kind === EntityKind.Variable && entry.entity.name.toLowerCase() === 'ls_name'
      );

      assert.ok(variables.length >= 2, 'Should have at least instance and shared variables');

      // First variable in the sorted closure should be Compartida, then Instancia
      const compartidaIndex = variables.findIndex((v) => v.entity.scope === 'Compartida');
      const instanciaIndex = variables.findIndex((v) => v.entity.scope === 'Instancia');
      assert.ok(compartidaIndex < instanciaIndex, 'Compartida should appear before Instancia in member closure');
    });
  });
});
