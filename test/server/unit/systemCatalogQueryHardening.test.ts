import * as assert from 'assert/strict';
import {
  PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY,
  findEntriesByDomainAndLookupKey,
  findEntriesByKindAndLookupKey,
  isKnownSystemOwnerType,
  listSystemSymbolsByDomain,
  listValuesForEnumeratedType,
  resolveEnumeratedType,
  resolveEnumeratedValue,
  resolveEnumValueForExpectedType,
  resolveSystemDataWindowFunction,
} from '../../../src/server/knowledge/system/services/queryService';

suite('unit/systemCatalogQueryHardening (B365)', () => {
  test('usa buckets compuestos por domain+lookup y kind+lookup', () => {
    const keywords = findEntriesByDomainAndLookupKey('keywords', 'if');
    const events = findEntriesByKindAndLookupKey('event', 'clicked');

    assert.ok(keywords.length > 0);
    assert.ok(keywords.every((entry) => entry.domain === 'keywords'));
    assert.ok(events.length > 0);
    assert.ok(events.every((entry) => entry.kind === 'event'));
  });

  test('expone la prioridad explícita de resolveLanguageSymbol', () => {
    assert.deepEqual(PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY, [
      'reserved-word',
      'keyword',
      'pronoun',
      'datatype',
      'system-type',
      'enumerated-type',
      'system-global',
      'enumerated-value',
      'operator',
      'property',
      'constant',
    ]);
  });

  test('owner types y dominios del catálogo se consultan desde queryService', () => {
    const dataWindowFunctions = listSystemSymbolsByDomain('datawindow-functions');

    assert.ok(dataWindowFunctions.length > 0);
    assert.equal(isKnownSystemOwnerType('datawindow'), true);
    assert.equal(isKnownSystemOwnerType('powerobject'), true);
    assert.equal(isKnownSystemOwnerType('tipo_que_no_existe'), false);
  });

  test('enum scoped queries quedan future-proof sobre el catálogo curado actual', () => {
    const saveAsType = resolveEnumeratedType('SaveAsType');
    const saveAsTypeValues = listValuesForEnumeratedType('SaveAsType');
    const primaryValue = resolveEnumeratedValue('Primary!');

    assert.equal(saveAsType?.name, 'SaveAsType');
    assert.equal(resolveEnumeratedType('SaveAsType!'), undefined);
    assert.ok(saveAsTypeValues.length > 0);
    assert.ok(saveAsTypeValues.some((entry) => entry.name === 'Text!'));
    assert.equal(primaryValue?.enumValueOf, 'DWBuffer');
    assert.equal(resolveEnumValueForExpectedType('Text!', 'SaveAsType')?.name, 'Text!');
    assert.equal(resolveEnumValueForExpectedType('SaveAsType', 'SaveAsType'), undefined);
    assert.equal(resolveEnumValueForExpectedType('CSV', 'SaveAsType'), undefined);
  });

  test('manual overlay metadata hace explícita una colisión manual/generated sin cambiar el bucket runtime', () => {
    const clipboardEntries = findEntriesByDomainAndLookupKey('datawindow-functions', 'clipboard');
    const manualClipboard = clipboardEntries.find((entry) => entry.dataset === 'manual-core');
    const generatedClipboard = clipboardEntries.find((entry) => entry.dataset === 'generated');

    assert.ok(manualClipboard);
    assert.ok(generatedClipboard);
    assert.equal(manualClipboard?.manualOverlay?.mode, 'override');
    assert.equal(manualClipboard?.manualOverlay?.targetKey?.name, 'Clipboard');
    assert.ok((manualClipboard?.manualOverlay?.evidence.length ?? 0) >= 2);
    assert.equal(clipboardEntries[0]?.dataset, 'manual-core');
  });

  test('registry mantiene enrichments explícitos cuando generated ya cubre datatype y enum type', () => {
    const integerEntries = findEntriesByDomainAndLookupKey('datatypes', 'integer');
    const seekTypeEntries = findEntriesByKindAndLookupKey('enumerated-type', 'seektype');
    const manualInteger = integerEntries.find((entry) => entry.dataset === 'manual-core');
    const manualSeekType = seekTypeEntries.find((entry) => entry.dataset === 'manual-core');

    assert.equal(manualInteger?.manualOverlay?.mode, 'enrichment');
    assert.equal(manualSeekType?.manualOverlay?.mode, 'enrichment');
  });

  test('query layer aplica la merge policy provisional de B368 en hot path', () => {
    const datatypeEntries = listSystemSymbolsByDomain('datatypes').filter((entry) => entry.normalizedName === 'integer');
    const clipboardBucket = findEntriesByDomainAndLookupKey('datawindow-functions', 'clipboard');

    assert.equal(clipboardBucket.length, 2);
    assert.equal(datatypeEntries.length, 1);
    assert.equal(datatypeEntries[0]?.dataset, 'generated');
    assert.equal(datatypeEntries[0]?.manualOverlay?.mode, 'enrichment');
    assert.equal(resolveSystemDataWindowFunction('Clipboard')?.dataset, 'manual-core');
  });
});