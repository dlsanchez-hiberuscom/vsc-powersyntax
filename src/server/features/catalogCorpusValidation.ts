import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { PbSystemSymbolDomain, PbSystemSymbolEntry, PbSystemSymbolProvenanceAuthority } from '../knowledge/system/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import { CharType } from '../utils/comments';
import { matchesEnumeratedPropertyContext, resolveExpectedEnumTypeForCallArgumentAtPosition } from './enumeratedContext';
import { resolveDocumentQualifierType } from './queryContext';

export type CatalogCorpusValidationFeature = 'hover' | 'completion' | 'diagnostics';
export type CatalogCorpusValidationStatus = 'hit' | 'miss' | 'ambiguous';

const CATALOG_CORPUS_VALIDATION_FEATURES: readonly CatalogCorpusValidationFeature[] = [
  'hover',
  'completion',
  'diagnostics',
];

const ENUMERATED_VALUE_TOKEN_REGEX = new RegExp(`(${PB_IDENTIFIER_SOURCE}!)`, 'gi');
const ENUMERATED_PROPERTY_ASSIGN_PREFIX_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*(${PB_IDENTIFIER_SOURCE})\\s*=\\s*(${PB_IDENTIFIER_SOURCE})$`,
  'i',
);

export interface CatalogCorpusValidationProbe {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  status: CatalogCorpusValidationStatus;
  expected: string;
  actualMatches?: readonly string[];
  detail?: string;
  uri?: string;
  line?: number;
  durationMs?: number;
  budgetMs?: number;
}

export interface CatalogCorpusValidationDomainSummary {
  domain: PbSystemSymbolDomain;
  total: number;
  hits: number;
  misses: number;
  ambiguities: number;
}

export interface CatalogCorpusValidationFeatureSummary {
  feature: CatalogCorpusValidationFeature;
  total: number;
  hits: number;
  misses: number;
  ambiguities: number;
}

export interface CatalogCorpusValidationFinding {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  status: Exclude<CatalogCorpusValidationStatus, 'hit'>;
  expected: string;
  actualMatches: readonly string[];
  detail?: string;
  uri?: string;
  line?: number;
}

export interface CatalogCorpusBudgetViolation {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  durationMs: number;
  budgetMs: number;
  uri?: string;
  line?: number;
}

export interface CatalogCorpusValidationReport {
  totalProbes: number;
  hits: number;
  misses: number;
  ambiguities: number;
  byDomain: Partial<Record<PbSystemSymbolDomain, CatalogCorpusValidationDomainSummary>>;
  byFeature: Record<CatalogCorpusValidationFeature, CatalogCorpusValidationFeatureSummary>;
  findings: readonly CatalogCorpusValidationFinding[];
  budgetViolations: readonly CatalogCorpusBudgetViolation[];
}

export type EnumCatalogCorpusUsageClassification =
  | 'official-known'
  | 'curated-known'
  | 'candidate'
  | 'false-positive'
  | 'out-of-context'
  | 'unknown';

export interface EnumCatalogCorpusUsageObservation {
  corpus: string;
  uri: string;
  line: number;
  value: string;
  normalizedValue: string;
  classification: EnumCatalogCorpusUsageClassification;
  authority?: PbSystemSymbolProvenanceAuthority;
  expectedEnumType?: string;
  actualEnumType?: string;
  target?: string;
  detail?: string;
}

export interface EnumCatalogCorpusUsageSummary {
  totalDetectedValues: number;
  catalogedValues: number;
  officialKnownValues: number;
  curatedKnownValues: number;
  unknownValues: number;
  candidates: number;
  falsePositives: number;
  outOfContextValues: number;
}

export interface EnumCatalogCorpusUsageReport extends EnumCatalogCorpusUsageSummary {
  byCorpus: Record<string, EnumCatalogCorpusUsageSummary>;
  findings: readonly EnumCatalogCorpusUsageObservation[];
}

interface EnumCatalogUsageScanInput {
  corpus: string;
  document: TextDocument;
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog: SystemCatalog;
}

interface PendingEnumCodeOccurrence {
  lineIndex: number;
  startCharacter: number;
  value: string;
  normalizedValue: string;
}

interface EnumExpectedUsageContext {
  kind: 'call-argument' | 'property-assignment';
  expectedEnumType: string;
  target?: string;
  propertyName?: string;
  ownerType?: string;
}

function createFeatureSummary(
  feature: CatalogCorpusValidationFeature,
): CatalogCorpusValidationFeatureSummary {
  return {
    feature,
    total: 0,
    hits: 0,
    misses: 0,
    ambiguities: 0,
  };
}

function createDomainSummary(
  domain: PbSystemSymbolDomain,
): CatalogCorpusValidationDomainSummary {
  return {
    domain,
    total: 0,
    hits: 0,
    misses: 0,
    ambiguities: 0,
  };
}

function createEnumCatalogCorpusUsageSummary(): EnumCatalogCorpusUsageSummary {
  return {
    totalDetectedValues: 0,
    catalogedValues: 0,
    officialKnownValues: 0,
    curatedKnownValues: 0,
    unknownValues: 0,
    candidates: 0,
    falsePositives: 0,
    outOfContextValues: 0,
  };
}

function registerEnumCatalogCorpusUsageObservation(
  summary: EnumCatalogCorpusUsageSummary,
  observation: EnumCatalogCorpusUsageObservation,
): void {
  summary.totalDetectedValues += 1;
  switch (observation.classification) {
    case 'official-known':
      summary.catalogedValues += 1;
      summary.officialKnownValues += 1;
      break;
    case 'curated-known':
      summary.catalogedValues += 1;
      summary.curatedKnownValues += 1;
      break;
    case 'candidate':
      summary.candidates += 1;
      break;
    case 'false-positive':
      summary.falsePositives += 1;
      break;
    case 'out-of-context':
      summary.outOfContextValues += 1;
      break;
    case 'unknown':
      summary.unknownValues += 1;
      break;
  }
}

function isCatalogedKnownClassification(
  classification: EnumCatalogCorpusUsageClassification,
): classification is 'official-known' | 'curated-known' {
  return classification === 'official-known' || classification === 'curated-known';
}

function classifyKnownEnumAuthority(authority: PbSystemSymbolProvenanceAuthority | undefined): 'official-known' | 'curated-known' {
  return authority === 'official' ? 'official-known' : 'curated-known';
}

function isTextualEnumToken(
  mask: Uint8Array | undefined,
  startCharacter: number,
  tokenLength: number,
): boolean {
  if (!mask || tokenLength <= 0) {
    return false;
  }

  for (let offset = 0; offset < tokenLength; offset++) {
    const charType = mask[startCharacter + offset];
    if (charType === CharType.Comment || charType === CharType.String) {
      return true;
    }
  }

  return false;
}

function resolveExpectedEnumUsageContext(
  document: TextDocument,
  maskedLine: string,
  lineIndex: number,
  startCharacter: number,
  normalizedValue: string,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
): EnumExpectedUsageContext | null {
  const tokenEnd = startCharacter + normalizedValue.length;
  const callArgumentExpectedEnumType = resolveExpectedEnumTypeForCallArgumentAtPosition(
    document,
    Position.create(lineIndex, tokenEnd),
    kb,
    systemCatalog,
  );
  if (callArgumentExpectedEnumType) {
    return {
      kind: 'call-argument',
      expectedEnumType: callArgumentExpectedEnumType,
    };
  }

  const linePrefix = maskedLine.slice(0, tokenEnd);
  const propertyMatch = linePrefix.match(ENUMERATED_PROPERTY_ASSIGN_PREFIX_REGEX);
  if (!propertyMatch) {
    return null;
  }

  const qualifier = propertyMatch[1];
  const propertyName = propertyMatch[2];
  const ownerType = resolveDocumentQualifierType(document, qualifier, Position.create(lineIndex, tokenEnd), kb);
  const expectedEnumType = systemCatalog.resolveEnumeratedType(propertyName);
  if (!ownerType || !expectedEnumType) {
    return null;
  }

  return {
    kind: 'property-assignment',
    expectedEnumType: expectedEnumType.name,
    target: `${qualifier}.${propertyName}`,
    propertyName,
    ownerType,
  };
}

function isEnumUsageContextMismatch(
  actualEnumValue: PbSystemSymbolEntry,
  expectedContext: EnumExpectedUsageContext,
): boolean {
  const actualEnumType = actualEnumValue.enumValueOf?.toLowerCase();
  const expectedEnumType = expectedContext.expectedEnumType.toLowerCase();

  if (actualEnumType !== expectedEnumType) {
    return true;
  }

  if (
    expectedContext.kind === 'property-assignment'
    && expectedContext.propertyName
    && expectedContext.ownerType
  ) {
    return !matchesEnumeratedPropertyContext(
      actualEnumValue,
      expectedContext.propertyName,
      expectedContext.ownerType,
    );
  }

  return false;
}

export function collectEnumCatalogCorpusUsageObservations(
  input: EnumCatalogUsageScanInput,
): EnumCatalogCorpusUsageObservation[] {
  const rawLines = input.document.getText().split(/\r?\n/);
  if (!rawLines.some((line) => line.includes('!'))) {
    return [];
  }

  const snapshot = input.kb.getDocumentSnapshot(input.document.uri) ?? getDocumentAnalysis(input.document).snapshot;
  const maskedLines = snapshot.maskedText.lines;
  const masks = snapshot.maskedText.masks;
  const pendingCodeOccurrences: PendingEnumCodeOccurrence[] = [];
  const observations: EnumCatalogCorpusUsageObservation[] = [];

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex] ?? '';
    const maskedLine = maskedLines[lineIndex] ?? '';
    const mask = masks[lineIndex];
    ENUMERATED_VALUE_TOKEN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ENUMERATED_VALUE_TOKEN_REGEX.exec(rawLine)) !== null) {
      const value = match[1];
      const normalizedValue = value.slice(0, -1);
      const startCharacter = match.index;
      const maskedSlice = maskedLine.slice(startCharacter, startCharacter + value.length);

      if (maskedSlice.toLowerCase() !== value.toLowerCase() || isTextualEnumToken(mask, startCharacter, value.length)) {
        observations.push({
          corpus: input.corpus,
          uri: input.document.uri,
          line: lineIndex + 1,
          value,
          normalizedValue,
          classification: 'false-positive',
          detail: 'Coincidencia textual dentro de comentario o literal.',
        });
        continue;
      }

      pendingCodeOccurrences.push({
        lineIndex,
        startCharacter,
        value,
        normalizedValue,
      });
    }
  }

  if (pendingCodeOccurrences.length === 0) {
    return observations;
  }

  for (const occurrence of pendingCodeOccurrences) {
    const actualEnumValue = input.systemCatalog.resolveEnumeratedValue(occurrence.value);
    const maskedLine = maskedLines[occurrence.lineIndex] ?? '';
    const expectedContext = resolveExpectedEnumUsageContext(
      input.document,
      maskedLine,
      occurrence.lineIndex,
      occurrence.startCharacter,
      occurrence.normalizedValue,
      input.kb,
      input.systemCatalog,
    );

    if (actualEnumValue && expectedContext && isEnumUsageContextMismatch(actualEnumValue, expectedContext)) {
      observations.push({
        corpus: input.corpus,
        uri: input.document.uri,
        line: occurrence.lineIndex + 1,
        value: occurrence.value,
        normalizedValue: occurrence.normalizedValue,
        classification: 'out-of-context',
        authority: actualEnumValue.provenance.authority,
        expectedEnumType: expectedContext.expectedEnumType,
        actualEnumType: actualEnumValue.enumValueOf,
        target: expectedContext.target,
        detail: expectedContext.kind === 'property-assignment'
          ? `El valor enumerado '${occurrence.value}' de tipo '${actualEnumValue.enumValueOf ?? 'unknown'}' no aplica a '${expectedContext.target ?? 'la asignación'}'; se esperaba '${expectedContext.expectedEnumType}'.`
          : `El valor enumerado '${occurrence.value}' de tipo '${actualEnumValue.enumValueOf ?? 'unknown'}' no coincide con el tipo esperado '${expectedContext.expectedEnumType}' en esta llamada.`,
      });
      continue;
    }

    if (actualEnumValue) {
      observations.push({
        corpus: input.corpus,
        uri: input.document.uri,
        line: occurrence.lineIndex + 1,
        value: occurrence.value,
        normalizedValue: occurrence.normalizedValue,
        classification: classifyKnownEnumAuthority(actualEnumValue.provenance.authority),
        authority: actualEnumValue.provenance.authority,
        actualEnumType: actualEnumValue.enumValueOf,
      });
      continue;
    }

    if (expectedContext) {
      observations.push({
        corpus: input.corpus,
        uri: input.document.uri,
        line: occurrence.lineIndex + 1,
        value: occurrence.value,
        normalizedValue: occurrence.normalizedValue,
        classification: 'candidate',
        expectedEnumType: expectedContext.expectedEnumType,
        target: expectedContext.target,
        detail: `Valor no catalogado en contexto que espera '${expectedContext.expectedEnumType}'.`,
      });
      continue;
    }

    observations.push({
      corpus: input.corpus,
      uri: input.document.uri,
      line: occurrence.lineIndex + 1,
      value: occurrence.value,
      normalizedValue: occurrence.normalizedValue,
      classification: 'unknown',
      detail: 'Token con sufijo ! fuera de comentario/string y sin contexto enum inferible.',
    });
  }

  return observations;
}

export function buildEnumCatalogCorpusUsageReport(
  observations: readonly EnumCatalogCorpusUsageObservation[],
): EnumCatalogCorpusUsageReport {
  const summary = createEnumCatalogCorpusUsageSummary();
  const byCorpus: Record<string, EnumCatalogCorpusUsageSummary> = {};
  const findings: EnumCatalogCorpusUsageObservation[] = [];

  for (const observation of observations) {
    registerEnumCatalogCorpusUsageObservation(summary, observation);
    const corpusSummary = byCorpus[observation.corpus] ?? createEnumCatalogCorpusUsageSummary();
    byCorpus[observation.corpus] = corpusSummary;
    registerEnumCatalogCorpusUsageObservation(corpusSummary, observation);
    if (!isCatalogedKnownClassification(observation.classification)) {
      findings.push(observation);
    }
  }

  return {
    ...summary,
    byCorpus,
    findings,
  };
}

export function buildCatalogCorpusValidationReport(
  probes: readonly CatalogCorpusValidationProbe[],
): CatalogCorpusValidationReport {
  const byDomain: Partial<Record<PbSystemSymbolDomain, CatalogCorpusValidationDomainSummary>> = {};
  const byFeature = Object.fromEntries(
    CATALOG_CORPUS_VALIDATION_FEATURES.map((feature) => [feature, createFeatureSummary(feature)]),
  ) as Record<CatalogCorpusValidationFeature, CatalogCorpusValidationFeatureSummary>;
  const findings: CatalogCorpusValidationFinding[] = [];
  const budgetViolations: CatalogCorpusBudgetViolation[] = [];
  let hits = 0;
  let misses = 0;
  let ambiguities = 0;

  for (const probe of probes) {
    const domainSummary = byDomain[probe.domain] ?? createDomainSummary(probe.domain);
    byDomain[probe.domain] = domainSummary;

    const featureSummary = byFeature[probe.feature];
    domainSummary.total += 1;
    featureSummary.total += 1;

    switch (probe.status) {
      case 'hit':
        hits += 1;
        domainSummary.hits += 1;
        featureSummary.hits += 1;
        break;
      case 'miss':
        misses += 1;
        domainSummary.misses += 1;
        featureSummary.misses += 1;
        findings.push({
          corpus: probe.corpus,
          label: probe.label,
          domain: probe.domain,
          feature: probe.feature,
          status: 'miss',
          expected: probe.expected,
          actualMatches: probe.actualMatches ?? [],
          ...(probe.detail ? { detail: probe.detail } : {}),
          ...(probe.uri ? { uri: probe.uri } : {}),
          ...(probe.line !== undefined ? { line: probe.line } : {}),
        });
        break;
      case 'ambiguous':
        ambiguities += 1;
        domainSummary.ambiguities += 1;
        featureSummary.ambiguities += 1;
        findings.push({
          corpus: probe.corpus,
          label: probe.label,
          domain: probe.domain,
          feature: probe.feature,
          status: 'ambiguous',
          expected: probe.expected,
          actualMatches: probe.actualMatches ?? [],
          ...(probe.detail ? { detail: probe.detail } : {}),
          ...(probe.uri ? { uri: probe.uri } : {}),
          ...(probe.line !== undefined ? { line: probe.line } : {}),
        });
        break;
    }

    if (
      probe.durationMs !== undefined
      && probe.budgetMs !== undefined
      && probe.durationMs > probe.budgetMs
    ) {
      budgetViolations.push({
        corpus: probe.corpus,
        label: probe.label,
        domain: probe.domain,
        feature: probe.feature,
        durationMs: probe.durationMs,
        budgetMs: probe.budgetMs,
        ...(probe.uri ? { uri: probe.uri } : {}),
        ...(probe.line !== undefined ? { line: probe.line } : {}),
      });
    }
  }

  return {
    totalProbes: probes.length,
    hits,
    misses,
    ambiguities,
    byDomain,
    byFeature,
    findings,
    budgetViolations,
  };
}