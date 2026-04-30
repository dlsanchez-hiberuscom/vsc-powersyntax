import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
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