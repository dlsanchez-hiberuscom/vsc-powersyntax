import * as assert from 'assert/strict';
import { splitStatements } from '../../../src/server/parsing/statementSplitter';

suite('unit/statementSplitter (B095)', () => {
  test('une líneas con & continuation', () => {
    const stmts = splitStatements('a = 1 &\n  + 2');
    assert.equal(stmts.length, 1);
    assert.equal(stmts[0].startLine, 0);
    assert.equal(stmts[0].endLine, 1);
    assert.match(stmts[0].text, /a\s*=\s*1\s*\+\s*2/);
  });

  test('separa por ; en la misma línea', () => {
    const stmts = splitStatements('a; b');
    assert.equal(stmts.length, 2);
    assert.match(stmts[0].text, /^a$/);
    assert.match(stmts[1].text, /^b$/);
  });

  test('& dentro de comentario no une', () => {
    const stmts = splitStatements('a = 1 // & continuación falsa\nb = 2');
    assert.equal(stmts.length, 2);
  });

  test('preserva startLine/endLine', () => {
    const stmts = splitStatements('foo\nbar');
    assert.equal(stmts.length, 2);
    assert.equal(stmts[0].startLine, 0);
    assert.equal(stmts[1].startLine, 1);
  });

  test('ignora ; y & dentro de comentarios anidados', () => {
    const stmts = splitStatements([
      '/* outer /* inner ; */ still &',
      'continued */ a = 1'
    ].join('\n'));

    assert.equal(stmts.length, 1);
    assert.equal(stmts[0].text, 'a = 1');
    assert.equal(stmts[0].startLine, 1);
    assert.equal(stmts[0].endLine, 1);
  });
});
