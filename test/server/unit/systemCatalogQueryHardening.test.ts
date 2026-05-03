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
});