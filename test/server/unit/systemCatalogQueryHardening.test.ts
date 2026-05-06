import * as assert from 'assert/strict';
import {
  PB_SYSTEM_CATALOG_CONFLICT_POLICY,
  PB_SYSTEM_CATALOG_ENRICHABLE_FIELDS,
  PB_SYSTEM_CATALOG_ENRICHMENT_LAYER_ORDER,
  PB_SYSTEM_CATALOG_IDENTITY_LOCKED_FIELDS,
  PB_SYSTEM_CATALOG_PRESENTATION_EXPOSURE,
  PB_SYSTEM_CATALOG_PROVENANCE_CHAIN,
} from '../../../src/server/knowledge/system/policy';
import { getDisplaySummary } from '../../../src/server/knowledge/system/localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import {
  buildSystemCompletionItemViewModel,
  buildSystemCompletionResolveViewModel,
  formatCompletionItemViewModel,
} from '../../../src/server/presentation/completionPresentation';
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
  resolveSystemGlobalFunction,
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
    const stalePolicyReasons = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(
      (entry) => /until B369 defines final adoption policy/.test(entry.manualOverlay?.reason ?? ''),
    );

    assert.ok(manualClipboard);
    assert.ok(generatedClipboard);
    assert.equal(manualClipboard?.manualOverlay?.mode, 'override');
    assert.equal(manualClipboard?.manualOverlay?.targetKey?.name, 'Clipboard');
    assert.ok((manualClipboard?.manualOverlay?.evidence.length ?? 0) >= 2);
    assert.equal(stalePolicyReasons.length, 0);
    assert.equal(clipboardEntries[0]?.dataset, 'manual-core');
  });

  test('expone el contrato explícito de enrichment del catálogo para runtime y presentation', () => {
    assert.deepEqual(PB_SYSTEM_CATALOG_ENRICHMENT_LAYER_ORDER, [
      'generated-base',
      'manual-curated-enrichment',
      'localization-overlay',
      'presentation-formatter',
    ]);
    assert.deepEqual(PB_SYSTEM_CATALOG_ENRICHABLE_FIELDS, [
      'summary',
      'documentation',
      'usageNotes',
      'obsoleteMessage',
      'returnDocumentation',
      'parameterDocumentation',
      'category',
    ]);
    assert.deepEqual(PB_SYSTEM_CATALOG_PRESENTATION_EXPOSURE.completionInitial, ['summary']);
    assert.deepEqual(PB_SYSTEM_CATALOG_PRESENTATION_EXPOSURE.signatureHelp, [
      'summary',
      'returnDocumentation',
      'parameterDocumentation',
    ]);
    assert.ok(PB_SYSTEM_CATALOG_IDENTITY_LOCKED_FIELDS.includes('signatures.label'));
    assert.ok(PB_SYSTEM_CATALOG_IDENTITY_LOCKED_FIELDS.includes('sourceUrl'));
    assert.equal(PB_SYSTEM_CATALOG_PROVENANCE_CHAIN.generatedBase.dataset, 'generated');
    assert.equal(PB_SYSTEM_CATALOG_PROVENANCE_CHAIN.generatedBase.authority, 'official');
    assert.deepEqual(PB_SYSTEM_CATALOG_PROVENANCE_CHAIN.manualCuratedEnrichment.manualOverlayModes, ['enrichment', 'override']);
    assert.deepEqual(PB_SYSTEM_CATALOG_PROVENANCE_CHAIN.localizationOverlay.sources, [
      'manual-curated',
      'machine-assisted-reviewed',
      'generated-assisted',
    ]);
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

  test('completion initial queda compacto y completion resolve expone enrichment visible de forma lazy', () => {
    const absEntry = resolveSystemGlobalFunction('Abs');
    assert.ok(absEntry);

    const initial = buildSystemCompletionItemViewModel(absEntry!, '0001', 'es', { entryId: absEntry!.id });
    const resolved = buildSystemCompletionResolveViewModel(
      formatCompletionItemViewModel(initial),
      absEntry!,
      'es',
    );

    assert.equal(initial.detail, getDisplaySummary(absEntry!, 'es'));
    assert.equal(resolved.detail, absEntry!.signatures[0]?.label);
    assert.match(resolved.documentation ?? '', /Calcula el valor absoluto de un numero|Usa Abs cuando necesites conservar el tipo numerico/);
  });
});