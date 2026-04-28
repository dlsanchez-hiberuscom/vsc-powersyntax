import * as assert from 'assert';
import {
    createCodeMask,
    isCodeRange,
    stripCommentsFromLine,
    stripCommentsFromLines,
} from '../../core/utils/powerScriptLexingUtils';

suite('PowerScriptLexingUtils', () => {
    test('preserva // dentro de strings con ~" y elimina el comentario real', () => {
        const line = 'string ls = "~"//not comment~"" // real comment';
        const stripped = stripCommentsFromLine(line);

        assert.ok(stripped.includes('~"//not comment~""'));
        assert.ok(!stripped.includes('real comment'));
    });

    test('mantiene el estado de string entre líneas continuadas antes de quitar comentarios', () => {
        const stripped = stripCommentsFromLines([
            'string ls = "alpha&',
            '//beta" // trailing comment',
        ]);

        assert.strictEqual(stripped[0], 'string ls = "alpha&');
        assert.strictEqual(stripped[1], '//beta" ');
    });

    test('createCodeMask no convierte en comentario el texto tras ~" dentro de un string', () => {
        const text = 'string ls = "~"//inside~""; long ll_ok';
        const mask = createCodeMask(text);
        const identifierStart = text.indexOf('ll_ok');
        const stringInnerStart = text.indexOf('inside');

        assert.strictEqual(isCodeRange(mask, stringInnerStart, 'inside'.length), false);
        assert.strictEqual(isCodeRange(mask, identifierStart, 'll_ok'.length), true);
    });
});