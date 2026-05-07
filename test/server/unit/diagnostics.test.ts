import * as assert from 'assert/strict';

import { DiagnosticSeverity, type Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  clearDiagnosticsSummary,
  getDiagnosticsSummary,
  publishDiagnostics,
  validateStructure,
  validateSemantics,
} from '../../../src/server/features/diagnostics';
import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import { DIAGNOSTIC_SOURCE } from '../../../src/shared/types';
import { loadFixture } from '../helpers/fixtureLoader';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';
import { setAnalysisBackends, clearDocumentAnalysisCache } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import type { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/diagnostics', () => {
  let kb: KnowledgeBase;
  let systemCatalog: SystemCatalog;
  let inheritanceGraph: InheritanceGraph;
  let documentCache: DocumentCache;

  setup(() => {
    kb = new KnowledgeBase();
    systemCatalog = new SystemCatalog();
    inheritanceGraph = new InheritanceGraph(kb);
    documentCache = new DocumentCache();
    setAnalysisBackends(documentCache, kb);
  });

  teardown(() => {
    clearDocumentAnalysisCache();
    clearDiagnosticsSummary();
  });

  test('validateStructure no devuelve errores en estructura simple válida', () => {
    const validSource = [
      'forward',
      'end forward',
      '',
      'forward prototypes',
      'end prototypes',
      '',
      'type variables',
      'end variables'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///valid.sru',
      'powerbuilder',
      1,
      validSource
    );

    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0);
  });

  test('validateStructure detecta bloque sin cierre', () => {
    const invalidSource = loadFixture('basic/sample_invalid.sru');
    const document = TextDocument.create(
      'file:///invalid.sru',
      'powerbuilder',
      1,
      invalidSource
    );

    const diagnostics = validateStructure(document);

    assert.ok(diagnostics.length > 0);
    assert.equal(diagnostics[0].source, DIAGNOSTIC_SOURCE);
    assert.match(diagnostics[0].message, /cerrado correctamente/i);
  });

  test('validateSemantics detecta las reglas implementadas (SD2-SD5)', () => {
    const source = loadFixture('diagnostics_semantic.srw');
    const document = TextDocument.create(
      'file:///diagnostics_semantic.srw',
      'powerbuilder',
      1,
      source
    );

    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    // Deben detectarse:
    // SD2: of_nonexistent_function, of_also_missing
    // SD3: (no hay tipo base inexistente aquí, window es builtin)
    // SD4: ls_unused_local
    // SD5: is_unused_var
    // (SD1 está diferida hasta resolución fuerte; ver specs/010-diagnosticos-semanticos.)

    assert.ok(diagnostics.length > 0);

    const messages = diagnostics.map(d => d.message);
    const hasUnusedLocal = messages.some(m => m.includes("La variable local 'ls_unused_local' está declarada pero no se usa."));
    const hasUnusedPrivate = messages.some(m => m.includes("La variable de instancia privada 'is_unused_var' no se usa en ningún método o evento del archivo."));
    const hasUnknownFunc = messages.some(m => m.includes("La función 'of_nonexistent_function' no se encuentra"));
    const hasUnknownFunc2 = messages.some(m => m.includes("La función 'of_also_missing' no se encuentra"));
    const unknownFuncDiagnostic = diagnostics.find(d => d.message.includes("La función 'of_nonexistent_function' no se encuentra"));

    assert.ok(hasUnusedLocal, 'No se detectó variable local no usada');
    assert.ok(hasUnusedPrivate, 'No se detectó variable privada no usada');
    assert.ok(hasUnknownFunc, 'No se detectó función no existente');
    assert.ok(hasUnknownFunc2, 'No se detectó segunda función no existente');
    assert.equal(unknownFuncDiagnostic?.code, DIAGNOSTIC_CODES.sd2UnresolvedCallable);
    assert.deepEqual(unknownFuncDiagnostic?.data, {
      kind: 'semantic-evidence',
      confidence: 'low',
      reasonCodes: [],
      evidenceKinds: [],
      targetCount: 0,
      candidateCount: 0,
      hasAmbiguity: false
    });
  });

  test('validateSemantics proyecta evidence del query engine en SD2 con qualifier semántico', () => {
    const source = [
      'global type w_base from window',
      'end type',
      '',
      'global type w_child from w_base',
      'public function integer of_test ()',
      '  super.of_missing()',
      '  return 0',
      'end function',
      'end type'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_evidence.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missing = diagnostics.find(d => d.message.includes("La función 'of_missing' no se encuentra"));

    assert.ok(missing, 'Esperaba un SD2 para super.of_missing().');
    assert.deepEqual(missing?.data, {
      kind: 'semantic-evidence',
      confidence: 'low',
      reasonCodes: [],
      evidenceKinds: ['discarded-context'],
      targetCount: 0,
      candidateCount: 0,
      hasAmbiguity: false
    });
  });

  test('validateSemantics informa dependencias nativas externas sin implementación interna', () => {
    const source = [
      'global type w_native from window',
      'end type',
      'forward prototypes',
      'public function long of_external (string as_input) library "kernel32.dll" alias for "OfExternal";',
      'end prototypes'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_external.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const external = diagnostics.find((diag) => diag.message.includes("La declaración externa 'of_external'"));

    assert.ok(external, 'Esperaba un diagnóstico informativo para la external function.');
    assert.equal(external?.severity, DiagnosticSeverity.Information);
    assert.equal(external?.code, DIAGNOSTIC_CODES.nativeDependency);
    assert.deepEqual(external?.data, {
      kind: 'native-dependency',
      dependencyKind: 'dll',
      library: 'kernel32.dll',
      alias: 'OfExternal',
      externalCallableKind: 'library'
    });
  });

  test('validateSemantics informa declaraciones RPCFUNC sin implementación interna', () => {
    const source = [
      'global type u_tx from transaction',
      'end type',
      'forward prototypes',
      'public subroutine sp_update_status(long al_id, string as_status) rpcfunc alias for "sp_update_status";',
      'end prototypes'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_rpcfunc.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const external = diagnostics.find((diag) => diag.message.includes("La declaración RPCFUNC 'sp_update_status'"));

    assert.ok(external, 'Esperaba un diagnóstico informativo para la declaración RPCFUNC.');
    assert.equal(external?.severity, DiagnosticSeverity.Information);
    assert.equal(external?.code, DIAGNOSTIC_CODES.nativeDependency);
    assert.deepEqual(external?.data, {
      kind: 'native-dependency',
      dependencyKind: 'rpcfunc',
      library: undefined,
      alias: 'sp_update_status',
      externalCallableKind: 'rpcfunc'
    });
  });

  test('validateSemantics avisa si un valor enumerado no coincide con el contexto esperado', () => {
    const source = [
      'global type w_enum_diagnostics from window',
      '  multilineedit mle_1',
      'end type',
      '',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      '',
      'public subroutine of_test()',
      '  integer li_file',
      '  mle_1.Alignment = FromBeginning!',
      '  FileSeek(li_file, 0, Left!)',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_enum_context.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const enumDiagnostics = diagnostics.filter((diag) => diag.code === DIAGNOSTIC_CODES.enumValueContextMismatch);

    assert.equal(enumDiagnostics.length, 2);
    assert.ok(enumDiagnostics.some((diag) => diag.message.includes("'FromBeginning!'") && diag.message.includes("'Alignment'")));
    assert.ok(enumDiagnostics.some((diag) => diag.message.includes("'Left!'") && diag.message.includes("'SeekType'")));
    assert.equal((enumDiagnostics[0]?.data as { kind?: string } | undefined)?.kind, 'enumerated-value-context');
  });

  test('validateSemantics respeta restricciones por owner y member calls en contextos enumerados', () => {
    const source = [
      'global type w_enum_owner_diagnostics from window',
      '  multilineedit mle_1',
      '  datawindow ids_orders',
      'end type',
      '',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      '',
      'public subroutine of_test()',
      '  mle_1.Alignment = PDFTextAlignRight!',
      '  ids_orders.RowsMove(1, 1, FromBeginning!, ids_orders, 1, Primary!)',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_enum_owner_context.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const enumDiagnostics = diagnostics.filter((diag) => diag.code === DIAGNOSTIC_CODES.enumValueContextMismatch);

    assert.equal(enumDiagnostics.length, 2);
    assert.ok(enumDiagnostics.some((diag) => diag.message.includes("'PDFTextAlignRight!'") && diag.message.includes("mle_1.Alignment")));
    assert.ok(enumDiagnostics.some((diag) => diag.message.includes("'FromBeginning!'") && diag.message.includes("'DWBuffer'")));
  });

  test('validateSemantics avisa si create no llama a super::create teniendo ancestro', () => {
    kb.upsertDocument('file:///w_base_lifecycle.srw', [
      {
        id: 'w_base_lifecycle',
        name: 'w_base_lifecycle',
        kind: EntityKind.Type,
        uri: 'file:///w_base_lifecycle.srw',
        line: 0,
        character: 0,
        baseTypeName: 'window'
      }
    ]);

    const source = [
      'global type w_child_lifecycle from w_base_lifecycle',
      'end type',
      '',
      'on w_child_lifecycle.create',
      '  TriggerEvent(this, "constructor")',
      'end on',
      '',
      'event constructor;',
      'end event'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_lifecycle_missing_super.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missingSuper = diagnostics.find((diag) => diag.message.includes("no llama a super::create"));

    assert.ok(missingSuper, 'Esperaba un warning lifecycle por falta de super::create.');
    assert.equal(missingSuper?.severity, DiagnosticSeverity.Warning);
    assert.equal(missingSuper?.code, 'missing-super-create');
    assert.deepEqual(missingSuper?.data, {
      kind: 'lifecycle-warning',
      code: 'missing-super-create',
      phase: 'create',
      focusType: 'w_child_lifecycle'
    });
  });

  test('validateSemantics avisa si create declara constructor pero no lo dispara', () => {
    const source = [
      'global type w_lifecycle_missing_trigger from window',
      'end type',
      '',
      'on w_lifecycle_missing_trigger.create',
      '  call super::create',
      'end on',
      '',
      'event constructor;',
      'end event'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_lifecycle_missing_trigger.srw', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missingTrigger = diagnostics.find((diag) => diag.message.includes("declara el hook 'constructor' pero no lo dispara"));

    assert.ok(missingTrigger, 'Esperaba un warning lifecycle por constructor no disparado.');
    assert.equal(missingTrigger?.severity, DiagnosticSeverity.Warning);
    assert.equal(missingTrigger?.code, 'missing-trigger-constructor');
    assert.deepEqual(missingTrigger?.data, {
      kind: 'lifecycle-warning',
      code: 'missing-trigger-constructor',
      phase: 'create',
      focusType: 'w_lifecycle_missing_trigger'
    });
  });

  test('validateSemantics no avisa sobre boilerplate lifecycle de definicion PB con ancestro directo', () => {
    kb.upsertDocument('file:///n_base.sru', [
      {
        id: 'n_base',
        name: 'n_base',
        kind: EntityKind.Type,
        uri: 'file:///n_base.sru',
        line: 0,
        character: 0,
        baseTypeName: 'pfc_n_base'
      }
    ]);

    const source = [
      'forward',
      'global type pfc_n_cst_baseattrib from n_base',
      'end type',
      'end forward',
      '',
      'global type pfc_n_cst_baseattrib from n_base',
      'end type',
      'global pfc_n_cst_baseattrib pfc_n_cst_baseattrib',
      '',
      'on pfc_n_cst_baseattrib.create',
      '  TriggerEvent( this, "constructor" )',
      'end on',
      '',
      'on pfc_n_cst_baseattrib.destroy',
      '  TriggerEvent( this, "destructor" )',
      'end on'
    ].join('\r\n');

    const document = TextDocument.create('file:///pfc_n_cst_baseattrib.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.equal(
      diagnostics.some((diag) => diag.data?.kind === 'lifecycle-warning'),
      false,
      'El boilerplate create/destroy de un objeto PB no debería generar warnings lifecycle.'
    );
  });

  test('validateSemantics no avisa sobre boilerplate lifecycle autoinstantiate sin hook explicito', () => {
    kb.upsertDocument('file:///n_cst_baseattrib.sru', [
      {
        id: 'n_cst_baseattrib',
        name: 'n_cst_baseattrib',
        kind: EntityKind.Type,
        uri: 'file:///n_cst_baseattrib.sru',
        line: 0,
        character: 0,
        baseTypeName: 'n_base'
      }
    ]);

    const source = [
      'forward',
      'global type pfc_n_cst_calculatorattrib from n_cst_baseattrib',
      'end type',
      'end forward',
      '',
      'global type pfc_n_cst_calculatorattrib from n_cst_baseattrib autoinstantiate',
      'end type',
      '',
      'on pfc_n_cst_calculatorattrib.create',
      '  TriggerEvent( this, "constructor" )',
      'end on',
      '',
      'on pfc_n_cst_calculatorattrib.destroy',
      '  TriggerEvent( this, "destructor" )',
      'end on'
    ].join('\r\n');

    const document = TextDocument.create('file:///pfc_n_cst_calculatorattrib.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.equal(
      diagnostics.some((diag) => diag.data?.kind === 'lifecycle-warning'),
      false,
      'La variante autoinstantiate con create/destroy estructural no debería generar warnings lifecycle.'
    );
  });

  test('validateSemantics no marca el tipo base como ausente cuando n_base ya está indexado', () => {
    kb.upsertDocument('file:///proj/pfc libs/pfemain.pbl/n_base.sru', [
      {
        id: 'n_base',
        name: 'n_base',
        kind: EntityKind.Type,
        uri: 'file:///proj/pfc libs/pfemain.pbl/n_base.sru',
        line: 0,
        character: 0,
        baseTypeName: 'pfc_n_base'
      }
    ]);

    const source = [
      'forward',
      'global type pfc_n_cst_baseattrib from n_base',
      'end type',
      'end forward',
      '',
      'global type pfc_n_cst_baseattrib from n_base',
      'end type',
      'global pfc_n_cst_baseattrib pfc_n_cst_baseattrib'
    ].join('\r\n');

    const document = TextDocument.create('file:///proj/pfc libs/pfcmain.pbl/pfc_n_cst_baseattrib.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.equal(
      diagnostics.some((diag) => diag.message.includes("El tipo base 'n_base' no se encuentra")),
      false,
      'Si n_base ya está en KB no debería emitirse el warning de tipo base ausente.'
    );
  });

  test('validateSemantics acepta ancestros nativos del catálogo como crypterobject', () => {
    const source = [
      'forward',
      'global type pfc_n_crypterobject from crypterobject',
      'end type',
      'end forward',
      '',
      'global type pfc_n_crypterobject from crypterobject',
      'end type',
      'global pfc_n_crypterobject pfc_n_crypterobject',
      '',
      'type variables',
      'Protected:',
      'boolean        ib_IsObsolete',
      'end variables',
      '',
      'forward prototypes',
      'protected function integer of_messagebox (string as_id, string as_title, string as_text, icon ae_icon, button ae_button, integer ai_default)',
      'end prototypes',
      '',
      'protected function integer of_messagebox (string as_id, string as_title, string as_text, icon ae_icon, button ae_button, integer ai_default);',
      'Return MessageBox(as_title, as_text, ae_icon, ae_button, ai_default)',
      'end function',
      '',
      'on pfc_n_crypterobject.create',
      'call super::create',
      'TriggerEvent( this, "constructor" )',
      'end on',
      '',
      'on pfc_n_crypterobject.destroy',
      'TriggerEvent( this, "destructor" )',
      'call super::destroy',
      'end on'
    ].join('\r\n');

    const document = TextDocument.create('file:///pfc_n_crypterobject.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.equal(
      diagnostics.some((diag) => diag.message.includes("El tipo base 'crypterobject' no se encuentra")),
      false,
      'Los ancestros nativos conocidos no deben marcarse como tipo base ausente.'
    );
  });

  test('validateSemantics acepta base types oficiales generados como windowobject', () => {
    const source = [
      'forward',
      'global type n_generated_base from windowobject',
      'end type',
      'end forward',
      '',
      'global type n_generated_base from windowobject',
      'end type',
      'global n_generated_base n_generated_base'
    ].join('\r\n');

    const document = TextDocument.create('file:///generated_windowobject_base.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.equal(
      diagnostics.some((diag) => diag.message.includes("El tipo base 'windowobject' no se encuentra")),
      false,
      'Los base types oficiales generados no deben marcarse como ausentes.'
    );
  });

  test('validateSemantics mantiene SD3 para typos cercanos de base types oficiales', () => {
    const source = [
      'forward',
      'global type n_generated_typo from windowobject_typo',
      'end type',
      'end forward',
      '',
      'global type n_generated_typo from windowobject_typo',
      'end type',
      'global n_generated_typo n_generated_typo'
    ].join('\r\n');

    const document = TextDocument.create('file:///generated_windowobject_typo.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missingBase = diagnostics.find((diag) => diag.message.includes("El tipo base 'windowobject_typo' no se encuentra"));

    assert.ok(missingBase, 'Esperaba SD3 para un typo cercano de windowobject.');
    assert.equal(missingBase?.code, DIAGNOSTIC_CODES.sd3MissingBaseType);
  });

  test('validateSemantics relaciona SetTransObject con variables transaction conocidas', () => {
    const source = [
      'global type n_tx from nonvisualobject',
      'end type',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test()',
      '  transaction ltr_db',
      '  datastore ids_orders',
      '  ids_orders.SetTransObject(&',
      '    ltr_db)',
      '  ids_orders.Retrieve()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_transaction_known.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const transactionDiagnostics = diagnostics.filter((diag) => String(diag.data && (diag.data as { kind?: string }).kind) === 'transaction-binding');

    assert.equal(transactionDiagnostics.length, 0);
  });

  test('validateSemantics acepta SQLCA como transaction global especial en SetTrans', () => {
    const source = [
      'global type n_sqlca from nonvisualobject',
      'end type',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test()',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(SQLCA)',
      '  ids_orders.Update()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_sqlca_known.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const transactionDiagnostics = diagnostics.filter((diag) => String(diag.data && (diag.data as { kind?: string }).kind) === 'transaction-binding');

    assert.equal(transactionDiagnostics.length, 0);
  });

  test('validateSemantics detecta GetChild como member invalido sobre DataWindowChild', () => {
    const source = [
      'global type n_dw_child_diag from nonvisualobject',
      '  datawindowchild idwc_orders',
      'end type',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test()',
      '  idwc_orders.GetChild("orders", idwc_orders)',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_datawindowchild_getchild.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const invalidGetChild = diagnostics.find((diag) => diag.message.includes("La función 'GetChild' no aplica al tipo 'datawindowchild'"));

    assert.ok(invalidGetChild, 'Esperaba un diagnóstico para GetChild sobre DataWindowChild.');
    assert.equal(invalidGetChild?.severity, DiagnosticSeverity.Warning);
    assert.equal(invalidGetChild?.code, DIAGNOSTIC_CODES.sd2UnresolvedCallable);
    assert.deepEqual(invalidGetChild?.data, {
      kind: 'semantic-evidence',
      confidence: 'high',
      reasonCodes: ['owner-mismatch'],
      evidenceKinds: ['owner-mismatch'],
      targetCount: 0,
      candidateCount: 0,
      hasAmbiguity: false,
      qualifier: 'idwc_orders',
      ownerType: 'datawindowchild'
    });
  });

  test('validateSemantics avisa cuando Retrieve no tiene transaction conocida', () => {
    const source = [
      'global type n_tx_missing from nonvisualobject',
      'end type',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test()',
      '  datastore ids_orders',
      '  ids_orders.Retrieve()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_transaction_missing.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missing = diagnostics.find((diag) => diag.message.includes('ids_orders.Retrieve()') && diag.message.includes('transaction object conocido'));

    assert.ok(missing, 'Esperaba un diagnóstico para Retrieve sin transaction conocida.');
    assert.equal(missing?.severity, DiagnosticSeverity.Warning);
    assert.equal(missing?.code, DIAGNOSTIC_CODES.transactionBindingMissing);
    assert.deepEqual(missing?.data, {
      kind: 'transaction-binding',
      state: 'missing',
      confidence: 'low',
      operation: 'Retrieve',
      target: 'ids_orders',
      argument: undefined
    });
  });

  test('validateSemantics avisa cuando un descendiente custom de DataWindow hace Retrieve sin transaction conocida', () => {
    const customDataWindow = TextDocument.create(
      'file:///u_dw_diag_orders.sru',
      'powerbuilder',
      1,
      [
        'global type u_dw_diag_orders from datawindow',
        'end type'
      ].join('\r\n')
    );
    const customAnalysis = analyzeDocument(customDataWindow);
    kb.upsertDocument(
      customDataWindow.uri,
      customAnalysis.semanticFacts,
      customAnalysis.scopes,
      customAnalysis.snapshot
    );

    const source = [
      'global type n_tx_missing_custom from nonvisualobject',
      'end type',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test()',
      '  u_dw_diag_orders idw_orders',
      '  idw_orders.Retrieve()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_transaction_missing_custom_dw.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missing = diagnostics.find((diag) => diag.message.includes('idw_orders.Retrieve()') && diag.message.includes('transaction object conocido'));

    assert.ok(missing, 'Esperaba un diagnóstico para Retrieve sin transaction conocida en un descendiente custom.');
    assert.equal(missing?.severity, DiagnosticSeverity.Warning);
    assert.equal(missing?.code, DIAGNOSTIC_CODES.transactionBindingMissing);
    assert.deepEqual(missing?.data, {
      kind: 'transaction-binding',
      state: 'missing',
      confidence: 'low',
      operation: 'Retrieve',
      target: 'idw_orders',
      argument: undefined
    });
  });

  test('validateSemantics degrada confidence cuando SetTransObject es dinámico', () => {
    const source = [
      'global type n_tx_dynamic from nonvisualobject',
      'end type',
      'forward prototypes',
      'public function transaction of_resolve_tx()',
      'public subroutine of_test()',
      'end prototypes',
      'public function transaction of_resolve_tx();',
      '  transaction ltr_db',
      '  return ltr_db',
      'end function',
      'public subroutine of_test()',
      '  datastore ids_orders',
      '  ids_orders.SetTransObject(of_resolve_tx())',
      '  ids_orders.Update()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_transaction_dynamic.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const dynamic = diagnostics.find((diag) => diag.message.includes('confidence semántica') && diag.message.includes('ids_orders.Update()'));

    assert.ok(dynamic, 'Esperaba un diagnóstico informativo para binding transaccional dinámico.');
    assert.equal(dynamic?.severity, DiagnosticSeverity.Hint);
    assert.equal(dynamic?.code, DIAGNOSTIC_CODES.transactionBindingDynamic);
    assert.deepEqual(dynamic?.data, {
      kind: 'transaction-binding',
      state: 'dynamic',
      confidence: 'low',
      operation: 'Update',
      target: 'ids_orders',
      argument: 'of_resolve_tx('
    });
  });

  test('validateSemantics avisa cuando un DataObject literal no apunta a un .srd conocido', () => {
    const source = [
      'global type w_dw_missing from window',
      'end type',
      'forward prototypes',
      'public subroutine of_bind()',
      'end prototypes',
      'public subroutine of_bind()',
      '  datastore ids_orders',
      '  ids_orders.DataObject = "d_missing_orders"',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dataobject_missing.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missing = diagnostics.find((diag) => diag.message.includes('d_missing_orders') && diag.message.includes('no se encuentra como .srd indexado'));

    assert.ok(missing, 'Esperaba un warning por DataObject literal sin target .srd.');
    assert.equal(missing?.severity, DiagnosticSeverity.Warning);
    assert.equal(missing?.code, DIAGNOSTIC_CODES.dataObjectNotFound);
    assert.deepEqual(missing?.data, {
      kind: 'dataobject-binding',
      state: 'missing',
      confidence: 'medium',
      target: 'ids_orders',
      dataObject: 'd_missing_orders',
      targetCount: 0
    });
  });

  test('validateSemantics enlaza SetTrans, DataObject y Retrieve multilinea con continuaciones &', () => {
    const dataWindowDocument = TextDocument.create(
      'file:///d_sales_orders_multiline.srd',
      'powerbuilder-datawindow',
      1,
      [
        '$PBExportHeader$d_sales_orders_multiline.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) )" arguments=(("custarg", number)) )'
      ].join('\r\n')
    );
    const dataWindowAnalysis = analyzeDocument(dataWindowDocument);
    kb.upsertDocument(
      dataWindowDocument.uri,
      dataWindowAnalysis.semanticFacts,
      dataWindowAnalysis.scopes,
      dataWindowAnalysis.snapshot
    );

    const source = [
      'global type w_dw_multiline from window',
      'end type',
      'forward prototypes',
      'public subroutine of_bind()',
      'end prototypes',
      'public subroutine of_bind()',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(&',
      '    SQLCA)',
      '  ids_orders.DataObject = &',
      '    "d_sales_orders_multiline"',
      '  ids_orders.Retrieve(&',
      '    1, &',
      '    2)',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dataobject_multiline.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const mismatch = diagnostics.find((diag) => diag.message.includes('ids_orders.Retrieve') && diag.message.includes('espera 1 argumento'));
    const transactionDiagnostics = diagnostics.filter((diag) => String(diag.data && (diag.data as { kind?: string }).kind) === 'transaction-binding');

    assert.equal(transactionDiagnostics.length, 0, 'SetTrans multilinea debe seguir dejando el binding transaccional en estado conocido.');
    assert.ok(mismatch, 'Esperaba un warning por aridad incorrecta en Retrieve multilinea enlazado a un DataObject literal.');
    assert.equal(mismatch?.severity, DiagnosticSeverity.Warning);
    assert.equal(mismatch?.code, DIAGNOSTIC_CODES.retrieveArityMismatch);
    assert.deepEqual(mismatch?.data, {
      kind: 'dataobject-retrieve-args',
      confidence: 'high',
      target: 'ids_orders',
      dataObject: 'd_sales_orders_multiline',
      expectedArgumentCount: 1,
      actualArgumentCount: 2,
      expectedArguments: ['number custarg']
    });
  });

  test('validateSemantics degrada confidence cuando el binding de DataObject es dinámico', () => {
    const source = [
      'global type w_dw_dynamic from window',
      'end type',
      'forward prototypes',
      'public function string of_resolve_dw()',
      'public subroutine of_bind()',
      'end prototypes',
      'public function string of_resolve_dw();',
      '  return "d_orders"',
      'end function',
      'public subroutine of_bind()',
      '  datastore ids_orders',
      '  ids_orders.DataObject = of_resolve_dw()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dataobject_dynamic.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const dynamic = diagnostics.find((diag) => diag.message.includes('asignación dinámica de DataObject'));

    assert.ok(dynamic, 'Esperaba un diagnóstico informativo por DataObject dinámico.');
    assert.equal(dynamic?.severity, DiagnosticSeverity.Hint);
    assert.equal(dynamic?.code, DIAGNOSTIC_CODES.dataObjectDynamic);
    assert.deepEqual(dynamic?.data, {
      kind: 'dataobject-binding',
      state: 'dynamic',
      confidence: 'low',
      target: 'ids_orders',
      expression: 'of_resolve_dw()'
    });
  });

  test('validateSemantics avisa cuando una ruta DataWindow completa no es resoluble sobre un root ya enlazado', () => {
    const dataWindowDocument = TextDocument.create(
      'file:///d_parent_path_diag.srd',
      'powerbuilder-datawindow',
      1,
      [
        '$PBExportHeader$d_parent_path_diag.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(retrieve="SELECT parent_id FROM parent")',
      ].join('\r\n')
    );
    const dataWindowAnalysis = analyzeDocument(dataWindowDocument);
    kb.upsertDocument(
      dataWindowDocument.uri,
      dataWindowAnalysis.semanticFacts,
      dataWindowAnalysis.scopes,
      dataWindowAnalysis.snapshot
    );

    const source = [
      'global type w_dw_path_diag from window',
      'end type',
      'forward prototypes',
      'public subroutine of_probe()',
      'end prototypes',
      'public subroutine of_probe()',
      '  datastore dw_parent',
      '  dw_parent.DataObject = "d_parent_path_diag"',
      '  dw_parent.Describe("missing.DataWindow.Table.Select")',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dw_path_missing.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missingPath = diagnostics.find((diag) => diag.message.includes('missing.DataWindow.Table.Select') && diag.message.includes('no es resoluble'));

    assert.ok(missingPath, 'Esperaba un warning por ruta DataWindow no resoluble con root ya enlazado.');
    assert.equal(missingPath?.severity, DiagnosticSeverity.Warning);
    assert.equal(missingPath?.code, DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved);
    assert.deepEqual(missingPath?.data, {
      kind: 'datawindow-property-path',
      confidence: 'medium',
      target: 'dw_parent',
      mode: 'describe',
      path: 'missing.DataWindow.Table.Select'
    });
  });

  test('validateSemantics no inventa diagnóstico de path DataWindow cuando el binding raíz es dinámico', () => {
    const source = [
      'global type w_dw_path_dynamic from window',
      'end type',
      'forward prototypes',
      'public function string of_resolve_dw()',
      'public subroutine of_probe()',
      'end prototypes',
      'public function string of_resolve_dw();',
      '  return "d_parent_path_diag"',
      'end function',
      'public subroutine of_probe()',
      '  datastore dw_parent',
      '  dw_parent.DataObject = of_resolve_dw()',
      '  dw_parent.Describe("missing.DataWindow.Table.Select")',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dw_path_dynamic.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);

    assert.ok(diagnostics.some((diag) => diag.code === DIAGNOSTIC_CODES.dataObjectDynamic), 'Esperaba mantener el diagnóstico informativo por DataObject dinámico.');
    assert.ok(!diagnostics.some((diag) => diag.code === DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved), 'No debe inventar un diagnóstico de path cuando el root no es defendible.');
  });

  test('validateSemantics avisa cuando una expresión DataWindow referencia una dependencia no resoluble en el .srd', () => {
    const document = TextDocument.create(
      'file:///d_expression_diag.srd',
      'powerbuilder-datawindow',
      1,
      [
        '$PBExportHeader$d_expression_diag.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(column=(type=decimal(18,2) update=yes name=adjusted_hours dbname="emp.adjusted_hours")',
        ' column=(type=decimal(18,2) update=yes name=rate dbname="emp.rate") retrieve="SELECT adjusted_hours, rate FROM emp")',
        'compute(band=detail name=cc_total expression="adjusted_hours * missing_rate")',
        'text(band=detail name=t_status visible="1~tif(cc_total > 0, 1, 0)")',
      ].join('\r\n')
    );

    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const missingDependency = diagnostics.find((diag) => diag.message.includes('missing_rate') && diag.message.includes('cc_total.expression'));

    assert.ok(missingDependency, 'Esperaba un warning por dependencia de expresión DataWindow no resoluble.');
    assert.equal(missingDependency?.severity, DiagnosticSeverity.Warning);
    assert.equal(missingDependency?.code, DIAGNOSTIC_CODES.dataWindowExpressionDependencyUnresolved);
    assert.deepEqual(missingDependency?.data, {
      kind: 'datawindow-expression-dependency',
      confidence: 'medium',
      expression: 'cc_total.expression',
      owner: 'cc_total',
      property: 'expression',
      dependency: 'missing_rate'
    });
    assert.ok(!diagnostics.some((diag) => diag.message.includes('cc_total') && diag.code === DIAGNOSTIC_CODES.dataWindowExpressionDependencyUnresolved && diag !== missingDependency), 'No debe marcar como no resoluble una dependencia ya conocida hacia otro control.');
  });

  test('validateSemantics avisa cuando Retrieve no respeta la aridad de argumentos del .srd enlazado', () => {
    const dataWindowDocument = TextDocument.create(
      'file:///d_sales_orders.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_sales_orders.srd',
        'release 39;',
        'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) " arguments=(("custarg", number)) )" )'
      ].join('\r\n')
    );
    const dataWindowAnalysis = analyzeDocument(dataWindowDocument);
    kb.upsertDocument(
      dataWindowDocument.uri,
      dataWindowAnalysis.semanticFacts,
      dataWindowAnalysis.scopes,
      dataWindowAnalysis.snapshot
    );

    const source = [
      'global type w_dw_retrieve_args from window',
      'end type',
      'forward prototypes',
      'public subroutine of_bind()',
      'end prototypes',
      'public subroutine of_bind()',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(SQLCA)',
      '  ids_orders.DataObject = "d_sales_orders"',
      '  ids_orders.Retrieve()',
      'end subroutine'
    ].join('\r\n');

    const document = TextDocument.create('file:///diagnostics_dataobject_retrieve_arity.sru', 'powerbuilder', 1, source);
    const diagnostics = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const mismatch = diagnostics.find((diag) => diag.message.includes('ids_orders.Retrieve') && diag.message.includes('espera 1 argumento'));

    assert.ok(mismatch, 'Esperaba un warning por aridad incorrecta en Retrieve enlazado a un DataObject literal.');
    assert.equal(mismatch?.severity, DiagnosticSeverity.Warning);
    assert.equal(mismatch?.code, DIAGNOSTIC_CODES.retrieveArityMismatch);
    assert.deepEqual(mismatch?.data, {
      kind: 'dataobject-retrieve-args',
      confidence: 'high',
      target: 'ids_orders',
      dataObject: 'd_sales_orders',
      expectedArgumentCount: 1,
      actualArgumentCount: 0,
      expectedArguments: ['number custarg']
    });
  });

  test('validateStructure soporta IF multi-línea con continuación &', () => {
    const source = [
      'public function integer of_test ();',
      'integer li_x = 1',
      'if li_x > 0 and &',
      '   li_x < 10 then',
      '   li_x = li_x + 1',
      'end if',
      'return li_x',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///multilineif.sru',
      'powerbuilder',
      1,
      source
    );

    const diagnostics = validateStructure(document);
    // Antes el `end if` se reportaba como cierre sin apertura porque el IF
    // multi-línea con `&` no se detectaba.
    assert.equal(
      diagnostics.length,
      0,
      `Estructura válida marcada como inválida: ${diagnostics.map(d => d.message).join(' | ')}`
    );
  });

  // -------------------------------------------------------------------------
  // SD8 / SD9 / SD10 (Specs 078, 079, 080)
  // -------------------------------------------------------------------------

  test('SD8: declaración duplicada en el mismo scope', () => {
    const source = [
      'public function integer of_test ()',
      '  integer li_x',
      '  integer li_x',
      '  return 0',
      'end function'
    ].join('\r\n');
    const document = TextDocument.create('file:///dup.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd8 = diags.filter(d => /ya está declarada/i.test(d.message));
    assert.ok(sd8.length >= 1, 'esperaba al menos 1 SD8');
    assert.equal(sd8[0]?.code, DIAGNOSTIC_CODES.sd8DuplicateDeclaration);
  });

  test('SD9: return fuera de función/evento', () => {
    const source = [
      'integer li_root',
      'return 0',
      ''
    ].join('\r\n');
    const document = TextDocument.create('file:///ret.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd9 = diags.filter(d => /'return'/.test(d.message));
    assert.ok(sd9.length >= 1, 'esperaba al menos 1 SD9');
    assert.equal(sd9[0]?.code, DIAGNOSTIC_CODES.sd9OrphanReturn);
  });

  test('SD10: exit/continue fuera de bucle', () => {
    const source = [
      'public function integer of_test ()',
      '  if true then',
      '    exit',
      '  end if',
      '  return 0',
      'end function'
    ].join('\r\n');
    const document = TextDocument.create('file:///exit.sru', 'powerbuilder', 1, source);
    const diags = validateSemantics(document, kb, systemCatalog, inheritanceGraph);
    const sd10 = diags.filter(d => /'exit'/.test(d.message));
    assert.ok(sd10.length >= 1, 'esperaba al menos 1 SD10');
    assert.equal(sd10[0]?.code, DIAGNOSTIC_CODES.sd10OrphanLoopControl);
  });

  test('publishDiagnostics actualiza un snapshot agrupado por proyecto/objeto y versión', () => {
    const source = [
      'type w_main from window',
      'end type',
      '',
      'public function integer of_test ()',
      '  if true then',
      '    return 1',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create('file:///demo/w_main.srw', 'powerbuilder', 7, source);
    const sent: Array<{ uri: string; diagnostics: unknown[] }> = [];
    const connection = {
      sendDiagnostics(payload: { uri: string; diagnostics: unknown[] }) {
        sent.push(payload);
      }
    } as unknown as Connection;
    const workspaceState = {
      getProjectContextForFile: () => ({
        projectUri: 'file:///demo/demo.pbt',
        kind: 'target',
        name: 'demo',
        libraries: [],
        files: [document.uri]
      }),
      getSourceOrigin: () => 'workspace-ws_objects'
    } as unknown as WorkspaceState;

    publishDiagnostics(connection, document, undefined, undefined, undefined, workspaceState);

    const snapshot = getDiagnosticsSummary() as {
      totals: { error: number };
      projects: Array<{
        label: string;
        objects: Array<{
          label: string;
          documents: Array<{
            uri: string;
            documentVersion?: number;
            snapshotVersion?: number;
            snapshotIdentity?: string;
            sourceOrigin?: string;
          }>;
        }>;
      }>;
    };
    const documentEntry = getDiagnosticsSummary(document.uri) as {
      uri: string;
      projectLabel: string;
      objectLabel: string;
      documentVersion?: number;
      sourceOrigin?: string;
    };

    assert.equal(sent.length, 1);
    assert.equal(sent[0].uri, document.uri);
    assert.ok(sent[0].diagnostics.length > 0);
    assert.ok(snapshot.totals.error > 0);
    assert.equal(snapshot.projects.length, 1);
    assert.equal(snapshot.projects[0].label, 'demo');
    assert.equal(snapshot.projects[0].objects[0].label, 'w_main');
    assert.equal(snapshot.projects[0].objects[0].documents[0].uri, document.uri);
    assert.equal(snapshot.projects[0].objects[0].documents[0].documentVersion, 7);
    assert.equal(snapshot.projects[0].objects[0].documents[0].snapshotVersion, 7);
    assert.ok(snapshot.projects[0].objects[0].documents[0].snapshotIdentity);
    assert.equal(snapshot.projects[0].objects[0].documents[0].sourceOrigin, 'workspace-ws_objects');
    assert.equal(documentEntry.uri, document.uri);
    assert.equal(documentEntry.projectLabel, 'demo');
    assert.equal(documentEntry.objectLabel, 'w_main');
    assert.equal(documentEntry.sourceOrigin, 'workspace-ws_objects');

    clearDiagnosticsSummary(document.uri);
    assert.equal(getDiagnosticsSummary(document.uri), null);
  });
});