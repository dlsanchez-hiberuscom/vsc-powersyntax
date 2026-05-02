import * as assert from 'assert/strict';

import { formatPowerBuilderText } from '../../../src/shared/formatting/powerBuilderFormatter';

suite('unit/powerBuilderFormatter (B067)', () => {
  test('indenta bloques y aplica casing configurable sin tocar identificadores de usuario', () => {
    const input = [
      'event open();',
      'if li_total=1 then',
      'messagebox(ls_title,li_total)',
      'else',
      'return',
      'end if',
      'end event'
    ].join('\n');

    const formatted = formatPowerBuilderText(input, {
      statementCase: 'upper',
      eventKeywordCase: 'lower',
      indentSize: 3,
    });

    assert.equal(formatted, [
      'event open();',
      '   IF li_total = 1 THEN',
      '      messagebox(ls_title, li_total)',
      '   ELSE',
      '      RETURN',
      '   END IF',
      'end event'
    ].join('\n'));
  });

  test('preserva strings y comentarios mientras normaliza el código circundante', () => {
    const input = [
      'if li_total=1 then // if no debe tocarse',
      'messagebox("if then", "x=y")',
      'end if'
    ].join('\n');

    const formatted = formatPowerBuilderText(input, {
      statementCase: 'upper',
      indentSize: 2,
    });

    assert.equal(formatted, [
      'IF li_total = 1 THEN // if no debe tocarse',
      '  messagebox("if then", "x=y")',
      'END IF'
    ].join('\n'));
  });

  test('usa tabs cuando se configura y compacta líneas en blanco consecutivas', () => {
    const input = [
      'try',
      '',
      '',
      'return',
      'end try'
    ].join('\n');

    const formatted = formatPowerBuilderText(input, {
      statementCase: 'upper',
      indentStyle: 'tabs',
      normalizeBlankLines: 'compact',
    });

    assert.equal(formatted, [
      'TRY',
      '',
      '\tRETURN',
      'END TRY'
    ].join('\n'));
  });
});