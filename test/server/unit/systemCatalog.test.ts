import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/systemCatalog', () => {
  let catalog: SystemCatalog;

  setup(() => {
    // Instanciar el catálogo cargará y parseará todos los datasets manuales
    catalog = new SystemCatalog();
  });

  test('SystemCatalog carga funciones globales comunes (MessageBox)', () => {
    const results = catalog.findSystemSymbol('messagebox');
    assert.ok(results.length > 0, 'Debe encontrar MessageBox');
    
    const msgBox = results[0];
    assert.equal(msgBox.name, 'MessageBox');
    assert.equal(msgBox.domain, 'global-functions');
    assert.ok(msgBox.signatures.length > 0, 'Debe tener al menos una firma');
  });

  test('SystemCatalog es case-insensitive', () => {
    const r1 = catalog.findSystemSymbol('TRIM');
    const r2 = catalog.findSystemSymbol('trim');
    const r3 = catalog.findSystemSymbol('Trim');

    assert.ok(r1.length > 0);
    assert.equal(r1[0].name, 'Trim');
    assert.equal(r2[0].name, 'Trim');
    assert.equal(r3[0].name, 'Trim');
  });

  test('SystemCatalog devuelve array vacío para símbolos inexistentes', () => {
    const results = catalog.findSystemSymbol('una_funcion_que_no_existe_123');
    assert.equal(results.length, 0);
  });

  test('SystemCatalog carga eventos del sistema (Clicked)', () => {
    const results = catalog.findSystemSymbol('clicked');
    assert.ok(results.length > 0, 'Debe encontrar el evento Clicked');
    assert.equal(results[0].kind, 'event');
  });

  test('SystemCatalog soporta lookupAliases', () => {
    // Un objeto común puede tener alias, verifiquemos si encontramos uno
    // En PowerBuilder, funciones como LeftW -> Left están en los obsoletos
    const results = catalog.findSystemSymbol('LeftW');
    assert.ok(results.length > 0, 'Debe encontrar LeftW');
    assert.equal(results[0].obsolete, true);
  });
});
