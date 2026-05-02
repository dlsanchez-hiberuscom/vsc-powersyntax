import * as assert from 'assert/strict';

import { formatDocument } from '../../../src/server/features/formatDocument';

suite('unit/formatDocument (B227)', () => {
  test('formatea en servidor cuando el documento está dentro del presupuesto', () => {
    const result = formatDocument({
      text: ['if li_total=1 then', 'messagebox(ls_title,li_total)', 'end if'].join('\n'),
      lineEnding: '\n',
      maxDocumentChars: 1000,
      maxDocumentLines: 100,
      options: { statementCase: 'upper', indentSize: 3 },
    });

    assert.equal(result.status, 'formatted');
    assert.equal(result.formattedText, ['IF li_total = 1 THEN', '   messagebox(ls_title, li_total)', 'END IF'].join('\n'));
    assert.ok(result.elapsedMs >= 0);
  });

  test('devuelve unchanged cuando el formatter no necesita cambios', () => {
    const input = ['IF li_total = 1 THEN', '   RETURN', 'END IF'].join('\n');
    const result = formatDocument({
      text: input,
      lineEnding: '\n',
      maxDocumentChars: 1000,
      maxDocumentLines: 100,
      options: { statementCase: 'upper', indentSize: 3 },
    });

    assert.equal(result.status, 'unchanged');
    assert.equal(result.formattedText, undefined);
  });

  test('omite el formato cuando excede el presupuesto de caracteres', () => {
    const result = formatDocument({
      text: 'a'.repeat(32),
      lineEnding: '\n',
      maxDocumentChars: 8,
      maxDocumentLines: 100,
      options: {},
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.skipReason, 'max-document-chars');
    assert.match(result.detail ?? '', /32 caracteres exceden el presupuesto de 8/);
  });

  test('omite el formato cuando excede el presupuesto de líneas', () => {
    const result = formatDocument({
      text: ['a', 'b', 'c', 'd'].join('\n'),
      lineEnding: '\n',
      maxDocumentChars: 100,
      maxDocumentLines: 3,
      options: {},
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.skipReason, 'max-document-lines');
    assert.match(result.detail ?? '', /4 líneas exceden el presupuesto de 3/);
  });
});