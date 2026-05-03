import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { PB_MANUAL_CORE_OWNER_TYPE_GROUPS } from '../../../src/server/knowledge/system/manual';
import { getNativeAncestorChain } from '../../../src/server/knowledge/system/nativeAncestors';
import { PB_BUILTIN_TYPES } from '../../../src/server/parsing/grammar';

suite('unit/visualCatalogDatatypes (B358)', () => {
  let catalog: SystemCatalog;

  setup(() => {
    catalog = new SystemCatalog();
  });

  test('tipos visuales avanzados resuelven con categoría coherente y viven en PB_BUILTIN_TYPES', () => {
    const expected = [
      ['MDIFrame', 'Objetos visuales'],
      ['MDIClient', 'Objetos visuales'],
      ['MenuCascade', 'Objetos visuales'],
      ['RibbonApplicationMenu', 'Controles Ribbon'],
      ['RibbonPanelItem', 'Controles Ribbon'],
      ['OLEControl', 'OLE visual'],
      ['WindowActiveX', 'OLE visual'],
    ] as const;

    for (const [typeName, category] of expected) {
      const dt = catalog.resolveDatatype(typeName);
      assert.ok(dt, `debe resolver ${typeName}`);
      assert.equal(dt?.kind, 'system-type');
      assert.equal(dt?.category, category);
      assert.equal(PB_BUILTIN_TYPES.has(typeName.toLowerCase()), true, `${typeName} debe vivir también en PB_BUILTIN_TYPES`);
    }
  });

  test('Application queda clasificado como tipo runtime/system y no como visual', () => {
    const dt = catalog.resolveDatatype('Application');
    assert.ok(dt, 'debe resolver Application');
    assert.equal(dt?.category, 'Objetos de sistema');
  });

  test('owner groups y ancestros nativos cubren visuales avanzados', () => {
    for (const ownerType of ['mdiclient', 'windowactivex', 'ribbonapplicationmenu']) {
      assert.equal(PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object.includes(ownerType), true, `${ownerType} debe pertenecer a owner groups manuales`);
    }

    assert.ok(getNativeAncestorChain('MDIClient').includes('window'));
    assert.ok(getNativeAncestorChain('MenuCascade').includes('menu'));
    assert.ok(getNativeAncestorChain('RibbonApplicationMenu').includes('ribbonmenu'));
  });
});