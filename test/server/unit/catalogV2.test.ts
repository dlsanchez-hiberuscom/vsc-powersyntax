import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';

suite('unit/catalogV2 (B318)', () => {
  let catalog: SystemCatalog;

  setup(() => {
    catalog = new SystemCatalog();
  });

  // -- Backward compatibility ------------------------------------------

  test('backward: catálogo combinado supera 1500 símbolos (crecido por v2)', () => {
    assert.ok(catalog.size() > 1500, `size=${catalog.size()}`);
  });

  test('backward: findSystemSymbol("messagebox") sigue funcionando', () => {
    const results = catalog.findSystemSymbol('messagebox');
    assert.ok(results.length > 0);
    assert.equal(results[0].name, 'MessageBox');
    assert.equal(results[0].domain, 'global-functions');
    assert.equal(results[0].kind, 'callable');
  });

  test('backward: listGlobalFunctions sigue devolviendo > 50', () => {
    assert.ok(catalog.listGlobalFunctions().length > 50);
  });

  test('backward: listEvents sigue devolviendo > 50', () => {
    assert.ok(catalog.listEvents().length > 50);
  });

  test('backward: listStatements sigue devolviendo >= 16', () => {
    assert.ok(catalog.listStatements().length >= 16);
  });

  test('backward: categorías mínimas manual-core + generated', () => {
    const r = buildCatalogConsistencyReport();
    assert.ok((r.datasetCounts['manual-core'] ?? 0) > 0);
    assert.ok((r.datasetCounts['generated'] ?? 0) > 0);
  });

  test('backward: sin duplicados ni signatures vacías', () => {
    const r = buildCatalogConsistencyReport();
    assert.equal(r.duplicateIds.length, 0, `dups: ${r.duplicateIds.slice(0, 5).join(',')}`);
    assert.equal(r.missingSignatures.length, 0, `missing sigs: ${r.missingSignatures.slice(0, 5).join(',')}`);
    assert.equal(r.emptyName.length, 0);
  });

  test('backward: domain counts suman al total', () => {
    const r = buildCatalogConsistencyReport();
    const sum = Object.values(r.domainCounts).reduce((a, b) => a + b, 0);
    assert.equal(sum, r.total);
  });

  test('backward: todas las entries tienen provenance, dataset, id y normalizedName', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      if (!e.provenance || !e.dataset || !e.id || !e.normalizedName) bad++;
    }
    assert.equal(bad, 0, `entries sin metadata: ${bad}`);
  });

  test('backward: lookup keys no vacíos y en lower-case', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      if (!e.lookupKeys || e.lookupKeys.length === 0) { bad++; continue; }
      for (const k of e.lookupKeys) {
        if (k !== k.toLowerCase()) { bad++; break; }
      }
    }
    assert.equal(bad, 0);
  });

  // -- Catalog v2: new domains present ---------------------------------

  test('v2: keywords domain tiene entradas', () => {
    const kws = catalog.listKeywords();
    assert.ok(kws.length >= 30, `keywords=${kws.length}`);
    for (const kw of kws) {
      assert.equal(kw.kind, 'keyword');
      assert.equal(kw.domain, 'keywords');
      assert.equal(kw.namespace, 'powerscript');
    }
  });

  test('v2: reserved-words domain tiene entradas', () => {
    const rws = catalog.listReservedWords();
    assert.ok(rws.length >= 10, `reserved-words=${rws.length}`);
    for (const rw of rws) {
      assert.equal(rw.kind, 'reserved-word');
      assert.equal(rw.domain, 'reserved-words');
    }
  });

  test('v2: datatypes domain tiene entradas', () => {
    const dts = catalog.listDatatypes();
    assert.ok(dts.length >= 15, `datatypes=${dts.length}`);
    for (const dt of dts) {
      assert.equal(dt.kind, 'datatype');
      assert.equal(dt.domain, 'datatypes');
    }
  });

  test('v2: system-object-datatypes domain tiene entradas', () => {
    const sts = catalog.listSystemTypes();
    assert.ok(sts.length >= 20, `system-types=${sts.length}`);
    for (const st of sts) {
      assert.equal(st.kind, 'system-type');
      assert.equal(st.domain, 'system-object-datatypes');
      assert.equal(st.namespace, 'powerbuilder-runtime');
    }
  });

  test('v2: pronouns domain tiene entradas', () => {
    const ps = catalog.listPronouns();
    assert.ok(ps.length >= 4, `pronouns=${ps.length}`);
    for (const p of ps) {
      assert.equal(p.kind, 'pronoun');
      assert.equal(p.domain, 'pronouns');
    }
  });

  test('v2: operators domain tiene entradas', () => {
    const ops = catalog.listOperators();
    assert.ok(ops.length >= 10, `operators=${ops.length}`);
    for (const op of ops) {
      assert.equal(op.kind, 'operator');
      assert.equal(op.domain, 'operators');
    }
  });

  test('v2: system-globals domain tiene entradas', () => {
    const sgs = catalog.listSystemGlobals();
    assert.ok(sgs.length >= 5, `system-globals=${sgs.length}`);
    for (const sg of sgs) {
      assert.equal(sg.kind, 'system-global');
      assert.equal(sg.domain, 'system-globals');
      assert.equal(sg.namespace, 'powerbuilder-runtime');
    }
  });

  test('v2: enumerated-values domain tiene entradas', () => {
    const evs = catalog.listEnumeratedValues();
    assert.ok(evs.length >= 5, `enumerated-values=${evs.length}`);
    for (const ev of evs) {
      assert.equal(ev.kind, 'enumerated-value');
      assert.equal(ev.domain, 'enumerated-values');
    }
  });

  // -- Catalog v2: resolve functions -----------------------------------

  test('v2: resolveKeyword("if") devuelve keyword IF', () => {
    const kw = catalog.resolveKeyword('if');
    assert.ok(kw, 'debe resolver IF');
    assert.equal(kw.name, 'IF');
    assert.equal(kw.kind, 'keyword');
  });

  test('v2: resolveKeyword("IF") es case-insensitive', () => {
    const r1 = catalog.resolveKeyword('if');
    const r2 = catalog.resolveKeyword('IF');
    const r3 = catalog.resolveKeyword('If');
    assert.ok(r1 && r2 && r3);
    assert.equal(r1.id, r2.id);
    assert.equal(r2.id, r3.id);
  });

  test('v2: resolveDatatype("integer") devuelve datatype Integer', () => {
    const dt = catalog.resolveDatatype('integer');
    assert.ok(dt, 'debe resolver Integer');
    assert.equal(dt.name, 'Integer');
    assert.equal(dt.kind, 'datatype');
  });

  test('v2: resolveDatatype("Window") devuelve system-type Window', () => {
    const dt = catalog.resolveDatatype('Window');
    assert.ok(dt, 'debe resolver Window');
    assert.equal(dt.name, 'Window');
    assert.equal(dt.kind, 'system-type');
  });

  test('v2: resolveSystemGlobal("SQLCA") devuelve system-global SQLCA', () => {
    const sg = catalog.resolveSystemGlobal('SQLCA');
    assert.ok(sg, 'debe resolver SQLCA');
    assert.equal(sg.name, 'SQLCA');
    assert.equal(sg.kind, 'system-global');
  });

  test('v2: resolvePronoun("this") devuelve pronoun This', () => {
    const p = catalog.resolvePronoun('this');
    assert.ok(p, 'debe resolver This');
    assert.equal(p.name, 'This');
    assert.equal(p.kind, 'pronoun');
  });

  test('v2: resolveLanguageSymbol("if") encuentra keyword', () => {
    const sym = catalog.resolveLanguageSymbol('if');
    assert.ok(sym, 'debe resolver IF como language symbol');
    assert.equal(sym.kind, 'keyword');
  });

  test('v2: resolveLanguageSymbol("integer") encuentra datatype', () => {
    const sym = catalog.resolveLanguageSymbol('integer');
    assert.ok(sym, 'debe resolver Integer como language symbol');
    assert.equal(sym.kind, 'datatype');
  });

  test('v2: resolveLanguageSymbol("SQLCA") encuentra system-global', () => {
    const sym = catalog.resolveLanguageSymbol('SQLCA');
    assert.ok(sym, 'debe resolver SQLCA como language symbol');
    assert.equal(sym.kind, 'system-global');
  });

  test('v2: resolveLanguageSymbol("this") encuentra pronoun', () => {
    const sym = catalog.resolveLanguageSymbol('this');
    assert.ok(sym, 'debe resolver This como language symbol');
    assert.equal(sym.kind, 'pronoun');
  });

  test('v2: resolveLanguageSymbol no interfiere con callables (MessageBox)', () => {
    const sym = catalog.resolveLanguageSymbol('MessageBox');
    assert.equal(sym, undefined, 'MessageBox es callable, no language symbol');
  });

  // -- Consistency report v2 -------------------------------------------

  test('v2: kindCounts incluye nuevos kinds', () => {
    const r = buildCatalogConsistencyReport();
    assert.ok((r.kindCounts['callable'] ?? 0) > 0, 'callable');
    assert.ok((r.kindCounts['event'] ?? 0) > 0, 'event');
    assert.ok((r.kindCounts['statement'] ?? 0) > 0, 'statement');
    assert.ok((r.kindCounts['keyword'] ?? 0) > 0, 'keyword');
    assert.ok((r.kindCounts['datatype'] ?? 0) > 0, 'datatype');
    assert.ok((r.kindCounts['system-type'] ?? 0) > 0, 'system-type');
    assert.ok((r.kindCounts['pronoun'] ?? 0) > 0, 'pronoun');
    assert.ok((r.kindCounts['operator'] ?? 0) > 0, 'operator');
    assert.ok((r.kindCounts['system-global'] ?? 0) > 0, 'system-global');
    assert.ok((r.kindCounts['enumerated-value'] ?? 0) > 0, 'enumerated-value');
  });

  test('v2: kindCounts suman al total', () => {
    const r = buildCatalogConsistencyReport();
    const sum = Object.values(r.kindCounts).reduce((a, b) => a + b, 0);
    assert.equal(sum, r.total);
  });

  test('v2: domain counts incluyen nuevos dominios', () => {
    const r = buildCatalogConsistencyReport();
    assert.ok((r.domainCounts['keywords'] ?? 0) > 0, 'keywords');
    assert.ok((r.domainCounts['reserved-words'] ?? 0) > 0, 'reserved-words');
    assert.ok((r.domainCounts['datatypes'] ?? 0) > 0, 'datatypes');
    assert.ok((r.domainCounts['system-object-datatypes'] ?? 0) > 0, 'system-object-datatypes');
    assert.ok((r.domainCounts['pronouns'] ?? 0) > 0, 'pronouns');
    assert.ok((r.domainCounts['operators'] ?? 0) > 0, 'operators');
    assert.ok((r.domainCounts['system-globals'] ?? 0) > 0, 'system-globals');
    assert.ok((r.domainCounts['enumerated-values'] ?? 0) > 0, 'enumerated-values');
  });

  // -- Datatype aliases ------------------------------------------------

  test('v2: alias "int" resuelve Integer', () => {
    const dt = catalog.resolveDatatype('int');
    assert.ok(dt, 'debe resolver int como alias de Integer');
    assert.equal(dt.name, 'Integer');
  });

  test('v2: alias "dec" resuelve Decimal', () => {
    const dt = catalog.resolveDatatype('dec');
    assert.ok(dt, 'debe resolver dec como alias de Decimal');
    assert.equal(dt.name, 'Decimal');
  });

  test('v2: alias "char" resuelve Char', () => {
    const dt = catalog.resolveDatatype('char');
    assert.ok(dt, 'debe resolver char');
    assert.equal(dt.name, 'Char');
  });
});
