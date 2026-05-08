import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildExplainSystemSymbolMarkdown } from '../../../src/client/explainSystemSymbolReport';
import { buildExplainSystemSymbolReport } from '../../../src/server/features/explainSystemSymbol';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { getSystemSymbolLocalizationOverlay } from '../../../src/server/knowledge/system/localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';

suite('unit/explainSystemSymbol (B380)', () => {
  test('resuelve un simbolo generated con localizacion es y signatures', () => {
    const report = buildExplainSystemSymbolReport({
      name: 'Abs',
      locale: 'es',
      includeSignatures: true,
      includeParameters: true,
      includeProvenance: true,
    }, {
      systemCatalog: new SystemCatalog(),
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'resolved');
    assert.equal(report.symbol?.name, 'Abs');
    assert.equal(report.symbol?.authority, 'generated');
    assert.equal(report.symbol?.summary, 'Calcula el valor absoluto de un numero.');
    assert.match(buildExplainSystemSymbolMarkdown(report), /Explain System Symbol/);
    assert.ok(report.signatures?.length);
    assert.equal(report.signatures?.[0]?.parameters?.[0]?.name, 'n');
    assert.equal(report.signatures?.[0]?.parameters?.[0]?.documentation, 'Numero del que quieres obtener el valor absoluto.');
  });

  test('devuelve ambiguity compacta para enum values repetidos sin owner explicito', () => {
    const report = buildExplainSystemSymbolReport({
      name: 'Open',
      includeConflicts: true,
      maxCandidates: 4,
    }, {
      systemCatalog: new SystemCatalog(),
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'ambiguous');
    assert.ok((report.resolution.candidateCount ?? 0) > 1);
    assert.equal(report.candidates?.length, 4);
    assert.equal(report.symbol, undefined);
    assert.ok(report.findings.some((finding) => finding.code === 'symbol-ambiguous'));
  });

  test('respeta el limite de enum values para enumerated types', () => {
    const report = buildExplainSystemSymbolReport({
      name: 'WindowType',
      includeEnumValues: true,
      maxEnumValues: 2,
    }, {
      systemCatalog: new SystemCatalog(),
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'resolved');
    assert.equal(report.symbol?.name, 'WindowType');
    assert.equal(report.enumInfo?.enumValues?.length, 2);
    assert.ok(report.findings.some((finding) => finding.code === 'enum-values-truncated'));
  });

  test('cae al texto oficial cuando no existe overlay es', () => {
    const fallbackEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      (entry) => entry.dataset === 'generated'
        && entry.domain === 'global-functions'
        && !getSystemSymbolLocalizationOverlay(entry.id, 'es')
        && typeof entry.summary === 'string'
        && entry.summary.length > 0,
    );
    assert.ok(fallbackEntry, 'Se esperaba un entry generated sin overlay es para probar el fallback.');

    const report = buildExplainSystemSymbolReport({
      name: fallbackEntry!.name,
      locale: 'es',
    }, {
      systemCatalog: new SystemCatalog(),
    });

    assert.equal(report.available, true);
    assert.equal(report.symbol?.summary, fallbackEntry!.summary);
    assert.ok(report.findings.some((finding) => finding.code === 'locale-fallback-en'));
  });

  test('usa el simbolo bajo cursor cuando no se pasa name', () => {
    const document = TextDocument.create(
      'file:///test_b380.sru',
      'powerbuilder',
      1,
      'MessageBox("Hola", "Mundo")',
    );

    const report = buildExplainSystemSymbolReport({
      uri: document.uri,
      line: 0,
      character: 3,
    }, {
      systemCatalog: new SystemCatalog(),
      document,
    });

    assert.equal(report.available, true);
    assert.equal(report.resolution.state, 'resolved');
    assert.equal(report.symbol?.name, 'MessageBox');
  });
});