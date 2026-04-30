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

    const localNames = funcScope!.symbols.map((s) => s.name.toLowerCase());
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
    const names = ev!.symbols.map((s) => s.name.toLowerCase());
    assert.ok(names.includes('ll_a'));
    assert.ok(names.includes('ll_b'), 'Falta ll_b en declaración múltiple.');
    assert.ok(names.includes('ll_c'), 'Falta ll_c en declaración múltiple.');
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