import * as assert from 'assert/strict';
import { findSqlRegions } from '../../../src/server/parsing/sqlRegions';

suite('unit/sqlRegions (B090)', () => {
  test('SELECT multilinea', () => {
    const src = 'SELECT id\nFROM t\nWHERE x=1;\n';
    const r = findSqlRegions(src);
    assert.equal(r.length, 1);
    assert.equal(r[0].keyword, 'SELECT');
    assert.equal(r[0].startLine, 0);
    assert.equal(r[0].endLine, 2);
  });

  test('UPDATE/INSERT/DELETE', () => {
    const src = 'UPDATE t SET x=1;\nINSERT INTO t VALUES (1);\nDELETE FROM t;\n';
    const r = findSqlRegions(src);
    assert.equal(r.length, 3);
  });

  test('linea normal no detecta SQL', () => {
    assert.equal(findSqlRegions('integer i\n').length, 0);
  });
});
