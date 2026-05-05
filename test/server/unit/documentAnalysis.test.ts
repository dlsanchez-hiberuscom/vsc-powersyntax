import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  analyzeDocument,
  analyzeDocumentStructural
} from '../../../src/server/analysis/documentAnalysis';
import { EntityKind } from '../../../src/server/knowledge/types';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/documentAnalysis', () => {
  test('analyzeDocument construye secciones y facts', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///documentAnalysis-unit.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocument(document);

    assert.ok(analysis.sections.length >= 3);
    assert.ok(analysis.facts.length > 0);

    assert.ok(analysis.sections.some((section) => section.kind === 'forward'));
    assert.ok(analysis.sections.some((section) => section.kind === 'prototypes'));
    assert.ok(analysis.sections.some((section) => section.kind === 'variables'));

    assert.ok(
      analysis.facts.some(
        (fact) => fact.kind === 'variable' && fact.name === 'ib_inicializado'
      ),
      'No se detectó la variable esperada ib_inicializado.'
    );

    assert.ok(
      analysis.facts.some(
        (fact) => ['function', 'subroutine', 'event'].includes(fact.kind) && fact.name === 'uf_inicializar'
      ),
      'No se detectó el símbolo esperado uf_inicializar.'
    );
  });

  test('end if no cierra el scope de la función (regresión)', () => {
    // Regresión: el scope de la función dejaba de capturar variables locales
    // tras el primer `end if` porque se usaba END_GENERIC_PATTERN como cierre.
    const source = loadFixture('basic/function_with_endif.sru');
    const document = TextDocument.create(
      'file:///documentAnalysis-endif.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocument(document);
    const funcScope = findScopeByName(analysis.scopes, 'of_compute');
    assert.ok(funcScope, 'No se encontró el scope de of_compute.');

    const localNames = funcScope!.symbols.map((s: any) => s.name.toLowerCase());
    assert.ok(localNames.includes('li_local'), 'Falta li_local declarada antes del IF.');
    assert.ok(
      localNames.includes('li_after_endif'),
      'Falta li_after_endif declarada después del end if (regresión).'
    );
  });

  test('declaraciones múltiples (long ll_a, ll_b, ll_c)', () => {
    const source = loadFixture('basic/function_with_endif.sru');
    const document = TextDocument.create(
      'file:///documentAnalysis-multi.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocument(document);
    const ev = findScopeByName(analysis.scopes, 'clicked');
    assert.ok(ev, 'No se encontró el scope del event clicked.');
    const names = ev!.symbols.map((s: any) => s.name.toLowerCase());
    assert.ok(names.includes('ll_a'));
    assert.ok(names.includes('ll_b'), 'Falta ll_b en declaración múltiple.');
    assert.ok(names.includes('ll_c'), 'Falta ll_c en declaración múltiple.');
  });

  test('parámetros: modificadores múltiples y array suffix', () => {
    const source = [
      'forward',
      'global type w_p from window',
      'end type',
      'end forward',
      '',
      'global type w_p from window',
      'end type',
      '',
      'public function integer of_test (readonly ref string as_arr[], ref integer ai_count);',
      'integer li_x',
      'li_x = ai_count',
      'return li_x',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///documentAnalysis-params.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocument(document);
    const fn = findScopeByName(analysis.scopes, 'of_test');
    assert.ok(fn, 'No se encontró el scope de of_test.');
    const symbols = fn!.symbols as any[];
    const arr = symbols.find((s) => s.name.toLowerCase() === 'as_arr');
    const cnt = symbols.find((s) => s.name.toLowerCase() === 'ai_count');
    assert.ok(arr, 'Parámetro array `as_arr` no detectado (modificador múltiple).');
    assert.equal(arr.datatype, 'string');
    assert.ok(cnt, 'Parámetro `ai_count` con `ref` no detectado.');
    assert.equal(cnt.datatype, 'integer');
  });

  // -------------------------------------------------------------------------
  // Spec 087 — BOM al inicio del archivo
  // -------------------------------------------------------------------------
  test('BOM en la primera línea no rompe el primer token', () => {
    const source = '\uFEFFforward\r\nend forward\r\n';
    const document = TextDocument.create(
      'file:///bom.sru',
      'powerbuilder',
      1,
      source
    );
    const analysis = analyzeDocument(document);
    // La primera línea queda sin BOM y arrancando por `forward`.
    assert.equal(analysis.lines[0].slice(0, 7), 'forward');
  });

  // -------------------------------------------------------------------------
  // Spec 074 — fingerprint determinista
  // -------------------------------------------------------------------------
  test('fingerprint es determinista para el mismo texto', () => {
    const text = 'forward\r\nend forward\r\n';
    const a = analyzeDocument(TextDocument.create('file:///fp1.sru', 'powerbuilder', 1, text));
    const b = analyzeDocument(TextDocument.create('file:///fp2.sru', 'powerbuilder', 1, text));
    assert.equal(a.fingerprint, b.fingerprint);
    const c = analyzeDocument(TextDocument.create('file:///fp3.sru', 'powerbuilder', 1, text + ' '));
    assert.notEqual(a.fingerprint, c.fingerprint);
  });

  test('analyzeDocument publica un stub navegable para archivos .srd', () => {
    const source = [
      '$PBExportHeader$d_customer.srd',
      'release 39;',
      'datawindow(units=0)'
    ].join('\r\n');
    const document = TextDocument.create('file:///d_customer.srd', 'powerbuilder', 1, source);

    const analysis = analyzeDocument(document);
    const structural = analyzeDocumentStructural(document);
    const dataWindowType = analysis.semanticFacts.find((fact) => fact.kind === EntityKind.Type);
    const structuralType = structural.snapshot.symbols.find((fact) => fact.kind === EntityKind.Type);

    assert.ok(dataWindowType, 'El análisis enriquecido debe publicar un type stub para el .srd.');
    assert.equal(dataWindowType?.name, 'd_customer');
    assert.equal(dataWindowType?.baseTypeName, 'datawindow');
    assert.equal(dataWindowType?.fileObjectName, 'd_customer');

    assert.ok(structuralType, 'El snapshot estructural debe conservar el stub del .srd.');
    assert.equal(structuralType?.name, 'd_customer');
    assert.equal(analysis.sections.length, 0, '.srd no debe entrar por secciones PowerScript genéricas.');
    assert.equal(analysis.scopes.length, 0, '.srd no debe publicar scopes PowerScript genéricos.');
    assert.equal(analysis.logicalStatements.length, 0, '.srd no debe dividirse como statements PowerScript.');
    assert.equal(analysis.controlBlocks.length, 0, '.srd no debe pasar por bloques de control PowerScript.');
    assert.equal(structural.snapshot.containerModel.sections.length, 0, 'El snapshot .srd conserva frontera DataWindow/PowerScript.');
  });

  // -------------------------------------------------------------------------
  // Spec 064 — containerAt anidado para multi `type ... within`
  // -------------------------------------------------------------------------
  test('multi `type within` atribuye contenedor a la implementación', () => {
    const source = [
      'forward',
      'global type w_main from window',
      'end type',
      'type cb_ok from commandbutton within w_main',
      'end type',
      'end forward',
      '',
      'global type w_main from window',
      'event open()',
      'end type',
      '',
      'type cb_ok from commandbutton within w_main',
      'integer width = 100',
      'end type',
      '',
      'event open();',
      '  string ls_a',
      'end event'
    ].join('\r\n');
    const document = TextDocument.create('file:///w_main.srw', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);
    // El evento implementado debe atribuirse al contenedor más externo:
    // w_main (no a cb_ok), porque está fuera del bloque `type cb_ok within w_main`.
    const evFact = analysis.semanticFacts.find(
      (f) => f.kind.toString().toLowerCase() === 'event'
    );
    assert.ok(evFact, 'Evento no encontrado en semanticFacts');
    assert.equal((evFact as any).containerName?.toLowerCase(), 'w_main');
  });

  test('analyzeDocument construye snapshot semántico canónico', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create('file:///documentAnalysis-snapshot.sru', 'powerbuilder', 1, source);

    const analysis = analyzeDocument(document);

    assert.equal(analysis.snapshot.uri, document.uri);
    assert.equal(analysis.snapshot.version, document.version);
    assert.equal(analysis.snapshot.fingerprint, analysis.fingerprint);
    assert.equal(analysis.snapshot.symbols, analysis.semanticFacts);
    assert.equal(analysis.snapshot.scopes, analysis.scopes);
    assert.ok(analysis.snapshot.identity.includes(String(analysis.fingerprint)));
  });

  test('respeta sourceOrigin contextual explícito en semanticFacts', () => {
    const source = [
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      '',
      'global type w_main from window',
      'public function integer of_real();',
      '  return 1',
      'end function',
      'end type'
    ].join('\r\n');
    const document = TextDocument.create('file:///proj/src/w_main.srw', 'powerbuilder', 1, source);

    const analysis = analyzeDocument(document, { sourceOrigin: 'solution-source' });

    const typeFact = analysis.semanticFacts.find((fact) => fact.kind.toString().toLowerCase() === 'type');
    const implementationFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_real');

    assert.equal(typeFact?.lineage?.sourceOrigin, 'solution-source');
    assert.equal(implementationFact?.lineage?.sourceOrigin, 'solution-source');
  });

  test('semanticFacts poblan lineage documental para prototype, implementation y herencia', () => {
    const source = [
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      '',
      'forward prototypes',
      'public function integer of_only_proto();',
      'end prototypes',
      '',
      'global type w_main from window',
      'public function integer of_real();',
      '  return 1',
      'end function',
      'end type'
    ].join('\r\n');

    const document = TextDocument.create('file:///documentAnalysis-lineage.sru', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);

    const typeFact = analysis.semanticFacts.find((fact) => fact.kind.toString().toLowerCase() === 'type');
    const prototypeFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_only_proto');
    const implementationFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_real');

    assert.ok(typeFact, 'No se encontró el type fact esperado.');
    assert.ok(prototypeFact, 'No se encontró el prototype fact esperado.');
    assert.ok(implementationFact, 'No se encontró el implementation fact esperado.');

    assert.deepEqual(typeFact!.lineage, {
      sourceKind: 'document',
      sourceOrigin: 'unknown',
      authority: 'derived',
      phase: 'declaration',
      inheritedFrom: 'window',
      confidence: 'direct'
    });

    assert.deepEqual(prototypeFact!.lineage, {
      sourceKind: 'document',
      sourceOrigin: 'unknown',
      authority: 'derived',
      phase: 'prototype',
      role: 'prototype',
      confidence: 'direct'
    });

    assert.deepEqual(implementationFact!.lineage, {
      sourceKind: 'document',
      sourceOrigin: 'unknown',
      authority: 'derived',
      phase: 'implementation',
      role: 'implementation',
      confidence: 'direct'
    });
  });

  test('propaga metadata contractual de B206 para callable, member, local y parameter', () => {
    const source = [
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      '',
      'forward prototypes',
      'public function long of_external (string as_input) library "kernel32.dll" alias for "OfExternal";',
      'end prototypes',
      '',
      'global type w_main from window',
      'integer ii_member',
      'end type',
      '',
      'on w_main.create',
      '  integer li_on',
      'end on',
      '',
      'public function integer of_real (readonly string as_name);',
      'integer li_local',
      'return 1',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create('file:///documentAnalysis-b206.srw', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);

    const memberFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'ii_member');
    const callableFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_real');
    const onHandlerFact = analysis.semanticFacts.find((fact) => fact.kind === EntityKind.Event && fact.name.toLowerCase() === 'create');
    const externalFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_external');
    const callableScope = findScopeByName(analysis.scopes, 'of_real');
    const parameter = callableScope?.symbols.find((symbol: any) => symbol.name.toLowerCase() === 'as_name');
    const local = callableScope?.symbols.find((symbol: any) => symbol.name.toLowerCase() === 'li_local');

    assert.equal(memberFact?.declarationScope, 'member');
    assert.equal(memberFact?.fileObjectName, 'w_main');
    assert.equal(memberFact?.containerKind, 'type');

    assert.equal(callableFact?.declarationScope, 'callable');
    assert.equal(callableFact?.fileObjectName, 'w_main');
    assert.equal(callableFact?.ownerName, 'w_main');
    assert.equal(callableFact?.parameterCount, 1);
    assert.equal(callableFact?.implementationKind, 'function');
    assert.equal(callableFact?.returnType, 'integer');
    assert.match(callableFact?.signature ?? '', /of_real/i);

    assert.equal(onHandlerFact?.declarationScope, 'callable');
  assert.equal(onHandlerFact?.containerName, 'w_main');
  assert.equal(onHandlerFact?.ownerName, 'w_main');
    assert.equal(onHandlerFact?.implementationKind, 'on-handler');
    assert.match(onHandlerFact?.signature ?? '', /^on\s+w_main\.create/i);

    assert.equal(externalFact?.isExternal, true);
    assert.equal(externalFact?.externalLibraryName, 'kernel32.dll');
    assert.equal(externalFact?.externalAlias, 'OfExternal');
    assert.equal(externalFact?.externalDependencyKind, 'dll');
    assert.equal(externalFact?.implementationKind, 'external-function');

    assert.equal(parameter?.declarationScope, 'parameter');
    assert.equal(parameter?.fileObjectName, 'w_main');
    assert.match(parameter?.containerSignature ?? '', /of_real/i);

    assert.equal(local?.declarationScope, 'local');
    assert.equal(local?.ownerName, 'w_main');
    assert.equal(local?.fileObjectName, 'w_main');
  });

  test('analyzeDocument separa owner real y nombre de evento en on control.event', () => {
    const source = [
      'global type w_main from window',
      'end type',
      '',
      'type cb_ok from commandbutton within w_main',
      'end type',
      '',
      'on w_main.cb_ok.clicked',
      '  integer li_clicks',
      'end on'
    ].join('\r\n');

    const document = TextDocument.create('file:///documentAnalysis-events.srw', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);

    const eventFact = analysis.semanticFacts.find((fact) => fact.kind === EntityKind.Event && fact.name.toLowerCase() === 'clicked');
    const eventScope = findScopeByName(analysis.scopes, 'cb_ok.clicked');
    const local = eventScope?.symbols.find((symbol: any) => symbol.name.toLowerCase() === 'li_clicks');

    assert.equal(eventFact?.containerName, 'cb_ok');
    assert.equal(eventFact?.ownerName, 'cb_ok');
    assert.equal(eventFact?.fileObjectName, 'w_main');
    assert.equal(eventFact?.implementationKind, 'on-handler');
    assert.match(eventFact?.signature ?? '', /^on\s+w_main\.cb_ok\.clicked/i);

    assert.ok(eventScope);
    assert.equal(eventScope?.parent?.id, 'cb_ok');
    assert.equal(local?.ownerName, 'cb_ok');
    assert.equal(local?.fileObjectName, 'w_main');
  });

  test('sanitiza containerSignature cuando la cabecera callable comparte línea con una sentencia', () => {
    const source = [
      'global type w_main from window',
      'end type',
      '',
      'event pfc_values; call super::pfc_values()',
      '  string ls_value',
      'end event'
    ].join('\r\n');

    const document = TextDocument.create('file:///documentAnalysis-callable-signature.srw', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);
    const eventFact = analysis.semanticFacts.find((fact) => fact.kind === EntityKind.Event && fact.name.toLowerCase() === 'pfc_values');
    const eventScope = findScopeByName(analysis.scopes, 'pfc_values');
    const local = eventScope?.symbols.find((symbol: any) => symbol.name.toLowerCase() === 'ls_value');

    assert.equal(eventFact?.signature, 'event pfc_values');
    assert.equal(local?.containerSignature, 'event pfc_values');
  });

  test('B281 conserva overloads y solo sustituye prototipo por implementación de la misma firma', () => {
    const source = [
      'forward',
      'global type w_overload from window',
      'end type',
      'end forward',
      '',
      'forward prototypes',
      'public function integer of_pick(integer ai_value)',
      'public function integer of_pick(integer ai_value, string as_value)',
      'end prototypes',
      '',
      'global type w_overload from window',
      'end type',
      '',
      'public function integer of_pick(integer ai_value);',
      'return ai_value',
      'end function',
      '',
      'public function integer of_pick(integer ai_value, string as_value);',
      'return ai_value',
      'end function'
    ].join('\r\n');

    const document = TextDocument.create('file:///documentAnalysis-b281-overloads.sru', 'powerbuilder', 1, source);
    const analysis = analyzeDocument(document);
    const overloads = analysis.semanticFacts.filter((fact) => fact.name.toLowerCase() === 'of_pick');

    assert.equal(overloads.length, 2);
    assert.deepEqual(overloads.map((fact) => fact.parameterCount).sort(), [1, 2]);
    assert.ok(overloads.every((fact) => fact.isPrototype !== true));
    assert.ok(overloads.every((fact) => fact.lineage?.phase === 'implementation'));
  });

  test('analyzeDocumentStructural publica snapshot structural-only sin facts ni scopes', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///documentAnalysis-structural.sru',
      'powerbuilder',
      1,
      source
    );

    const analysis = analyzeDocumentStructural(document);

    assert.equal(analysis.snapshot.pass, 'structural');
    assert.equal(analysis.snapshot.readiness, 'structural-only');
    assert.deepEqual(analysis.snapshot.symbols, []);
    assert.deepEqual(analysis.snapshot.scopes, []);
    assert.ok(analysis.snapshot.containerModel.sections.length >= 3);
    assert.ok(analysis.snapshot.containerModel.typeBlocks.length > 0);
  });
});

function findScopeByName(
  scopes: Array<{ id: string; children: any[] }>,
  name: string
): any | undefined {
  const target = name.toLowerCase();
  for (const scope of scopes) {
    if (scope.id.toLowerCase().endsWith(target)) return scope;
    const found = findScopeByName(scope.children as any, name);
    if (found) return found;
  }
  return undefined;
}