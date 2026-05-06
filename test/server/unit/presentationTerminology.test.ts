import * as assert from 'assert/strict';

import { CompletionItem } from 'vscode-languageserver/node';

import { buildSystemCompletionResolveViewModel, getPresentationTerm, PRESENTATION_MINIMUM_TERMS, resolvePresentationTerminologyLocale } from '../../../src/server/presentation';
import { buildUserHoverViewModel } from '../../../src/server/features/hoverViewModel';
import { formatHoverViewModel } from '../../../src/server/features/hoverFormat';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function localVariable(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'li_total',
    name: 'li_total',
    kind: EntityKind.Variable,
    uri: 'file:///x.srw',
    line: 4,
    character: 2,
    datatype: 'integer',
    declarationScope: 'local',
    containerName: 'w_main.of_calc',
    containerKind: 'function',
    containerSignature: 'public function integer of_calc (string as_name)',
    fileObjectName: 'w_main',
    ...overrides,
  };
}

suite('unit/presentationTerminology (Fase 10)', () => {
  test('resuelve locale de terminologia y preserva el glosario minimo', () => {
    assert.equal(resolvePresentationTerminologyLocale('es-MX'), 'es');
    assert.equal(resolvePresentationTerminologyLocale('fr-FR'), 'en');
    assert.deepEqual(PRESENTATION_MINIMUM_TERMS, [
      'function',
      'event',
      'variable',
      'parameter',
      'return-value',
      'datawindow',
      'datastore',
      'datawindowchild',
      'transaction',
      'ancestor',
      'override',
      'scope',
      'source-origin',
      'confidence',
      'deprecated',
      'inferred',
      'ambiguous',
      'unknown',
    ]);
    assert.equal(getPresentationTerm('function', 'es-MX'), 'Funcion');
    assert.equal(getPresentationTerm('scope', 'es-MX'), 'Alcance');
    assert.equal(getPresentationTerm('function', 'fr-FR'), 'Function');
  });

  test('localiza el hover de usuario con el glosario canonico', () => {
    const markdown = formatHoverViewModel(buildUserHoverViewModel(
      localVariable({
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'prototype',
          inheritedFrom: 'w_base',
          confidence: 'direct',
        },
      }),
      { confidence: 'low', reasonCode: 'global-fallback' },
      { locale: 'es' },
    ));

    assert.match(markdown, /Variable local/);
    assert.match(markdown, /Alcance:.*of_calc/);
    assert.match(markdown, /Heredado de:.*w_base/);
    assert.match(markdown, /Advertencia: resuelto usando workspace fallback/i);
  });

  test('localiza completion resolve y mantiene fallback ingles cuando el locale no aplica', () => {
    const catalog = new SystemCatalog();
    const symbol = catalog.findSystemSymbol('MessageBox').find((entry) => entry.kind === 'callable');

    assert.ok(symbol, 'MessageBox debe existir en el catalogo.');

    const spanish = buildSystemCompletionResolveViewModel(CompletionItem.create('MessageBox'), symbol, 'es');
    const english = buildSystemCompletionResolveViewModel(CompletionItem.create('MessageBox'), symbol, 'en');

    assert.match(spanish.documentation ?? '', /Firmas:/);
    assert.match(spanish.documentation ?? '', /Retorno:/);
    assert.match(english.documentation ?? '', /Signatures:/);
  });
});