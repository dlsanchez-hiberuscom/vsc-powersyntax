import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { createSemanticQueryFacade } from '../../../src/server/features/semanticQueryFacade';
import { getQueryConsumerPolicy, type QueryConsumerId } from '../../../src/server/features/queryScopePolicy';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { buildSymbolKey } from '../../../src/server/knowledge/symbolKey';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import type { Entity } from '../../../src/server/knowledge/types';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/semanticQueryFacade', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let systemCatalog: SystemCatalog;
  let setDataEntity: Entity;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    systemCatalog = new SystemCatalog();

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      {
        id: 'of_base',
        name: 'of_Base',
        kind: EntityKind.Function,
        containerName: 'w_base',
        uri: 'file:///w_base.sru',
        line: 4,
        character: 2,
        signature: 'public function integer of_Base() returns integer',
        parameters: [],
        returnType: 'integer',
      },
    ]);
    setDataEntity = {
      id: 'of_setdata_main',
      name: 'of_SetData',
      kind: EntityKind.Function,
      containerName: 'w_main',
      fileObjectName: 'w_main',
      uri: 'file:///w_main.sru',
      line: 6,
      character: 2,
      signature: 'public function integer of_SetData(string as_value) returns integer',
      parameters: [{ label: 'string as_value' }],
      parameterCount: 1,
      returnType: 'integer',
      implementationKind: 'function',
      declarationScope: 'member',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'solution-source',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    };

    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      {
        id: 'inv_service',
        name: 'inv_service',
        kind: EntityKind.Variable,
        datatype: 'n_service',
        containerName: 'w_main',
        fileObjectName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 2,
        character: 2,
        scope: 'Instancia',
        declarationScope: 'member',
        implementationKind: 'instance-var',
      },
      setDataEntity,
    ]);
    kb.endBatchUpdate();
  });

  test('resolveTargetSymbol materializa identityKey y shape canonica sobre el facade read-only', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_SetData("x")');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });

    const resolved = facade.resolveTargetSymbol(document, Position.create(0, 5), {
      consumer: 'definition',
      traceLabel: 'semantic-facade-test',
    });

    assert.equal(resolved.confidence, 'high');
    assert.deepEqual(resolved.reasonCodes, ['member-hierarchy']);
    assert.equal(resolved.targetCount, 1);
    assert.equal(resolved.symbols[0].identity, setDataEntity.id);
    assert.equal(resolved.symbols[0].identityKey, buildSymbolKey(setDataEntity));
    assert.equal(resolved.symbols[0].name, 'of_SetData');
    assert.equal(resolved.symbols[0].normalizedName, setDataEntity.id);
    assert.equal(resolved.symbols[0].signature, setDataEntity.signature);
    assert.equal(resolved.symbols[0].parameterCount, 1);
    assert.equal(resolved.symbols[0].returnType, 'integer');
    assert.equal(resolved.symbols[0].implementationKind, 'function');
    assert.equal(resolved.symbols[0].declarationScope, 'member');
    assert.equal(resolved.symbols[0].fileObjectName, 'w_main');
    assert.equal(resolved.symbols[0].sourceOrigin, 'solution-source');
    assert.equal(resolved.symbols[0].owner, 'w_main');
  });

  test('resolveReceiverType centraliza receiver statico de instancia y unknown honesto', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'inv_service.of_Do()');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });

    assert.deepEqual(facade.resolveReceiverType(document, 'inv_service', Position.create(0, 4)), {
      expression: 'inv_service',
      ownerType: 'n_service',
      confidence: 'high',
      reasonCodes: ['qualifier-type'],
    });
    assert.deepEqual(facade.resolveReceiverType(document, 'dynamic_value', Position.create(0, 4)), {
      expression: 'dynamic_value',
      ownerType: null,
      confidence: 'unknown',
      reasonCodes: [],
    });
  });

  test('resolveCallable y resolveInheritance reutilizan owners existentes sin modelo paralelo', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_SetData("x")');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });

    const callables = facade.resolveCallable(document, Position.create(0, 5), { consumer: 'signature-help' });
    assert.equal(callables.length, 1);
    assert.equal(callables[0].symbol.identityKey, buildSymbolKey(setDataEntity));
    assert.equal(callables[0].symbol.name, 'of_SetData');
    assert.deepEqual(callables[0].parameterLabels, ['string as_value']);
    assert.equal(callables[0].returnType, 'integer');

    const inheritance = facade.resolveInheritance('w_main');
    assert.deepEqual(inheritance.ancestors, ['w_base']);
    assert.ok(inheritance.memberClosure.some((entry) => entry.entity.name === 'of_Base' && entry.relation === 'inherited'));
  });

  test('resolveTarget refleja policy efectiva, budget, cap e identificador por consumer', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'this.of_SetData("x")');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });
    const position = Position.create(0, document.getText().indexOf('of_SetData') + 1);
    const consumers: QueryConsumerId[] = [
      'hover',
      'completion',
      'references',
      'rename',
      'diagnostics-unresolved-callable',
    ];

    for (const consumer of consumers) {
      const result = facade.resolveTarget(document, position, { consumer, traceLabel: consumer });
      const policy = getQueryConsumerPolicy(consumer);

      assert.equal(result.query.consumer, consumer);
      assert.equal(result.query.identifier, 'of_SetData');
      assert.equal(result.query.qualifier, 'this');
      assert.deepEqual(result.query.sourceOriginPolicy, {
        allowStaging: policy.allowStaging,
        allowGenerated: policy.allowGenerated,
        allowExternal: policy.allowExternal,
      });
      assert.equal(result.query.budgetMs, policy.budgetMs);
      assert.equal(result.query.resultCap, policy.resultCap);
    }

    const labelOnly = facade.resolveTarget(document, position, { traceLabel: 'hover' });
    assert.equal(labelOnly.query.consumer, 'hover');
    assert.equal(labelOnly.query.budgetMs, getQueryConsumerPolicy('hover').budgetMs);
  });

  test('expone enum context y built-ins catalog owner-aware desde SystemCatalog', () => {
    const document = TextDocument.create('file:///n_enum_context.sru', 'powerbuilder', 1, 'FileSeek(li_file, 0, Fro');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });

    const enumContext = facade.resolveExpectedEnumContext(document, Position.create(0, document.getText().length));
    assert.equal(enumContext?.enumTypeName, 'SeekType');
    assert.equal(enumContext?.confidence, 'high');

    const fileSeek = facade.resolveCatalogCallable('FileSeek');
    assert.equal(fileSeek?.name, 'FileSeek');
  });

  test('no hace IO ni full parse al resolver sobre contexto ya publicado', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_SetData("x")');
    const facade = createSemanticQueryFacade({ kb, graph, systemCatalog });
    const nodeFs = require('node:fs') as typeof import('node:fs');
    const documentAnalysisModule = require('../../../src/server/analysis/documentAnalysis') as typeof import('../../../src/server/analysis/documentAnalysis');
    const originalReadFileSync = nodeFs.readFileSync;
    const originalReaddirSync = nodeFs.readdirSync;
    const originalAnalyzeDocument = documentAnalysisModule.analyzeDocument;
    let fsCalls = 0;
    let analyzeCalls = 0;

    nodeFs.readFileSync = ((...args: Parameters<typeof nodeFs.readFileSync>) => {
      fsCalls++;
      return originalReadFileSync(...args);
    }) as typeof nodeFs.readFileSync;
    nodeFs.readdirSync = ((...args: Parameters<typeof nodeFs.readdirSync>) => {
      fsCalls++;
      return originalReaddirSync(...args);
    }) as typeof nodeFs.readdirSync;
    documentAnalysisModule.analyzeDocument = ((...args: Parameters<typeof originalAnalyzeDocument>) => {
      analyzeCalls++;
      return originalAnalyzeDocument(...args);
    }) as typeof documentAnalysisModule.analyzeDocument;

    try {
      const resolved = facade.resolveTargetSymbol(document, Position.create(0, 5), { consumer: 'definition' });
      assert.equal(resolved.targetCount, 1);
    } finally {
      nodeFs.readFileSync = originalReadFileSync;
      nodeFs.readdirSync = originalReaddirSync;
      documentAnalysisModule.analyzeDocument = originalAnalyzeDocument;
    }

    assert.equal(fsCalls, 0);
    assert.equal(analyzeCalls, 0);
  });
});