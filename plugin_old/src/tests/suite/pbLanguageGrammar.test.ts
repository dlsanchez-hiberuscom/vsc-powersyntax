import * as assert from 'assert';
import {
    createPbKeywordPattern,
    getExecutableBlockCloseKind,
    getExecutableBlockOpenKind,
    getStructureBlockOpenKind,
    isCatchStatement,
    isElseIfStatement,
    isFinallyStatement,
} from '../../powerbuilder/grammar/pbLanguageGrammar';

suite('PbLanguageGrammar', () => {
    test('detecta bloques ejecutables de apertura y cierre', () => {
        assert.strictEqual(
            getExecutableBlockOpenKind('if ll_rc = 0 then'),
            'IF',
        );

        assert.strictEqual(
            getExecutableBlockOpenKind('choose case ls_action'),
            'CHOOSE CASE',
        );

        assert.strictEqual(
            getExecutableBlockCloseKind('end if'),
            'IF',
        );

        assert.strictEqual(
            getExecutableBlockCloseKind('end try'),
            'TRY',
        );
    });

    test('suprime apertura callable en secciones de prototipos', () => {
        assert.strictEqual(
            getStructureBlockOpenKind(
                'public function long of_begin ()',
                { treatCallableDeclarationsAsBlockOpen: false },
            ),
            undefined,
        );

        assert.strictEqual(
            getStructureBlockOpenKind(
                'public function long of_begin ()',
                { treatCallableDeclarationsAsBlockOpen: true },
            ),
            'FUNCTION',
        );
    });

    test('no trata declaraciones externas como apertura de bloque callable', () => {
        assert.strictEqual(
            getStructureBlockOpenKind(
                'FUNCTION ulong GetSysColor (int index) LIBRARY "USER32.DLL"',
                { treatCallableDeclarationsAsBlockOpen: true },
            ),
            undefined,
        );
    });

    test('detecta transiciones IF y TRY', () => {
        assert.strictEqual(
            isElseIfStatement('elseif ll_rc = 0 then'),
            true,
        );

        assert.strictEqual(
            isCatchStatement('catch (runtimeerror ex)'),
            true,
        );

        assert.strictEqual(
            isFinallyStatement('finally'),
            true,
        );
    });

    test('el patrón de keywords soporta keywords multiword', () => {
        const pattern = createPbKeywordPattern();
        const matches = 'end if choose case end try'
            .match(pattern)
            ?.map(value => value.toLowerCase()) ?? [];

        assert.ok(matches.includes('end if'));
        assert.ok(matches.includes('choose case'));
        assert.ok(matches.includes('end try'));
    });
});