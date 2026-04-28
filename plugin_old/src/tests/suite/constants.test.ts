import * as assert from 'assert';
import {
    PB_DATAWINDOW_FILE_EXTENSION,
    PB_FILE_EXTENSIONS,
    PB_IDE_SAFE_FILE_EXTENSIONS,
    PB_LANGUAGE_ID,
    PB_SELECTOR,
} from '../../core/config/constants';

suite('Constants', () => {
    test('PB_LANGUAGE_ID should be "powerbuilder"', () => {
        assert.strictEqual(PB_LANGUAGE_ID, 'powerbuilder');
    });

    test('PB_FILE_EXTENSIONS should contain expected extensions', () => {
        const expected = ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq'];
        for (const ext of expected) {
            assert.ok(PB_FILE_EXTENSIONS.includes(ext), `Should contain '${ext}'`);
        }
    });

    test('PB_SELECTOR should match language and file scheme', () => {
        assert.strictEqual(PB_SELECTOR.language, 'powerbuilder');
        assert.strictEqual(PB_SELECTOR.scheme, 'file');
    });

    test('PB_IDE_SAFE_FILE_EXTENSIONS should exclude datawindow by default', () => {
        assert.ok(PB_FILE_EXTENSIONS.includes(PB_DATAWINDOW_FILE_EXTENSION));
        assert.ok(!PB_IDE_SAFE_FILE_EXTENSIONS.includes(PB_DATAWINDOW_FILE_EXTENSION));
    });
});
