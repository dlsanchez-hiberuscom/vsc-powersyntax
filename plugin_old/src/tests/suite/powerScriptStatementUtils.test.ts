import * as assert from 'assert';
import { splitPowerBuilderStatements } from '../../core/utils/powerScriptStatementUtils';

suite('PowerScriptStatementUtils', () => {
    test('no separa por ; dentro de strings con ~"', () => {
        const statements = splitPowerBuilderStatements(
            'string ls = "~"a;b~""; long ll_ok',
        );

        assert.strictEqual(statements.length, 2);
        assert.strictEqual(statements[0].text, 'string ls = "~"a;b~""');
        assert.strictEqual(statements[1].text, 'long ll_ok');
    });
});