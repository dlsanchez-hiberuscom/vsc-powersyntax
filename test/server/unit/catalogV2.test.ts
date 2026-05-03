import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';
import { PB_BUILTIN_TYPES, PB_KEYWORDS } from '../../../src/server/parsing/grammar';

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

  test('v2: enumerated-types domain tiene entradas canónicas sin sufijo !', () => {
    const enumTypes = catalog.listEnumeratedTypes();
    assert.ok(enumTypes.length >= 5, `enumerated-types=${enumTypes.length}`);
    for (const enumType of enumTypes) {
      assert.equal(enumType.kind, 'enumerated-type');
      assert.equal(enumType.domain, 'enumerated-types');
      assert.equal(enumType.name.endsWith('!'), false);
    }
  });

  test('v2: enumerated-values domain tiene entradas', () => {
    const evs = catalog.listEnumeratedValues();
    assert.ok(evs.length >= 5, `enumerated-values=${evs.length}`);
    for (const ev of evs) {
      assert.equal(ev.kind, 'enumerated-value');
      assert.equal(ev.domain, 'enumerated-values');
      assert.equal(ev.name.endsWith('!'), true);
      assert.ok(ev.enumValueOf, `${ev.name} debe declarar enumValueOf`);
    }
  });

  test('v2: generated enum values amplían tipos manuales sin romper el merge por tipo', () => {
    const windowType = catalog.resolveEnumeratedType('WindowType');
    const secureProtocol = catalog.resolveEnumeratedType('SecureProtocol');
    const values = catalog.listEnumeratedValuesForType('WindowType').map((entry) => entry.name);

    assert.ok(windowType, 'debe resolver WindowType desde manual-core');
    assert.ok(secureProtocol, 'debe publicar SecureProtocol desde generated');
    assert.ok(values.includes('Main!'), 'WindowType debe conservar valores manuales');
    assert.ok(values.includes('MDIDock!'), 'WindowType debe incorporar valores oficiales generated');
    assert.ok(values.includes('MDIDockHelp!'), 'WindowType debe incorporar variantes oficiales generated');
  });

  test('v2: SecureProtocol mantiene explicación oficial sin inventar enumerated-values nominales', () => {
    const secureProtocol = catalog.resolveEnumeratedType('SecureProtocol');
    const values = catalog.listEnumeratedValuesForType('SecureProtocol');

    assert.ok(secureProtocol, 'debe resolver SecureProtocol desde generated');
    assert.match(secureProtocol?.documentation ?? '', /integer value|security protocol/i);
    assert.ok((secureProtocol?.allowedOnOwners?.length ?? 0) > 0, 'debe conservar applies-to oficial');
    assert.equal(values.length, 0, 'no debe inventar valores nominales con ! cuando la doc solo publica códigos enteros');
  });

  test('v2: tipos enumerados manual-core mantienen documentación útil', () => {
    const documentedTypes = [
      'Border',
      'Alignment',
      'FillPattern',
      'WindowType',
      'WindowState',
      'FileAccess',
      'FileMode',
      'Encoding',
      'SeekType',
    ];

    for (const name of documentedTypes) {
      const entry = catalog.resolveEnumeratedType(name);
      assert.ok(entry, `debe resolver ${name}`);
      assert.ok(entry?.documentation, `${name} debe exponer documentation`);
    }

    assert.ok(
      catalog.listEnumeratedValuesForType('FillPattern').length > 0,
      'FillPattern debe seguir resolviendo valores generated a través del merge por tipo',
    );
    assert.deepEqual(
      catalog.listEnumeratedValuesForType('SeekType').map((entry) => entry.name),
      ['FromBeginning!', 'FromCurrent!', 'FromEnd!'],
      'SeekType debe exponer los tres valores canónicos usados por FileSeek',
    );
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

  test('v2: resolveKeyword("public") cubre modifiers oficiales generados', () => {
    const kw = catalog.resolveKeyword('public');
    assert.ok(kw, 'debe resolver PUBLIC');
    assert.equal(kw.name, 'PUBLIC');
    assert.equal(kw.kind, 'keyword');
  });

  test('v2: resolveReservedWord("commit") cubre reserved words oficiales generados', () => {
    const rw = catalog.resolveReservedWord('commit');
    assert.ok(rw, 'debe resolver COMMIT');
    assert.equal(rw.name, 'COMMIT');
    assert.equal(rw.kind, 'reserved-word');
  });

  test('v2: PB_KEYWORDS queda alineado con keywords oficiales, reserved words oficiales y blockers explícitos', () => {
    assert.equal(PB_KEYWORDS.has('commit'), true);
    assert.equal(PB_KEYWORDS.has('namespace'), true);
    assert.equal(PB_KEYWORDS.has('with'), true);
    assert.equal(PB_KEYWORDS.has('sqlca'), true);
    assert.equal(PB_KEYWORDS.has('this'), true);
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

  test('v2: DataWindowChild queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('DataWindowChild');
    assert.ok(dt, 'debe resolver DataWindowChild');
    assert.equal(dt.name, 'DataWindowChild');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('datawindowchild'), true);
  });

  test('v2: HTTPClient queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('HTTPClient');
    assert.ok(dt, 'debe resolver HTTPClient');
    assert.equal(dt.name, 'HTTPClient');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('httpclient'), true);
  });

  test('v2: JSONParser queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('JSONParser');
    assert.ok(dt, 'debe resolver JSONParser');
    assert.equal(dt.name, 'JSONParser');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('jsonparser'), true);
  });

  test('v2: OAuthClient queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('OAuthClient');
    assert.ok(dt, 'debe resolver OAuthClient');
    assert.equal(dt.name, 'OAuthClient');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('oauthclient'), true);
  });

  test('v2: JSONGenerator queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('JSONGenerator');
    assert.ok(dt, 'debe resolver JSONGenerator');
    assert.equal(dt.name, 'JSONGenerator');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('jsongenerator'), true);
  });

  test('v2: JSONPackage queda alineado entre catálogo y Set rápido del parser', () => {
    const dt = catalog.resolveDatatype('JSONPackage');
    assert.ok(dt, 'debe resolver JSONPackage');
    assert.equal(dt.name, 'JSONPackage');
    assert.equal(dt.kind, 'system-type');
    assert.equal(PB_BUILTIN_TYPES.has('jsonpackage'), true);
  });

  test('v2: alias oficial UnsignedInt resuelve hacia UnsignedInteger y vive en PB_BUILTIN_TYPES', () => {
    const dt = catalog.resolveDatatype('UnsignedInt');
    assert.ok(dt, 'debe resolver UnsignedInt');
    assert.equal(dt?.name, 'UnsignedInteger');
    assert.equal(dt?.kind, 'datatype');
    assert.equal(PB_BUILTIN_TYPES.has('unsignedint'), true);
  });

  test('v2: system-object-datatypes oficiales generados quedan alineados entre catálogo y parser', () => {
    for (const typeName of ['SMTPClient', 'WindowObject', 'PDFAction', 'SyncParm', 'PowerServerResult']) {
      const dt = catalog.resolveDatatype(typeName);
      assert.ok(dt, `debe resolver ${typeName}`);
      assert.equal(dt?.kind, 'system-type');
      assert.equal(PB_BUILTIN_TYPES.has(typeName.toLowerCase()), true, `${typeName} debe vivir también en PB_BUILTIN_TYPES`);
    }
  });

  test('v2: tipos runtime curados del corpus permanecen alineados entre catálogo y parser', () => {
    for (const typeName of ['CommandButton', 'DropDownListBox', 'ListView', 'INet', 'InternetResult', 'MailRecipient', 'OAuthRequest', 'PDFDocument', 'EnumerationDefinition', 'TreeView', 'WebBrowser', 'RibbonBar', 'StaticText', 'UserObject', 'WSConnection']) {
      const dt = catalog.resolveDatatype(typeName);
      assert.ok(dt, `debe resolver ${typeName}`);
      assert.equal(dt?.kind, 'system-type');
      assert.equal(PB_BUILTIN_TYPES.has(typeName.toLowerCase()), true, `${typeName} debe vivir también en PB_BUILTIN_TYPES`);
    }
  });

  test('v2: resolveSystemGlobal("SQLCA") devuelve system-global SQLCA', () => {
    const sg = catalog.resolveSystemGlobal('SQLCA');
    assert.ok(sg, 'debe resolver SQLCA');
    assert.equal(sg.name, 'SQLCA');
    assert.equal(sg.kind, 'system-global');
    assert.equal(sg.valueType, 'Transaction');
    assert.equal(sg.risk, 'legacy');
  });

  test('v2: resolveSystemGlobal("SQLDA") expone tipo runtime para SQL dinámico', () => {
    const sg = catalog.resolveSystemGlobal('SQLDA');
    assert.ok(sg, 'debe resolver SQLDA');
    assert.equal(sg.valueType, 'DynamicDescriptionArea');
    assert.equal(sg.risk, 'legacy');
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

  test('v2: resolveLanguageSymbol("public") prioriza keyword oficial explícito', () => {
    const sym = catalog.resolveLanguageSymbol('public');
    assert.ok(sym, 'debe resolver PUBLIC como language symbol');
    assert.equal(sym.kind, 'keyword');
    assert.equal(sym.name, 'PUBLIC');
  });

  test('v2: resolveLanguageSymbol("commit") prioriza reserved-word oficial explícito', () => {
    const sym = catalog.resolveLanguageSymbol('commit');
    assert.ok(sym, 'debe resolver COMMIT como language symbol');
    assert.equal(sym.kind, 'reserved-word');
    assert.equal(sym.name, 'COMMIT');
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

  test('v2: resolveLanguageSymbol("SaveAsType") encuentra enumerated-type canónico', () => {
    const sym = catalog.resolveLanguageSymbol('SaveAsType');
    assert.ok(sym, 'debe resolver SaveAsType como language symbol');
    assert.equal(sym.kind, 'enumerated-type');
    assert.equal(sym.name, 'SaveAsType');
  });

  test('v2: resolveEnumeratedType/Value aplican el breaking change de B360', () => {
    const enumType = catalog.resolveEnumeratedType('SaveAsType');
    const enumValue = catalog.resolveEnumeratedValue('Text!');

    assert.ok(enumType, 'SaveAsType debe resolver como enumerated-type');
    assert.equal(enumType?.kind, 'enumerated-type');
    assert.equal(enumType?.name, 'SaveAsType');
    assert.equal(catalog.resolveEnumeratedType('SaveAsType!'), undefined);

    assert.ok(enumValue, 'Text! debe resolver como enumerated-value');
    assert.equal(enumValue?.kind, 'enumerated-value');
    assert.equal(enumValue?.enumValueOf, 'SaveAsType');
  });

  test('v2: operators/pronouns/enumerated-values no solapan lookup keys con keywords/reserved-words', () => {
    const collectLookupKeys = (entries: readonly { lookupKeys?: readonly string[] }[]) => {
      const values = new Set<string>();
      for (const entry of entries) {
        for (const lookupKey of entry.lookupKeys ?? []) {
          values.add(lookupKey);
        }
      }
      return values;
    };
    const overlap = (left: Set<string>, right: Set<string>) => [...left].filter(value => right.has(value)).sort();

    const keywordLookupKeys = collectLookupKeys(catalog.listKeywords());
    const reservedLookupKeys = collectLookupKeys(catalog.listReservedWords());

    assert.deepEqual(overlap(collectLookupKeys(catalog.listOperators()), keywordLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listOperators()), reservedLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listPronouns()), keywordLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listPronouns()), reservedLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listEnumeratedTypes()), keywordLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listEnumeratedTypes()), reservedLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listEnumeratedValues()), keywordLookupKeys), []);
    assert.deepEqual(overlap(collectLookupKeys(catalog.listEnumeratedValues()), reservedLookupKeys), []);
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
    assert.ok((r.kindCounts['enumerated-type'] ?? 0) > 0, 'enumerated-type');
    assert.ok((r.kindCounts['pronoun'] ?? 0) > 0, 'pronoun');
    assert.ok((r.kindCounts['operator'] ?? 0) > 0, 'operator');
    assert.ok((r.kindCounts['system-global'] ?? 0) > 0, 'system-global');
    assert.ok((r.kindCounts['enumerated-value'] ?? 0) > 0, 'enumerated-value');
    assert.equal(r.invalidEnumeratedTypeNames.length, 0, 'enumerated-type canónicos no deben terminar en !');
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
    assert.ok((r.domainCounts['enumerated-types'] ?? 0) > 0, 'enumerated-types');
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
