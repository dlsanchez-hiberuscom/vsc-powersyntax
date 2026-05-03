import * as assert from 'assert/strict';

import {
  buildCatalogCorpusValidationReport,
  type CatalogCorpusValidationProbe,
} from '../../../src/server/features/catalogCorpusValidation';

suite('unit/catalogCorpusValidation (B336)', () => {
  test('resume hits, misses, ambiguedades y budget violations por dominio y surface', () => {
    const probes: CatalogCorpusValidationProbe[] = [
      {
        corpus: 'pfc',
        label: 'sqlca-hover',
        domain: 'system-globals',
        feature: 'hover',
        status: 'hit',
        expected: 'SQLCA : Transaction',
        actualMatches: ['SQLCA : Transaction'],
        durationMs: 12,
        budgetMs: 50,
      },
      {
        corpus: 'pfc',
        label: 'sqlca-completion',
        domain: 'system-globals',
        feature: 'completion',
        status: 'ambiguous',
        expected: 'SQLCA',
        actualMatches: ['SQLCA', 'sqlca'],
        detail: 'El filtro devolvio dos labels equivalentes por casing.',
        durationMs: 60,
        budgetMs: 50,
      },
      {
        corpus: 'legacy',
        label: 'libraryexport-hover',
        domain: 'global-functions',
        feature: 'hover',
        status: 'miss',
        expected: 'LibraryExport',
        actualMatches: [],
        detail: 'Hover no devolvio markdown para el token revisado.',
      },
      {
        corpus: 'order-entry',
        label: 'settrans-diagnostics',
        domain: 'datawindow-functions',
        feature: 'diagnostics',
        status: 'hit',
        expected: 'Sin diagnostics en SetTransObject/Retrieve',
        actualMatches: [],
        durationMs: 40,
        budgetMs: 100,
      },
    ];

    const report = buildCatalogCorpusValidationReport(probes);

    assert.equal(report.totalProbes, 4);
    assert.equal(report.hits, 2);
    assert.equal(report.misses, 1);
    assert.equal(report.ambiguities, 1);
    assert.equal(report.budgetViolations.length, 1);

    assert.equal(report.byFeature.hover.total, 2);
    assert.equal(report.byFeature.hover.hits, 1);
    assert.equal(report.byFeature.hover.misses, 1);
    assert.equal(report.byFeature.completion.ambiguities, 1);
    assert.equal(report.byFeature.diagnostics.hits, 1);

    assert.equal(report.byDomain['system-globals']?.total, 2);
    assert.equal(report.byDomain['system-globals']?.hits, 1);
    assert.equal(report.byDomain['system-globals']?.ambiguities, 1);
    assert.equal(report.byDomain['global-functions']?.misses, 1);
    assert.equal(report.byDomain['datawindow-functions']?.hits, 1);

    assert.deepEqual(
      report.findings.map((finding) => ({ label: finding.label, status: finding.status })),
      [
        { label: 'sqlca-completion', status: 'ambiguous' },
        { label: 'libraryexport-hover', status: 'miss' },
      ],
    );
    assert.deepEqual(report.budgetViolations.map((violation) => violation.label), ['sqlca-completion']);
  });

  test('queda limpio cuando todos los probes pegan dentro de budget', () => {
    const report = buildCatalogCorpusValidationReport([
      {
        corpus: 'legacy',
        label: 'describe-hover',
        domain: 'datawindow-functions',
        feature: 'hover',
        status: 'hit',
        expected: 'Describe(propertylist)',
        actualMatches: ['Describe(propertylist)'],
        durationMs: 18,
        budgetMs: 50,
      },
      {
        corpus: 'pfc',
        label: 'sqlca-completion',
        domain: 'system-globals',
        feature: 'completion',
        status: 'hit',
        expected: 'SQLCA',
        actualMatches: ['SQLCA'],
        durationMs: 7,
        budgetMs: 50,
      },
    ]);

    assert.equal(report.hits, 2);
    assert.equal(report.misses, 0);
    assert.equal(report.ambiguities, 0);
    assert.equal(report.findings.length, 0);
    assert.equal(report.budgetViolations.length, 0);
  });
});