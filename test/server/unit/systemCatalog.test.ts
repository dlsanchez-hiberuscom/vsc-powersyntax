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

  test('listByDomain publica el subconjunto inicial de datawindow-properties', () => {
    const properties = catalog.listByDomain('datawindow-properties');
    assert.ok(properties.length >= 7, `datawindow-properties=${properties.length}`);

    const propertyNames = new Set(properties.map((entry) => entry.name));
    assert.ok(propertyNames.has('DataWindow'));
    assert.ok(propertyNames.has('DataWindow.Syntax'));
    assert.ok(propertyNames.has('DataWindow.DataObject'));
    assert.ok(propertyNames.has('DataWindow.Table.Select'));
    assert.ok(propertyNames.has('dddw.name'));

    for (const entry of properties) {
      assert.equal(entry.kind, 'property');
      assert.equal(entry.domain, 'datawindow-properties');
      assert.equal(entry.namespace, 'datawindow');
    }
  });

  test('findByDomainAndLookupKey resuelve DataWindow.Table.Select y dddw.name', () => {
    const selectEntries = catalog.findByDomainAndLookupKey('datawindow-properties', 'DataWindow.Table.Select');
    const dddwEntries = catalog.findByDomainAndLookupKey('datawindow-properties', 'dddw.name');
    const syntaxEntries = catalog.findByDomainAndLookupKey('datawindow-properties', 'DataWindow.Syntax');

    assert.ok(selectEntries.some((entry) => entry.name === 'DataWindow.Table.Select'));
    assert.ok(dddwEntries.some((entry) => entry.name === 'dddw.name'));
    assert.ok(syntaxEntries.some((entry) => entry.name === 'DataWindow.Syntax'));
  });

  test('datawindow-expression-functions publica el catálogo oficial y separa CurrentRow de PowerScript general', () => {
    const expressionFunctions = catalog.listDataWindowExpressionFunctions();
    const currentRow = catalog.resolveDataWindowExpressionFunction('CurrentRow');

    assert.ok(expressionFunctions.length >= 100, `datawindow-expression-functions=${expressionFunctions.length}`);
    assert.ok(currentRow);
    assert.equal(currentRow?.domain, 'datawindow-expression-functions');
    assert.equal(currentRow?.namespace, 'datawindow-expression');
    assert.match(currentRow?.summary ?? '', /expresión DataWindow/i);
  });

  test('isKnownOwnerType reconoce ancestros nativos y raíces runtime como crypterobject/powerobject', () => {
    assert.equal(catalog.isKnownOwnerType('crypterobject'), true);
    assert.equal(catalog.isKnownOwnerType('CrypterObject'), true);
    assert.equal(catalog.isKnownOwnerType('powerobject'), true);
    assert.equal(catalog.isKnownOwnerType('runtimeerror'), true);
    assert.equal(catalog.isKnownOwnerType('throwable'), true);
    assert.equal(catalog.isKnownOwnerType('tipo_que_no_existe'), false);
  });
});
