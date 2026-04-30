import * as assert from 'assert/strict';
import { validateRenameTarget } from '../../../src/server/features/renamePreflight';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/renamePreflight (B032)', () => {
  const cat = new SystemCatalog();

  test('acepta identificador correcto', () => {
    assert.equal(validateRenameTarget('of_doSomething').ok, true);
  });

  test('rechaza palabra reservada', () => {
    assert.equal(validateRenameTarget('if').ok, false);
    assert.equal(validateRenameTarget('END').ok, false);
  });

  test('rechaza identificador inválido', () => {
    assert.equal(validateRenameTarget('123abc').ok, false);
    assert.equal(validateRenameTarget('').ok, false);
    assert.equal(validateRenameTarget('foo bar').ok, false);
  });

  test('rechaza colisión con SystemCatalog', () => {
    const r = validateRenameTarget('MessageBox', { systemCatalog: cat });
    assert.equal(r.ok, false);
  });
});
