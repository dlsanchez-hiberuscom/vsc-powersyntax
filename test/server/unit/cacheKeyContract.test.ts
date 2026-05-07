import * as assert from 'assert/strict';

import {
  buildInteractiveServingCacheKey,
  buildInteractiveServingInvalidationScope,
} from '../../../src/server/serving/cacheKeyContract';

suite('unit/cacheKeyContract', () => {
  test('cambia la key cuando cambian locale, sourceOrigin, fingerprint o trigger', () => {
    const base = {
      cacheClass: 'serving' as const,
      feature: 'completion' as const,
      pressureClass: 'heavy' as const,
      uri: 'file:///w_main.srw',
      documentVersion: 3,
      kbVersion: 7,
      documentFingerprint: 11,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      line: 12,
      character: 8,
      triggerKind: 1,
      triggerCharacter: '.',
    };

    const stable = buildInteractiveServingCacheKey(base);
    const localeChanged = buildInteractiveServingCacheKey({ ...base, locale: 'en' });
    const originChanged = buildInteractiveServingCacheKey({ ...base, sourceOrigin: 'solution-source' });
    const fingerprintChanged = buildInteractiveServingCacheKey({ ...base, documentFingerprint: 12 });
    const triggerChanged = buildInteractiveServingCacheKey({ ...base, triggerCharacter: ':' });

    assert.notEqual(stable, localeChanged);
    assert.notEqual(stable, originChanged);
    assert.notEqual(stable, fingerprintChanged);
    assert.notEqual(stable, triggerChanged);
    assert.equal(stable, buildInteractiveServingCacheKey(base));
  });

  test('normaliza el scope canónico de invalidación y pressure class', () => {
    const scope = buildInteractiveServingInvalidationScope({
      cacheClass: 'negative',
      feature: 'hover-negative',
      uri: 'file:///temp/w_main.srw',
      documentVersion: '42',
      kbVersion: 5,
      documentFingerprint: 9,
      sourceOrigin: 'unknown',
      locale: 'es',
    });

    assert.deepEqual(scope, {
      cacheClass: 'negative',
      feature: 'hover-negative',
      pressureClass: 'negative',
      uri: 'file:///temp/w_main.srw',
      documentVersion: '42',
      kbVersion: 5,
      documentFingerprint: 9,
      sourceOrigin: 'unknown',
      locale: 'es',
    });
  });

  test('versiona hover view-model por rango, documento y locale', () => {
    const base = {
      cacheClass: 'view-model' as const,
      feature: 'hover-view-model' as const,
      pressureClass: 'hot' as const,
      uri: 'file:///w_main.srw',
      documentVersion: 3,
      kbVersion: 7,
      documentFingerprint: 11,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      line: 12,
      character: 8,
      rangeStartLine: 12,
      rangeStartCharacter: 4,
      rangeEndLine: 12,
      rangeEndCharacter: 14,
      context: 'messagebox',
    };

    const stable = buildInteractiveServingCacheKey(base);

    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, documentVersion: 4 }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, documentFingerprint: 12 }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, sourceOrigin: 'solution-source' }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, locale: 'en' }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, rangeEndCharacter: 15 }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, context: 'messageboxa' }));
  });

  test('versiona negative cache de completion-resolve por locale y contexto', () => {
    const base = {
      cacheClass: 'negative' as const,
      feature: 'completion-resolve' as const,
      pressureClass: 'negative' as const,
      uri: 'file:///w_main.srw',
      documentVersion: 3,
      kbVersion: 7,
      documentFingerprint: 11,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      context: 'system:abs',
    };

    const stable = buildInteractiveServingCacheKey(base);

    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, locale: 'en' }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, context: 'system:messagebox' }));
    assert.notEqual(stable, buildInteractiveServingCacheKey({ ...base, documentFingerprint: 12 }));
  });
});