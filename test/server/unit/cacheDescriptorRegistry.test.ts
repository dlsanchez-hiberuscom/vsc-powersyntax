import * as assert from 'assert/strict';

import {
  CACHE_DESCRIPTOR_REGISTRY,
  CacheDescriptorRegistry,
  type CacheDescriptor,
} from '../../../src/server/serving/cacheDescriptorRegistry';
import { buildInteractiveServingCacheKey, buildInteractiveServingStaleKeyMatcher } from '../../../src/server/serving/cacheKeyContract';

suite('unit/cacheDescriptorRegistry', () => {
  suite('registro singleton', () => {
    test('contiene los 12 caches de InteractiveServingCacheFeature', () => {
      const ids = [
        'hover', 'hover-view-model', 'hover-negative',
        'completion', 'completion-resolve', 'completion-view-model',
        'signatureHelp', 'signatureHelp-view-model',
        'definition', 'references', 'documentSymbols', 'semanticTokens',
      ];
      for (const id of ids) {
        assert.ok(CACHE_DESCRIPTOR_REGISTRY.get(id), `Cache '${id}' debe estar registrado`);
      }
    });

    test('hover tiene pressureClass hot y stalePolicy allow-stale-ui', () => {
      const d = CACHE_DESCRIPTOR_REGISTRY.get('hover')!;
      assert.equal(d.pressureClass, 'hot');
      assert.equal(d.stalePolicy, 'allow-stale-ui');
    });

    test('hover-negative tiene pressureClass negative y stalePolicy strict', () => {
      const d = CACHE_DESCRIPTOR_REGISTRY.get('hover-negative')!;
      assert.equal(d.pressureClass, 'negative');
      assert.equal(d.stalePolicy, 'strict');
    });

    test('references tiene pressureClass heavy y stalePolicy degrade-to-empty', () => {
      const d = CACHE_DESCRIPTOR_REGISTRY.get('references')!;
      assert.equal(d.pressureClass, 'heavy');
      assert.equal(d.stalePolicy, 'degrade-to-empty');
    });

    test('hover-view-model incluye locale en invalidationPolicies', () => {
      const d = CACHE_DESCRIPTOR_REGISTRY.get('hover-view-model')!;
      assert.ok(d.invalidationPolicies.includes('locale'));
    });

    test('getAll retorna 12 entradas', () => {
      assert.equal(CACHE_DESCRIPTOR_REGISTRY.getAll().length, 12);
    });

    test('los descriptores hot/warm siguen siendo compatibles con el contrato de key/stale matcher', () => {
      const samples = [
        {
          id: 'hover',
          descriptor: {
            cacheClass: 'serving' as const,
            feature: 'hover' as const,
            pressureClass: 'hot' as const,
            uri: 'file:///w_main.srw',
            documentVersion: 1,
            kbVersion: 2,
            documentFingerprint: 'fp-hover',
            sourceOrigin: 'workspace-ws_objects' as const,
            locale: 'es',
            line: 5,
            character: 7,
            context: 'symbol:hover',
          },
        },
        {
          id: 'completion',
          descriptor: {
            cacheClass: 'serving' as const,
            feature: 'completion' as const,
            pressureClass: 'hot' as const,
            uri: 'file:///w_main.srw',
            documentVersion: 1,
            kbVersion: 2,
            documentFingerprint: 'fp-completion',
            sourceOrigin: 'workspace-ws_objects' as const,
            locale: 'es',
            line: 5,
            character: 7,
            prefix: 'mes',
            context: 'member-completion',
            triggerKind: 1,
            triggerCharacter: '.',
          },
        },
        {
          id: 'semanticTokens',
          descriptor: {
            cacheClass: 'serving' as const,
            feature: 'semanticTokens' as const,
            pressureClass: 'hot' as const,
            uri: 'file:///w_main.srw',
            documentVersion: 1,
            kbVersion: 2,
            documentFingerprint: 'fp-tokens',
            sourceOrigin: 'workspace-ws_objects' as const,
            locale: 'es',
          },
        },
      ];

      for (const sample of samples) {
        const registryEntry = CACHE_DESCRIPTOR_REGISTRY.get(sample.id)!;
        const key = buildInteractiveServingCacheKey(sample.descriptor);
        const matcher = buildInteractiveServingStaleKeyMatcher(sample.descriptor);
        assert.ok(registryEntry.invalidationPolicies.includes('document-fingerprint'));
        if (sample.id !== 'documentSymbols' && sample.id !== 'hover-negative') {
          assert.ok(registryEntry.invalidationPolicies.includes('kb-version'));
        }
        assert.ok(matcher(key), `El stale matcher debe reconocer la key de '${sample.id}'.`);
      }
    });
  });

  suite('CacheDescriptorRegistry instancia aislada', () => {
    let registry: CacheDescriptorRegistry;

    setup(() => {
      registry = new CacheDescriptorRegistry();
    });

    test('registro y get básico', () => {
      const descriptor: CacheDescriptor = {
        id: 'test-cache',
        owner: 'TestOwner',
        pressureClass: 'hot',
        invalidationPolicies: ['document-fingerprint'],
        stalePolicy: 'strict',
        budgetMs: 100,
      };
      registry.register(descriptor);
      assert.deepEqual(registry.get('test-cache'), descriptor);
    });

    test('get retorna undefined para id desconocido', () => {
      assert.equal(registry.get('inexistente'), undefined);
    });

    test('getAll retorna todos los registrados', () => {
      registry.register({ id: 'a', owner: 'O', pressureClass: 'hot', invalidationPolicies: [], stalePolicy: 'strict' });
      registry.register({ id: 'b', owner: 'O', pressureClass: 'heavy', invalidationPolicies: [], stalePolicy: 'strict' });
      assert.equal(registry.getAll().length, 2);
    });
  });
});
