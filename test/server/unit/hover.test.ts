import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { provideHover } from '../../../src/server/features/hover';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/hover', () => {
  let kb: KnowledgeBase;
  let catalog: SystemCatalog;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    kb.upsertDocument('file:///w_main.sru', [
      {
        id: 'w_main',
        name: 'w_main',
        kind: EntityKind.Type,
        uri: 'file:///w_main.sru',
        line: 0,
        character: 0
      },
      {
        id: 'of_setdata',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 10,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    kb.upsertDocument('file:///w_ambiguous.sru', [
      {
        id: 'w_ambiguous',
        name: 'w_ambiguous',
        kind: EntityKind.Type,
        uri: 'file:///w_ambiguous.sru',
        line: 0,
        character: 0
      },
      {
        id: 'of_ambiguous_a',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_ambiguous',
        uri: 'file:///w_ambiguous.sru',
        line: 10,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      },
      {
        id: 'of_ambiguous_b',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_ambiguous',
        uri: 'file:///w_ambiguous.sru',
        line: 20,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    catalog = new SystemCatalog();
    graph = new InheritanceGraph(kb);
  });

  test('provideHover devuelve Markdown oficial para funcion de sistema', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  MessageBox("Hola", "Mundo")  ');
    
    // Position sobre MessageBox
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    
    assert.ok(hover, 'Hover no debería ser null');
    assert.equal((hover?.contents as any).kind, 'markdown');
    
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('MessageBox'), 'Debe contener el nombre de la función');
    assert.ok(value.includes('docs.appeon.com'), 'Debe contener el enlace oficial de la documentación');
    assert.ok(value.includes('*Origen:* system'), 'Debe incluir lineage de sistema');
    assert.ok(value.includes('*Confianza:* direct'), 'Debe incluir confianza derivada');
  });

  test('provideHover devuelve Markdown de KnowledgeBase para función de usuario', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    // Position sobre of_SetData
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    
    assert.ok(hover, 'Hover no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('of_SetData'), 'Debe contener el nombre de la función');
    assert.ok(value.includes('*Origen:* document'), 'Debe exponer lineage del símbolo de usuario');
    assert.ok(value.includes('*Confianza:* direct'), 'Debe indicar confianza directa');
    assert.ok(value.includes('*Confianza de resolución:* low'), 'Debe proyectar la confidence general de resolución');
    assert.ok(value.includes('*Motivo de resolución:* global-fallback'), 'Debe proyectar el reason code principal');
    assert.ok(value.includes('*Candidatos ganadores:* 1'), 'Debe proyectar la cardinalidad del winner path');
  });

  test('provideHover devuelve null si no es un identificador valido', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  ==  ');
    const hover = provideHover(doc, Position.create(0, 2), kb, catalog, graph);
    assert.equal(hover, null);
  });

  test('provideHover devuelve null si el identificador no existe en ningún lado', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  una_funcion_random()  ');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    assert.equal(hover, null);
  });

  test('provideHover anota la ambiguedad cuando existen varios ganadores minimos', () => {
    const doc = TextDocument.create('file:///w_ambiguous.sru', 'powerbuilder', 1, '  of_Ambiguous()  ');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);

    assert.ok(hover, 'Hover ambiguo no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('*Resolución ambigua:* 2 candidatos con distancia mínima'), 'Debe indicar la ambigüedad del winner path');
    assert.ok(value.includes('*Candidatos ganadores:* 2'), 'Debe proyectar la cardinalidad del winner path ambiguo');
  });
});