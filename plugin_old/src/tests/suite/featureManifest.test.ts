import * as assert from 'assert';
import { FEATURE_MANIFEST } from '../../features/direct-api-ide/directApiFeatureManifest';

suite('FeatureManifest', () => {
    test('should have 19 features', () => {
        assert.strictEqual(FEATURE_MANIFEST.length, 19);
    });

    test('all features should have required fields', () => {
        for (const feature of FEATURE_MANIFEST) {
            assert.ok(feature.id, 'Feature should have an id');
            assert.ok(typeof feature.enabled === 'boolean', 'Feature should have enabled flag');
            assert.ok(feature.description, 'Feature should have a description');
        }
    });

    test('all feature IDs should be unique', () => {
        const ids = FEATURE_MANIFEST.map(f => f.id);
        const uniqueIds = new Set(ids);
        assert.strictEqual(ids.length, uniqueIds.size, 'Feature IDs should be unique');
    });

    test('should contain expected feature IDs', () => {
        const ids = FEATURE_MANIFEST.map(f => f.id);
        const expected = [
            'commands', 'diagnostics', 'diagnostics-panel', 'hover', 'definition', 'references',
            'rename', 'linked-editing', 'symbols', 'completion', 'signature-help', 'inlay-hints',
            'formatting', 'folding', 'semantic-tokens', 'codelens', 'code-actions', 'explorer', 'status-bar',
        ];
        for (const id of expected) {
            assert.ok(ids.includes(id), `Should contain feature '${id}'`);
        }
    });

    test('all features should be enabled by default', () => {
        for (const feature of FEATURE_MANIFEST) {
            assert.strictEqual(feature.enabled, true, `Feature '${feature.id}' should be enabled`);
        }
    });
});
