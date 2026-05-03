import * as assert from 'assert/strict';

import type { ApiCurrentObjectContext } from '../../../src/shared/publicApi';
import { buildCurrentObjectContextPanelModel } from '../../../src/client/currentObjectContextPanelModel';

suite('unit/currentObjectContextPanelModel (B215)', () => {
  function createContext(): ApiCurrentObjectContext {
    return {
      available: true,
      uri: 'file:///proj/lib_app.pbl/w_context.srw',
      objectInfo: {
        uri: 'file:///proj/lib_app.pbl/w_context.srw',
        globalType: 'w_context',
        baseType: 'w_context_base',
        project: 'file:///proj/app.pbt',
        library: 'file:///proj/lib_app.pbl',
        sourceOrigin: 'pbl-folder-source',
        readiness: 'nearby-semantic-ready',
      },
      projectContext: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
      ancestorChain: [
        { name: 'w_context_base', uri: 'file:///proj/lib_app.pbl/w_context_base.sru' },
        { name: 'window', isSystemType: true },
      ],
      visibleVariables: [
        {
          name: 'ids_orders',
          uri: 'file:///proj/lib_app.pbl/w_context.srw',
          line: 14,
          character: 2,
          datatype: 'datastore',
          scope: 'Local',
          relation: 'own',
        },
        {
          name: 'ii_base_counter',
          uri: 'file:///proj/lib_app.pbl/w_context_base.sru',
          line: 5,
          character: 0,
          datatype: 'integer',
          scope: 'Instancia',
          relation: 'inherited',
        }
      ],
      members: {
        functions: [
          {
            name: 'of_build',
            kind: 'Function',
            uri: 'file:///proj/lib_app.pbl/w_context.srw',
            line: 13,
            character: 0,
            relation: 'own',
          }
        ],
        events: [
          {
            name: 'create',
            kind: 'Event',
            uri: 'file:///proj/lib_app.pbl/w_context.srw',
            line: 10,
            character: 0,
            relation: 'own',
          }
        ],
        prototypes: [
          {
            name: 'of_only_proto',
            kind: 'Function',
            uri: 'file:///proj/lib_app.pbl/w_context.srw',
            line: 5,
            character: 0,
            relation: 'own',
            isPrototype: true,
          }
        ],
      },
      diagnostics: {
        total: 1,
        byCode: { SDX: 1 },
        bySeverity: { warning: 1 },
        items: [
          {
            message: 'warning demo',
            code: 'SDX',
            severity: 'warning',
            line: 20,
            character: 4,
          }
        ],
      },
      dataWindowBindings: [
        {
          targetName: 'ids_orders',
          line: 17,
          dataObject: 'd_sales_orders',
          state: 'resolved',
          targetUri: 'file:///proj/lib_app.pbl/d_sales_orders.srd',
          retrieveArguments: [{ name: 'custarg', type: 'number', label: 'custarg:number' }],
        }
      ],
      embeddedSqlAnchors: [
        {
          startLine: 24,
          endLine: 26,
          keyword: 'SELECT',
          preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
          confidence: 'high',
          transactionTarget: 'SQLCA',
        }
      ],
      referencedSymbols: [
        {
          identifier: 'of_inherited',
          line: 22,
          target: {
            name: 'of_inherited',
            kind: 'Function',
            uri: 'file:///proj/lib_app.pbl/w_context_base.sru',
            line: 6,
            character: 0,
          },
          confidence: 'high',
          reasonCode: 'member-hierarchy',
        }
      ],
      relatedFiles: [
        { uri: 'file:///proj/lib_app.pbl/w_context.srw', role: 'active-document' },
        { uri: 'file:///proj/lib_app.pbl/d_sales_orders.srd', role: 'datawindow' },
      ],
      evidence: {
        readiness: 'nearby-semantic-ready',
        primaryReasonCode: 'member-hierarchy',
        resolutionConfidence: 'high',
        evidenceKinds: ['winner-target'],
        targetCount: 1,
      },
    };
  }

  test('proyecta el current object context en secciones navegables', () => {
    const model = buildCurrentObjectContextPanelModel(createContext());

    assert.equal(model.objectName, 'w_context');
    assert.equal(model.focusNodeId, 'summary:object');
    assert.equal(model.roots[0]?.type, 'section');
    assert.equal(model.roots[0]?.label, 'Resumen');
    assert.ok(model.roots.some((node) => node.type === 'section' && node.label === 'Variables visibles'));
    assert.ok(model.roots.some((node) => node.type === 'section' && node.label === 'Members'));
    assert.ok(model.roots.some((node) => node.type === 'section' && node.label === 'Diagnostics'));
    assert.ok(model.roots.some((node) => node.type === 'section' && node.label === 'Embedded SQL'));
  });

  test('degrada con mensaje honesto cuando no hay contexto disponible', () => {
    const model = buildCurrentObjectContextPanelModel({ available: false, reason: 'sin editor activo' });

    assert.equal(model.roots.length, 0);
    assert.equal(model.message, 'sin editor activo');
  });
});