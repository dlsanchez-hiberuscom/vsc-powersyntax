import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { buildHierarchyInspection } from '../../../src/server/features/hierarchyInspection';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/hierarchyInspection (B065)', () => {
  test('expone ancestro inmediato, arbol y overrides heredados', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.srw', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.srw', line: 0, character: 0, baseTypeName: 'window' },
      { id: 'base.of_init', name: 'of_init', kind: EntityKind.Function, uri: 'file:///w_base.srw', line: 5, character: 2, containerName: 'w_base', access: 'protected' }
    ]);
    kb.upsertDocument('file:///w_child.srw', [
      { id: 'w_child', name: 'w_child', kind: EntityKind.Type, uri: 'file:///w_child.srw', line: 0, character: 0, baseTypeName: 'w_base' },
      { id: 'child.of_init', name: 'of_init', kind: EntityKind.Function, uri: 'file:///w_child.srw', line: 7, character: 2, containerName: 'w_child' },
      { id: 'child.of_only', name: 'of_only', kind: EntityKind.Function, uri: 'file:///w_child.srw', line: 10, character: 2, containerName: 'w_child' }
    ]);
    kb.upsertDocument('file:///w_grandchild.srw', [
      { id: 'w_grandchild', name: 'w_grandchild', kind: EntityKind.Type, uri: 'file:///w_grandchild.srw', line: 0, character: 0, baseTypeName: 'w_child' }
    ]);
    kb.endBatchUpdate();

    const inspection = buildHierarchyInspection('w_child', graph);

    assert.equal(inspection.immediateAncestor, 'w_base');
    assert.deepEqual(inspection.ancestorChain, ['w_base', 'window', 'powerobject']);
    assert.equal(inspection.hierarchyTree?.name, 'w_child');
    assert.deepEqual(inspection.hierarchyTree?.children.map((child) => child.name), ['w_grandchild']);
    assert.equal(inspection.overriddenMembers.length, 1);
    assert.equal(inspection.overriddenMembers[0].name, 'of_init');
    assert.equal(inspection.overriddenMembers[0].inheritedFrom, 'w_base');
    assert.equal(inspection.closureSummary.override, 1);
    assert.equal(inspection.closureSummary.own, 1);
  });

  test('expone evidencia lifecycle para create/destroy y constructor/destructor del tipo foco', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create('file:///lifecycle-inspection.sru', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);

    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const inspection = buildHierarchyInspection('util_uo_permisos', graph, kb);
    const lifecycle = (inspection as any).lifecycle;

    assert.ok(Array.isArray(lifecycle), 'Hierarchy inspection debe proyectar un bloque lifecycle.');
    assert.equal(lifecycle.length, 2);
    assert.deepEqual(
      lifecycle.map((entry: any) => ({
        phase: entry.phase,
        callsAncestor: entry.callsAncestor,
        triggersHook: entry.triggersHook,
        hookResolved: entry.hookResolved
      })),
      [
        { phase: 'create', callsAncestor: true, triggersHook: 'constructor', hookResolved: true },
        { phase: 'destroy', callsAncestor: true, triggersHook: 'destructor', hookResolved: true }
      ]
    );
  });

  test('expone ancestros nativos conocidos como system type en hierarchy inspection', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const catalog = new SystemCatalog();

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///pfc_n_crypterobject.sru', [
      {
        id: 'pfc_n_crypterobject',
        name: 'pfc_n_crypterobject',
        kind: EntityKind.Type,
        uri: 'file:///pfc_n_crypterobject.sru',
        line: 0,
        character: 0,
        baseTypeName: 'crypterobject'
      }
    ]);
    kb.endBatchUpdate();

    const inspection = buildHierarchyInspection('pfc_n_crypterobject', graph, kb, catalog);

    assert.equal(inspection.immediateAncestor, 'crypterobject');
    assert.equal(inspection.immediateAncestorDescriptor?.name, 'crypterobject');
    assert.equal(inspection.immediateAncestorDescriptor?.isSystemType, true);
    assert.deepEqual(inspection.ancestorDescriptors.map((entry) => entry.name), ['crypterobject', 'powerobject']);
    assert.equal(inspection.ancestorDescriptors[0]?.isSystemType, true);
    assert.equal(inspection.ancestorDescriptors[1]?.isSystemType, true);
  });
});