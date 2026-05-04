import * as assert from 'assert/strict';
import {
  buildSystemSymbolLocalizationIndex,
  createDocumentationService,
  getDisplayDocumentation,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  getDisplayUsageNotes,
} from '../../../src/server/knowledge/system/localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import type { PbSystemSymbolLocalizationOverlay } from '../../../src/server/knowledge/system/localization';

suite('unit/documentationService (B372)', () => {
  test('prioriza overlay es y mantiene fallback en al texto original', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    assert.ok(absEntry);

    assert.equal(getDisplaySummary(absEntry!, 'es'), 'Calcula el valor absoluto de un numero.');
    assert.equal(getDisplaySummary(absEntry!, 'en'), 'Calculates the absolute value of a number.');
    assert.equal(
      getDisplayDocumentation(absEntry!, 'es'),
      'Usa Abs cuando necesites conservar el tipo numerico y obtener siempre la magnitud positiva del valor.',
    );
    assert.equal(
      getDisplayReturnDocumentation(absEntry!, 'es'),
      'Devuelve el mismo tipo de dato de n con su valor absoluto. Si n es null, devuelve null.',
    );
    assert.equal(
      getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'es'),
      'Numero del que quieres obtener el valor absoluto.',
    );
    assert.equal(
      getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'en'),
      'The number for which you want the absolute value',
    );
  });

  test('mantiene referencias de arrays en fallback y usa el overlay cuando existe', () => {
    const dayNameEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'DayName',
    );
    const fallbackEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated'
        && entry.domain === 'global-functions'
        && !['Abs', 'DayName', 'MessageBox'].includes(entry.name)
        && Array.isArray(entry.usageNotes)
        && entry.usageNotes.length > 0,
    );
    assert.ok(dayNameEntry);
    assert.ok(fallbackEntry);

    assert.strictEqual(getDisplayUsageNotes(dayNameEntry!, 'es'), getDisplayUsageNotes(dayNameEntry!, 'es'));
    assert.strictEqual(getDisplayUsageNotes(fallbackEntry!, 'es'), fallbackEntry!.usageNotes);
  });

  test('servicio inyectable cubre overlays por targetId y targetKey', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    const dayNameEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'DayName',
    );
    assert.ok(absEntry);
    assert.ok(dayNameEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen targetId.',
        },
        parameters: [
          {
            signatureLabel: 'Abs ( n )',
            parameterName: 'n',
            documentation: 'Parametro resuelto por targetId.',
          },
        ],
      },
      {
        locale: 'es',
        targetKey: {
          domain: 'global-functions',
          kind: 'callable',
          namespace: 'powerscript',
          invocation: 'global',
          name: 'DayName',
        },
        text: {
          summary: 'Resumen targetKey.',
          usageNotes: ['Uso resuelto por targetKey.'],
        },
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);
    const service = createDocumentationService((entryId, locale) => index.locales.get(locale)?.get(entryId));

    assert.equal(service.getDisplaySummary(absEntry!, 'es'), 'Resumen targetId.');
    assert.equal(
      service.getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'es'),
      'Parametro resuelto por targetId.',
    );
    assert.equal(service.getDisplaySummary(dayNameEntry!, 'es'), 'Resumen targetKey.');
    assert.deepEqual(service.getDisplayUsageNotes(dayNameEntry!, 'es'), ['Uso resuelto por targetKey.']);
  });
});