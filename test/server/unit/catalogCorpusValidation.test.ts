import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildCatalogCorpusValidationReport,
  buildEnumCatalogCorpusUsageReport,
  collectEnumCatalogCorpusUsageObservations,
  type CatalogCorpusValidationProbe,
  type EnumCatalogCorpusUsageObservation,
} from '../../../src/server/features/catalogCorpusValidation';
import { getDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

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

  test('resume usos reales de enum values por corpus y separa findings no catalogados', () => {
    const observations: EnumCatalogCorpusUsageObservation[] = [
      {
        corpus: 'pfc',
        uri: 'file:///pfc.srw',
        line: 10,
        value: 'Center!',
        normalizedValue: 'Center',
        classification: 'official-known',
        authority: 'official',
        actualEnumType: 'Alignment',
      },
      {
        corpus: 'pfc',
        uri: 'file:///pfc.srw',
        line: 11,
        value: 'CustomAlignment!',
        normalizedValue: 'CustomAlignment',
        classification: 'candidate',
        expectedEnumType: 'Alignment',
      },
      {
        corpus: 'legacy',
        uri: 'file:///legacy.sru',
        line: 22,
        value: 'CommentOnly!',
        normalizedValue: 'CommentOnly',
        classification: 'false-positive',
      },
      {
        corpus: 'order-entry',
        uri: 'file:///orderentry.srw',
        line: 33,
        value: 'FromBeginning!',
        normalizedValue: 'FromBeginning',
        classification: 'out-of-context',
        expectedEnumType: 'DWBuffer',
        actualEnumType: 'SeekType',
      },
      {
        corpus: 'order-entry',
        uri: 'file:///orderentry.srw',
        line: 34,
        value: 'GhostBang!',
        normalizedValue: 'GhostBang',
        classification: 'unknown',
      },
    ];

    const report = buildEnumCatalogCorpusUsageReport(observations);

    assert.equal(report.totalDetectedValues, 5);
    assert.equal(report.catalogedValues, 1);
    assert.equal(report.officialKnownValues, 1);
    assert.equal(report.curatedKnownValues, 0);
    assert.equal(report.candidates, 1);
    assert.equal(report.falsePositives, 1);
    assert.equal(report.outOfContextValues, 1);
    assert.equal(report.unknownValues, 1);

    assert.equal(report.byCorpus.pfc?.totalDetectedValues, 2);
    assert.equal(report.byCorpus['order-entry']?.outOfContextValues, 1);
    assert.equal(report.findings.length, 4);
    assert.ok(report.findings.every((finding) => finding.classification !== 'official-known'));
  });

  test('clasifica valores reales con bang entre conocidos, candidatos, falsos positivos y out-of-context', () => {
    const source = [
      'global type w_enum_report from window',
      '  multilineedit mle_1',
      'end type',
      '',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      '',
      'public subroutine of_test()',
      '  integer li_file',
      '  mle_1.Alignment = Center!',
      '  mle_1.Alignment = ProposedCenter!',
      '  FileSeek(li_file, 0, Left!)',
      '  string ls_label',
      '  ls_label = "TextOnlyBang!"',
      '  GhostBang!',
      '  // CommentBang!',
      'end subroutine',
    ].join('\r\n');

    const document = TextDocument.create('file:///enum_usage_report_test.srw', 'powerbuilder', 1, source);
    const kb = new KnowledgeBase();
    const systemCatalog = new SystemCatalog();
    const analysis = getDocumentAnalysis(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    const graph = new InheritanceGraph(kb);

    const observations = collectEnumCatalogCorpusUsageObservations({
      corpus: 'synthetic',
      document,
      kb,
      graph,
      systemCatalog,
    });
    const report = buildEnumCatalogCorpusUsageReport(observations);

    assert.ok(observations.some((observation) => (
      (observation.classification === 'official-known' || observation.classification === 'curated-known')
      && observation.value === 'Center!'
      && observation.actualEnumType === 'Alignment'
    )));
    assert.ok(observations.some((observation) => (
      observation.classification === 'candidate'
      && observation.value === 'ProposedCenter!'
      && observation.expectedEnumType === 'Alignment'
    )));
    assert.ok(observations.some((observation) => (
      observation.classification === 'out-of-context'
      && observation.value === 'Left!'
      && observation.expectedEnumType === 'SeekType'
    )));
    assert.ok(observations.some((observation) => observation.classification === 'false-positive' && observation.value === 'TextOnlyBang!'));
    assert.ok(observations.some((observation) => observation.classification === 'false-positive' && observation.value === 'CommentBang!'));
    assert.ok(observations.some((observation) => observation.classification === 'unknown' && observation.value === 'GhostBang!'));

    assert.equal(report.totalDetectedValues, 6);
    assert.equal(report.catalogedValues, 1);
    assert.equal(report.candidates, 1);
    assert.equal(report.falsePositives, 2);
    assert.equal(report.outOfContextValues, 1);
    assert.equal(report.unknownValues, 1);
  });
});