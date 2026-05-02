import * as assert from 'assert';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { Entity, EntityKind } from '../../../src/server/knowledge/types';

suite('server/knowledge/resolution/InheritanceGraph', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    // Mock Entities
    const mockEntities: Entity[] = [
      { id: 'window', name: 'window', kind: EntityKind.Type, uri: 'file:///sys', line: 0, character: 0 },
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, baseTypeName: 'window', uri: 'file:///w_base.srw', line: 0, character: 0 },
      { id: 'w_sheet', name: 'w_sheet', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_sheet.srw', line: 0, character: 0 },
      { id: 'w_employee', name: 'w_employee', kind: EntityKind.Type, baseTypeName: 'w_sheet', uri: 'file:///w_employee.srw', line: 0, character: 0 },
      
      // Members of w_base
      { id: 'of_init', name: 'of_init', kind: EntityKind.Function, containerName: 'w_base', access: 'protected', uri: 'file:///w_base.srw', line: 10, character: 0 },
      { id: 'ib_flag', name: 'ib_flag', kind: EntityKind.Variable, containerName: 'w_base', access: 'private', uri: 'file:///w_base.srw', line: 12, character: 0 },
      
      // Members of w_employee
      { id: 'of_load', name: 'of_load', kind: EntityKind.Function, containerName: 'w_employee', uri: 'file:///w_employee.srw', line: 20, character: 0 },
      // Override of of_init in w_employee
      { id: 'of_init', name: 'of_init', kind: EntityKind.Function, containerName: 'w_employee', uri: 'file:///w_employee.srw', line: 25, character: 0 }
    ];

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///sys', [mockEntities[0]]);
    kb.upsertDocument('file:///w_base.srw', [mockEntities[1], mockEntities[4], mockEntities[5]]);
    kb.upsertDocument('file:///w_sheet.srw', [mockEntities[2]]);
    kb.upsertDocument('file:///w_employee.srw', [mockEntities[3], mockEntities[6], mockEntities[7]]);
    kb.endBatchUpdate();
  });

  test('getAncestors resuelve la cadena hacia arriba', () => {
    const ancestors = graph.getAncestors('w_employee');
    assert.deepStrictEqual(ancestors, ['w_sheet', 'w_base', 'window', 'powerobject']);
  });

  test('getAncestors completa ancestros nativos runtime aunque no estén en KB', () => {
    const ancestors = graph.getAncestors('window');
    assert.deepStrictEqual(ancestors, ['powerobject']);
  });

  test('getTypeHierarchy devuelve el propio objeto y sus ancestros', () => {
    const hierarchy = graph.getTypeHierarchy('w_employee');
    assert.deepStrictEqual(hierarchy, ['w_employee', 'w_sheet', 'w_base', 'window', 'powerobject']);
  });

  test('getTypeDistance calcula distancias correctamente', () => {
    assert.strictEqual(graph.getTypeDistance('w_employee', 'w_employee'), 0);
    assert.strictEqual(graph.getTypeDistance('w_employee', 'w_sheet'), 1);
    assert.strictEqual(graph.getTypeDistance('w_employee', 'w_base'), 2);
    assert.strictEqual(graph.getTypeDistance('w_employee', 'window'), 3);
    assert.strictEqual(graph.getTypeDistance('w_employee', 'powerobject'), 4);
    assert.strictEqual(graph.getTypeDistance('w_employee', 'w_unknown'), Number.POSITIVE_INFINITY);
  });

  test('getMembers incluye los miembros heredados y los locales', () => {
    const members = graph.getMembers('w_employee');
    
    // Debería tener ib_flag (w_base), of_load (w_employee) y dos of_init (w_base y w_employee)
    assert.strictEqual(members.length, 4);

    const names = members.map(m => m.name);
    assert.ok(names.includes('ib_flag'));
    assert.ok(names.includes('of_load'));
    assert.ok(names.filter(n => n === 'of_init').length === 2);
  });

  test('getMemberClosure precalcula relacion, distancia y accesibilidad', () => {
    const closure = graph.getMemberClosure('w_employee');
    const inheritedFlag = closure.find((entry) => entry.entity.name === 'ib_flag');
    const inheritedInit = closure.find((entry) => entry.entity.name === 'of_init' && entry.declaredIn === 'w_base');
    const overrideInit = closure.find((entry) => entry.entity.name === 'of_init' && entry.declaredIn === 'w_employee');

    assert.ok(inheritedFlag);
    assert.strictEqual(inheritedFlag?.relation, 'inherited');
    assert.strictEqual(inheritedFlag?.distance, 2);
    assert.strictEqual(inheritedFlag?.accessible, false);
    assert.strictEqual(inheritedFlag?.overriddenByCurrentType, false);

    assert.ok(inheritedInit);
    assert.strictEqual(inheritedInit?.relation, 'inherited');
    assert.strictEqual(inheritedInit?.accessible, true);
    assert.strictEqual(inheritedInit?.overriddenByCurrentType, true);

    assert.ok(overrideInit);
    assert.strictEqual(overrideInit?.relation, 'override');
    assert.strictEqual(overrideInit?.distance, 0);
    assert.strictEqual(overrideInit?.accessible, true);
  });

  test('Las cachés se limpian automáticamente cuando KnowledgeBase cambia', () => {
    const initialAncestors = graph.getAncestors('w_employee');
    assert.strictEqual(initialAncestors.length, 4);

    // Simulamos que w_sheet ahora hereda de w_new_base
    const newSheetEntity: Entity = { 
      id: 'w_sheet', name: 'w_sheet', kind: EntityKind.Type, baseTypeName: 'w_new_base', uri: 'file:///w_sheet.srw', line: 0, character: 0 
    };
    kb.upsertDocument('file:///w_sheet.srw', [newSheetEntity]);

    const newAncestors = graph.getAncestors('w_employee');
    // w_new_base sigue sin definición local, así que la cadena se completa solo con ancestros nativos conocidos del runtime.
    assert.deepStrictEqual(newAncestors, ['w_sheet', 'w_new_base']);
  });
});
