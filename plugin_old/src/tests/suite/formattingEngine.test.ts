import * as assert from 'assert';
import {
    PowerBuilderFormattingOptions,
    formatPowerBuilderText,
} from '../../features/direct-api-ide/formatting/formatPowerBuilderDocument';

const DEFAULT_OPTIONS: PowerBuilderFormattingOptions = {
    indentSize: 3,
    continuationIndentSize: 3,
    indentStyle: 'spaces',
    keywordCase: 'upper',
    statementCase: 'upper',
    declarationKeywordCase: 'preserve',
    typeCase: 'preserve',
    eventKeywordCase: 'preserve',
    systemFunctionCase: 'catalog',
    preserveUserIdentifierCase: true,
    userCallableCase: 'preserve',
    sqlKeywordCase: 'upper',
    trimTrailingWhitespace: true,
    normalizeBlankLines: 'preserve',
    spacesInsideParentheses: false,
    oneStatementPerLine: false,
    spaceAfterComma: true,
    spaceAroundOperators: true,
    blankLineBetweenSections: false,
    preserveComments: true,
    preserveStrings: true,
    preserveManualLineBreaksInSql: true,
    conservativeEmbeddedSqlFormatting: true,
};

suite('FormattingEngine', () => {
    test('indenta bloques ejecutables y mantiene declaraciones en su estilo por defecto', () => {
        const input = [
            'event open;',
            'if 1 = 1 then',
            'messagebox("Hola", "Mundo")',
            'elseif 2 = 2 then',
            'return',
            'else',
            'create n_service inv_service',
            'end if',
            'end event',
        ].join('\n');

        const formatted = formatPowerBuilderText(input, DEFAULT_OPTIONS);

        assert.strictEqual(formatted, [
            'event open;',
            'IF 1 = 1 THEN',
            '   MessageBox("Hola", "Mundo")',
            'ELSEIF 2 = 2 THEN',
            '   RETURN',
            'ELSE',
            '   CREATE n_service inv_service',
            'END IF',
            'end event',
        ].join('\n'));
    });

    test('normaliza funciones globales del sistema y preserva callables de usuario conocidos', () => {
        const input = [
            'ls_value = lower(right(as_value, 1))',
            'll_today = today()',
            'ls_user = uf_today(today())',
        ].join('\n');

        const formatted = formatPowerBuilderText(
            input,
            DEFAULT_OPTIONS,
            {
                isUserCallable: name => name.toLowerCase() === 'today',
            },
        );

        assert.strictEqual(formatted, [
            'ls_value = Lower(Right(as_value, 1))',
            'll_today = today()',
            'ls_user = uf_today(today())',
        ].join('\n'));
    });

    test('da formato conservador a SELECT embebido con columnas, INTO y condiciones separadas', () => {
        const input = 'select emp_id, emp_name into :ll_id, :ls_name from employee e join department d on d.dept_id = e.dept_id and d.active = \'Y\' where e.company_id = :ll_company_id and e.active = \'Y\' with ur;';

        const formatted = formatPowerBuilderText(input, DEFAULT_OPTIONS);

        assert.strictEqual(formatted, [
            'SELECT',
            '   emp_id,',
            '   emp_name',
            'INTO',
            '   :ll_id,',
            '   :ls_name',
            'FROM employee e',
            'JOIN department d ON d.dept_id = e.dept_id AND',
            '   d.active = \'Y\'',
            'WHERE e.company_id = :ll_company_id AND',
            '   e.active = \'Y\'',
            'WITH UR;',
        ].join('\n'));
    });

    test('aplica espacios experimentales en llamadas con paréntesis sin tocar strings', () => {
        const formatted = formatPowerBuilderText(
            'ls_value = lower(right("A", 1))',
            {
                ...DEFAULT_OPTIONS,
                spacesInsideParentheses: true,
            },
        );

        assert.strictEqual(formatted, 'ls_value = Lower ( Right ( "A", 1 ) )');
    });

    test('corrige líneas colapsadas experimentales cuando el patrón es inequívoco', () => {
        const formatted = formatPowerBuilderText(
            [
                'as_valor =      "4"',
                'll_a = 1;ll_b = 2',
            ].join('\n'),
            {
                ...DEFAULT_OPTIONS,
                oneStatementPerLine: true,
            },
        );

        assert.strictEqual(formatted, [
            'as_valor = "4"',
            'll_a = 1',
            'll_b = 2',
        ].join('\n'));
    });

    test('preserva strings y comentarios mientras normaliza keywords ejecutables y SQL seguras', () => {
        const formatted = formatPowerBuilderText(
            [
                'choose case ll_state',
                'case 1',
                'try',
                'messagebox("if then lower", "// if lower") // elseif catch finally',
                'catch (runtimeerror re)',
                'finally',
                'end try',
                'case else',
                'end choose',
                'execute immediate :ls_sql using local;',
            ].join('\n'),
            DEFAULT_OPTIONS,
        );

        assert.strictEqual(formatted, [
            'CHOOSE CASE ll_state',
            'CASE 1',
            '   TRY',
            '      MessageBox("if then lower", "// if lower") // elseif catch finally',
            '   CATCH (runtimeerror re)',
            '   FINALLY',
            '   END TRY',
            'CASE ELSE',
            'END CHOOSE',
            'EXECUTE immediate :ls_sql USING LOCAL;',
        ].join('\n'));
    });

    test('separa statement, type y event case sin tocar identificadores de usuario', () => {
        const formatted = formatPowerBuilderText(
            [
                'event open;',
                'type variables',
                'integer li_total',
                'end variables',
                'if li_total=1 then',
                'messagebox(ls_title,li_total)',
                'end if',
                'end event',
            ].join('\n'),
            {
                ...DEFAULT_OPTIONS,
                statementCase: 'lower',
                typeCase: 'upper',
                eventKeywordCase: 'lower',
            },
        );

        assert.strictEqual(formatted, [
            'event open;',
            'TYPE VARIABLES',
            '   integer li_total',
            'END VARIABLES',
            'if li_total = 1 then',
            '   MessageBox(ls_title, li_total)',
            'end if',
            'end event',
        ].join('\n'));
    });

    test('preserva saltos manuales en SQL embebido cuando la opción está activa', () => {
        const formatted = formatPowerBuilderText(
            [
                'select emp_id, emp_name',
                'into :ll_id, :ls_name',
                'from employee',
                'where emp_id = :ll_id;',
            ].join('\n'),
            {
                ...DEFAULT_OPTIONS,
                preserveManualLineBreaksInSql: true,
            },
        );

        assert.strictEqual(formatted, [
            'SELECT emp_id, emp_name',
            'INTO :ll_id, :ls_name',
            'FROM employee',
            'WHERE emp_id = :ll_id;',
        ].join('\n'));
    });
});