import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';

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

  // -- Catálogo extendido (manual + generated) -----------------------

  test('catálogo combinado supera 1500 símbolos', () => {
    assert.ok(catalog.size() > 1500, `size=${catalog.size()}`);
  });

  test('categorías mínimas no vacías', () => {
    assert.ok(catalog.listGlobalFunctions().length > 50);
    assert.ok(catalog.listObjectFunctions().length > 100);
    assert.ok(catalog.listDataWindowFunctions().length > 100);
    assert.ok(catalog.listEvents().length > 50);
    assert.ok(catalog.listStatements().length >= 16);
  });

  test('todas las entries tienen provenance, dataset, id y normalizedName', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      if (!e.provenance || !e.dataset || !e.id || !e.normalizedName) bad++;
    }
    assert.equal(bad, 0, `entries sin metadata: ${bad}`);
  });

  test('listByDataset distingue manual-core vs generated y suma al total', () => {
    const manual = catalog.listByDataset('manual-core');
    const generated = catalog.listByDataset('generated');
    assert.ok(manual.length > 0);
    assert.ok(generated.length > 0);
    assert.equal(manual.length + generated.length, catalog.size());
  });

  test('listMembersForOwner filtra por datawindow', () => {
    const members = catalog.listMembersForOwner(['datawindow']);
    assert.ok(members.length > 0);
    for (const m of members) {
      assert.ok(
        m.normalizedOwnerTypes.length === 0 ||
          m.normalizedOwnerTypes.includes('datawindow'),
        `${m.name} ownerTypes=${m.normalizedOwnerTypes.join(',')}`
      );
    }
  });

  test('isKnownOwnerType reconoce ancestros nativos como crypterobject', () => {
    assert.equal(catalog.isKnownOwnerType('crypterobject'), true);
    assert.equal(catalog.isKnownOwnerType('CrypterObject'), true);
    assert.equal(catalog.isKnownOwnerType('tipo_que_no_existe'), false);
  });
});
