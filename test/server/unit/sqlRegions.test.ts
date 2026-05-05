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

  test('detecta statements adicionales de SQL embebido', () => {
    const src = [
      'CONNECT USING SQLCA;',
      'DECLARE sales_cur CURSOR FOR SELECT id FROM sales_order;',
      'OPEN sales_cur;',
      'FETCH sales_cur INTO :ll_order_id;',
      'CLOSE sales_cur;',
      'PREPARE SQLSA FROM :ls_stmt;',
      'COMMIT USING SQLCA;',
      'ROLLBACK USING SQLCA;',
    ].join('\n');

    const r = findSqlRegions(src);
    assert.deepEqual(r.map((region) => region.keyword), [
      'CONNECT',
      'DECLARE',
      'OPEN',
      'FETCH',
      'CLOSE',
      'PREPARE',
      'COMMIT',
      'ROLLBACK',
    ]);
  });

  test('no confunde llamadas normales con SQL embebido', () => {
    const src = [
      'open(w_main)',
      'close(w_main)',
      'commit()',
      'rollback()',
    ].join('\n');

    assert.equal(findSqlRegions(src).length, 0);
  });

  test('linea normal no detecta SQL', () => {
    assert.equal(findSqlRegions('integer i\n').length, 0);
  });
});
