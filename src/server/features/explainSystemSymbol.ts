import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  PUBLIC_API_VERSION,
  type ApiExplainSystemSymbolReport,
  type ApiExplainSystemSymbolRequest,
} from '../../shared/publicApi';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import {
  getDisplayDocumentation,
  getDisplayObsoleteMessage,
  getDisplayParameterDocumentation,
  getDisplaySummary,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import { getDocumentLineText } from '../utils/documentLineText';
import { findPowerBuilderIdentifierSpan } from '../utils/pbIdentifier';
import { getWordAtPosition } from '../utils/wordAtPosition';
import { resolveDocumentQualifierType } from './queryContext';

const DEFAULT_MAX_CANDIDATES = 6;
const DEFAULT_MAX_SIGNATURES = 4;
const DEFAULT_MAX_ENUM_VALUES = 12;

interface NormalizedExplainSystemSymbolRequest {
  name?: string;
  uri?: string;
  line?: number;
  character?: number;
  ownerType?: string;
  domain?: string;
  kind?: string;
  locale: DocumentationLocale;
  includeSignatures: boolean;
  includeParameters: boolean;
  includeEnumValues: boolean;
  includeProvenance: boolean;
  includeConflicts: boolean;
  maxCandidates: number;
  maxSignatures: number;
  maxEnumValues: number;
}

export interface ExplainSystemSymbolBuildContext {
  systemCatalog: SystemCatalog;
  document?: TextDocument;
  knowledgeBase?: KnowledgeBase;
}

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

function normalizeLookupText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized.toLowerCase() : undefined;
}

function normalizeExplainSystemSymbolRequest(
  request: ApiExplainSystemSymbolRequest = {},
): NormalizedExplainSystemSymbolRequest {
  return {
    ...(request.name?.trim() ? { name: request.name.trim() } : {}),
    ...(request.uri ? { uri: request.uri } : {}),
    ...(typeof request.line === 'number' ? { line: Math.max(0, Math.trunc(request.line)) } : {}),
    ...(typeof request.character === 'number' ? { character: Math.max(0, Math.trunc(request.character)) } : {}),
    ...(request.ownerType?.trim() ? { ownerType: request.ownerType.trim() } : {}),
    ...(request.domain?.trim() ? { domain: request.domain.trim() } : {}),
    ...(request.kind?.trim() ? { kind: request.kind.trim() } : {}),
    locale: request.locale === 'es' ? 'es' : 'en',
    includeSignatures: request.includeSignatures ?? true,
    includeParameters: request.includeParameters ?? true,
    includeEnumValues: request.includeEnumValues ?? true,
    includeProvenance: request.includeProvenance ?? true,
    includeConflicts: request.includeConflicts ?? true,
    maxCandidates: clampNumber(request.maxCandidates, 1, 20, DEFAULT_MAX_CANDIDATES),
    maxSignatures: clampNumber(request.maxSignatures, 1, 20, DEFAULT_MAX_SIGNATURES),
    maxEnumValues: clampNumber(request.maxEnumValues, 0, 50, DEFAULT_MAX_ENUM_VALUES),
  };
}

function extractQualifier(lineText: string, character: number): string | undefined {
  const span = findPowerBuilderIdentifierSpan(lineText, character, { allowCursorAfterIdentifier: true });
  if (!span) {
    return undefined;
  }

  let index = span.start - 1;
  while (index >= 0 && (lineText[index] === ' ' || lineText[index] === '\t')) {
    index--;
  }

  let hasSeparator = false;
  if (index >= 0 && lineText[index] === '.') {
    hasSeparator = true;
    index--;
  } else if (index >= 1 && lineText[index] === ':' && lineText[index - 1] === ':') {
    hasSeparator = true;
    index -= 2;
  }

  if (!hasSeparator) {
    return undefined;
  }

  while (index >= 0 && (lineText[index] === ' ' || lineText[index] === '\t')) {
    index--;
  }

  const end = index;
  while (index >= 0 && /[a-zA-Z0-9_$#%]/.test(lineText[index] ?? '')) {
    index--;
  }

  const qualifier = lineText.slice(index + 1, end + 1).trim();
  return qualifier.length > 0 ? qualifier : undefined;
}

function resolveSymbolName(
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
  context: ExplainSystemSymbolBuildContext,
): { name?: string; ownerType?: string } {
  if (normalizedRequest.name) {
    return {
      name: normalizedRequest.name,
      ...(normalizedRequest.ownerType ? { ownerType: normalizedRequest.ownerType } : {}),
    };
  }

  if (
    !context.document
    || typeof normalizedRequest.line !== 'number'
    || typeof normalizedRequest.character !== 'number'
  ) {
    return {
      ...(normalizedRequest.ownerType ? { ownerType: normalizedRequest.ownerType } : {}),
    };
  }

  const lines = context.document.getText().split(/\r?\n/u);
  const name = getWordAtPosition(lines, {
    line: normalizedRequest.line,
    character: normalizedRequest.character,
  });

  if (!name) {
    return {
      ...(normalizedRequest.ownerType ? { ownerType: normalizedRequest.ownerType } : {}),
    };
  }

  if (normalizedRequest.ownerType) {
    return { name, ownerType: normalizedRequest.ownerType };
  }

  if (!context.knowledgeBase) {
    return { name };
  }

  const lineText = getDocumentLineText(context.document, normalizedRequest.line);
  const qualifier = extractQualifier(lineText, normalizedRequest.character);
  const ownerType = qualifier
    ? resolveDocumentQualifierType(
      context.document,
      qualifier,
      Position.create(normalizedRequest.line, normalizedRequest.character),
      context.knowledgeBase,
    )
    : undefined;

  return {
    name,
    ...(ownerType ? { ownerType } : {}),
  };
}

function mapsToExplainSystemSymbolAuthority(
  entry: PbSystemSymbolEntry,
): NonNullable<ApiExplainSystemSymbolReport['symbol']>['authority'] {
  switch (entry.provenance.kind) {
    case 'generated':
      return 'generated';
    case 'project':
      return 'project';
    case 'workspace':
      return 'workspace';
    case 'custom':
      return 'custom';
    default:
      return entry.provenance.authority;
  }
}

function matchesExplainSystemSymbolOwnerType(entry: PbSystemSymbolEntry, ownerType: string | undefined): boolean {
  if (!ownerType) {
    return true;
  }

  const normalizedOwnerType = ownerType.toLowerCase();
  const candidateOwnerTypes = new Set<string>([
    ...(entry.ownerTypes ?? []).map((value) => value.toLowerCase()),
    ...(entry.appliesTo ?? []).map((value) => value.toLowerCase()),
    ...(entry.allowedOnOwners ?? []).map((value) => value.toLowerCase()),
  ]);

  if (candidateOwnerTypes.size === 0) {
    return true;
  }

  return candidateOwnerTypes.has(normalizedOwnerType);
}

function filterExplainSystemSymbolCandidates(
  candidates: readonly PbSystemSymbolEntry[],
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
  effectiveOwnerType: string | undefined,
): PbSystemSymbolEntry[] {
  const requestedKind = normalizeLookupText(normalizedRequest.kind);
  const requestedDomain = normalizeLookupText(normalizedRequest.domain);

  return candidates.filter((candidate) => {
    if (requestedKind && candidate.kind.toLowerCase() !== requestedKind) {
      return false;
    }

    if (requestedDomain && candidate.domain.toLowerCase() !== requestedDomain) {
      return false;
    }

    return matchesExplainSystemSymbolOwnerType(candidate, effectiveOwnerType);
  });
}

function compareExplainSystemSymbolCandidate(left: PbSystemSymbolEntry, right: PbSystemSymbolEntry): number {
  const weight = (entry: PbSystemSymbolEntry): number => {
    switch (entry.provenance.authority) {
      case 'official':
        return 0;
      case 'curated':
        return 1;
      default:
        return 2;
    }
  };

  const authorityDelta = weight(left) - weight(right);
  if (authorityDelta !== 0) {
    return authorityDelta;
  }

  const domainDelta = left.domain.localeCompare(right.domain);
  if (domainDelta !== 0) {
    return domainDelta;
  }

  const kindDelta = left.kind.localeCompare(right.kind);
  if (kindDelta !== 0) {
    return kindDelta;
  }

  return left.name.localeCompare(right.name);
}

function buildExplainSystemSymbolFamilyKey(entry: PbSystemSymbolEntry): string {
  return [
    entry.domain,
    entry.kind,
    entry.namespace,
    entry.invocation,
    entry.normalizedName,
    entry.enumValueOf ?? '',
    (entry.ownerTypes ?? []).join('|').toLowerCase(),
  ].join('::');
}

function collapseExplainSystemSymbolFamilies(candidates: readonly PbSystemSymbolEntry[]): PbSystemSymbolEntry[] {
  const families = new Map<string, PbSystemSymbolEntry>();
  for (const candidate of candidates) {
    const familyKey = buildExplainSystemSymbolFamilyKey(candidate);
    const current = families.get(familyKey);
    if (!current || compareExplainSystemSymbolCandidate(candidate, current) < 0) {
      families.set(familyKey, candidate);
    }
  }

  return [...families.values()].sort(compareExplainSystemSymbolCandidate);
}

function selectPreferredExplainSystemSymbolCandidate(
  candidates: readonly PbSystemSymbolEntry[],
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
): PbSystemSymbolEntry | undefined {
  if (
    candidates.length <= 1
    || normalizedRequest.domain
    || normalizedRequest.kind
    || normalizedRequest.ownerType
  ) {
    return undefined;
  }

  const exactGlobalCallableCandidates = candidates.filter((candidate) =>
    candidate.domain === 'global-functions'
    && candidate.kind === 'callable'
    && candidate.namespace === 'powerscript'
    && candidate.invocation === 'global'
    && candidate.provenance.authority === 'official'
  );
  if (exactGlobalCallableCandidates.length === 1) {
    return exactGlobalCallableCandidates[0];
  }

  const officialCandidates = candidates.filter((candidate) => candidate.provenance.authority === 'official');
  return officialCandidates.length === 1 ? officialCandidates[0] : undefined;
}

function parseSignatureParameterLabel(label: string): { name: string; type?: string } {
  const trimmed = label.trim();
  const match = /^(.+?)\s+([A-Za-z_][A-Za-z0-9_$#%!]*)$/u.exec(trimmed);
  if (!match) {
    return { name: trimmed };
  }

  return {
    name: match[2],
    type: match[1],
  };
}

function buildExplainSystemSymbolSignatures(
  entry: PbSystemSymbolEntry,
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
): ApiExplainSystemSymbolReport['signatures'] | undefined {
  if (!normalizedRequest.includeSignatures || entry.signatures.length === 0) {
    return undefined;
  }

  return entry.signatures.slice(0, normalizedRequest.maxSignatures).map((signature) => ({
    label: signature.label,
    ...(signature.returnType ? { returnType: signature.returnType } : {}),
    ...(normalizedRequest.includeParameters && signature.parameters?.length
      ? {
        parameters: signature.parameters.map((parameter) => {
          const parsed = parseSignatureParameterLabel(parameter.label);
          const documentation = getDisplayParameterDocumentation(
            entry,
            signature.label,
            parsed.name,
            normalizedRequest.locale,
          ) ?? parameter.documentation;
          return {
            name: parsed.name,
            ...(parsed.type ? { type: parsed.type } : {}),
            ...(documentation ? { documentation } : {}),
          };
        }),
      }
      : {}),
  }));
}

function buildExplainSystemSymbolEnumInfo(
  entry: PbSystemSymbolEntry,
  catalog: SystemCatalog,
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
): ApiExplainSystemSymbolReport['enumInfo'] | undefined {
  if (entry.kind !== 'enumerated-type' && entry.kind !== 'enumerated-value') {
    return undefined;
  }

  const enumValues = normalizedRequest.includeEnumValues
    ? (entry.kind === 'enumerated-type'
      ? catalog.listEnumeratedValuesForType(entry.name)
      : (entry.enumValueOf ? catalog.listEnumeratedValuesForType(entry.enumValueOf) : []))
      .slice(0, normalizedRequest.maxEnumValues)
      .map((candidate) => candidate.name)
    : undefined;

  return {
    ...(entry.enumValueOf ? { enumValueOf: entry.enumValueOf } : {}),
    ...(enumValues && enumValues.length > 0 ? { enumValues } : {}),
    ...(typeof entry.enumNumericValue === 'number' ? { enumNumericValue: entry.enumNumericValue } : {}),
    ...(entry.enumValueMeaning ? { enumValueMeaning: entry.enumValueMeaning } : {}),
  };
}

function buildExplainSystemSymbolCandidates(
  candidates: readonly PbSystemSymbolEntry[],
  normalizedRequest: NormalizedExplainSystemSymbolRequest,
): ApiExplainSystemSymbolReport['candidates'] {
  if (!normalizedRequest.includeConflicts || candidates.length <= 1) {
    return undefined;
  }

  return candidates.slice(0, normalizedRequest.maxCandidates).map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    domain: candidate.domain,
    kind: candidate.kind,
    ...(candidate.ownerTypes?.length ? { ownerTypes: candidate.ownerTypes } : {}),
    summary: getDisplaySummary(candidate, normalizedRequest.locale),
    ...(normalizedRequest.includeProvenance && candidate.provenance.sourceUrl ? { sourceUrl: candidate.provenance.sourceUrl } : {}),
  }));
}

function buildExplainSystemSymbolRecommendedActions(input: {
  normalizedRequest: NormalizedExplainSystemSymbolRequest;
  selected?: PbSystemSymbolEntry;
  candidateCount: number;
  state: ApiExplainSystemSymbolReport['resolution']['state'];
}): string[] {
  const { normalizedRequest, selected, candidateCount, state } = input;

  if (state === 'unresolved') {
    return [
      'Aporta `name` explicito o mueve el cursor sobre un simbolo real del catalogo.',
      'Si el simbolo depende del contexto, restringe la consulta con `ownerType`, `domain` o `kind`.',
    ];
  }

  if (state === 'ambiguous') {
    return [
      `El lookup devuelve ${candidateCount} candidatos; restringe con \`ownerType\`, \`domain\` o \`kind\`.`,
      'Si vienes del editor, reintenta sobre el simbolo exacto bajo cursor o pasa `name` explicito.',
    ];
  }

  const actions: string[] = [];
  if (selected?.obsolete) {
    actions.push(selected.replacement
      ? `Revisar el reemplazo sugerido: ${selected.replacement}.`
      : 'Revisar si existe una alternativa vigente para el simbolo obsoleto.');
  }

  if (normalizedRequest.locale === 'es') {
    actions.push('Si falta localizacion, revisar el overlay `es` antes de ampliar prompts o tooling dependiente del catalogo.');
  }

  if (selected?.kind === 'enumerated-type' || selected?.kind === 'enumerated-value') {
    actions.push('Si el simbolo participa en contexto enumerado, validar ownerType y enumValueOf antes de proponer cambios automatizados.');
  }

  return actions.slice(0, 4);
}

function pushExplainSystemSymbolFinding(
  findings: ApiExplainSystemSymbolReport['findings'],
  finding: ApiExplainSystemSymbolReport['findings'][number],
): void {
  if (!findings.some((entry) => entry.code === finding.code && entry.message === finding.message)) {
    findings.push(finding);
  }
}

export function buildExplainSystemSymbolReport(
  request: ApiExplainSystemSymbolRequest | undefined,
  context: ExplainSystemSymbolBuildContext,
): ApiExplainSystemSymbolReport {
  const normalizedRequest = normalizeExplainSystemSymbolRequest(request);
  const resolvedSymbol = resolveSymbolName(normalizedRequest, context);
  const query: ApiExplainSystemSymbolRequest = {
    ...(request ?? {}),
    ...(resolvedSymbol.name ? { name: resolvedSymbol.name } : {}),
    locale: normalizedRequest.locale,
  };

  if (!resolvedSymbol.name) {
    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      apiVersion: PUBLIC_API_VERSION,
      available: false,
      reason: 'No se pudo resolver un simbolo del catalogo desde la consulta o el cursor actual.',
      query,
      resolution: {
        state: 'unresolved',
        candidateCount: 0,
        confidence: 'low',
      },
      findings: [
        {
          code: 'symbol-unresolved',
          severity: 'error',
          message: 'La consulta no produjo un simbolo del catalogo resoluble.',
        },
      ],
      recommendedActions: buildExplainSystemSymbolRecommendedActions({
        normalizedRequest,
        candidateCount: 0,
        state: 'unresolved',
      }),
    };
  }

  const rawCandidates = filterExplainSystemSymbolCandidates(
    context.systemCatalog.findSystemSymbol(resolvedSymbol.name).sort(compareExplainSystemSymbolCandidate),
    normalizedRequest,
    resolvedSymbol.ownerType,
  );
  const candidates = collapseExplainSystemSymbolFamilies(rawCandidates);

  const findings: ApiExplainSystemSymbolReport['findings'] = [];
  if (candidates.length === 0) {
    pushExplainSystemSymbolFinding(findings, {
      code: 'symbol-unresolved',
      severity: 'error',
      message: `No existe un simbolo del catalogo resoluble para ${resolvedSymbol.name}.`,
    });

    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      apiVersion: PUBLIC_API_VERSION,
      available: false,
      reason: `No existe un simbolo del catalogo resoluble para ${resolvedSymbol.name}.`,
      query,
      resolution: {
        state: 'unresolved',
        candidateCount: 0,
        confidence: 'low',
      },
      findings,
      recommendedActions: buildExplainSystemSymbolRecommendedActions({
        normalizedRequest,
        candidateCount: 0,
        state: 'unresolved',
      }),
    };
  }

  const preferredCandidate = selectPreferredExplainSystemSymbolCandidate(candidates, normalizedRequest);
  if (preferredCandidate) {
    candidates.splice(0, candidates.length, preferredCandidate);
  }

  if (candidates.length > 1) {
    pushExplainSystemSymbolFinding(findings, {
      code: 'symbol-ambiguous',
      severity: 'warning',
      message: `La consulta devuelve ${candidates.length} candidatos para ${resolvedSymbol.name}.`,
      detail: 'Restringe con ownerType, domain o kind antes de elegir un simbolo como winner contractual.',
    });

    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      apiVersion: PUBLIC_API_VERSION,
      available: true,
      reason: `La consulta devuelve ${candidates.length} candidatos para ${resolvedSymbol.name}.`,
      query,
      resolution: {
        state: 'ambiguous',
        candidateCount: candidates.length,
        confidence: 'medium',
      },
      candidates: buildExplainSystemSymbolCandidates(candidates, normalizedRequest),
      findings,
      recommendedActions: buildExplainSystemSymbolRecommendedActions({
        normalizedRequest,
        candidateCount: candidates.length,
        state: 'ambiguous',
      }),
    };
  }

  const selected = candidates[0];
  const localizedSummary = getDisplaySummary(selected, normalizedRequest.locale);
  const localizedDocumentation = getDisplayDocumentation(selected, normalizedRequest.locale);
  const localizedObsoleteMessage = getDisplayObsoleteMessage(selected, normalizedRequest.locale);
  const localizedFallbackToEnglish = normalizedRequest.locale === 'es'
    && localizedSummary === selected.summary
    && localizedDocumentation === selected.documentation
    && localizedObsoleteMessage === selected.obsoleteMessage;

  if (localizedFallbackToEnglish) {
    pushExplainSystemSymbolFinding(findings, {
      code: 'locale-fallback-en',
      severity: 'info',
      message: 'No existe overlay `es` completo para este simbolo; se devuelve el texto oficial disponible.',
    });
  }

  if (selected.obsolete) {
    pushExplainSystemSymbolFinding(findings, {
      code: 'symbol-obsolete',
      severity: 'warning',
      message: `${selected.name} esta marcado como obsoleto.`,
      ...(selected.replacement ? { detail: `Reemplazo sugerido: ${selected.replacement}.` } : {}),
    });
  }

  if (normalizedRequest.includeSignatures && selected.signatures.length > normalizedRequest.maxSignatures) {
    pushExplainSystemSymbolFinding(findings, {
      code: 'signatures-truncated',
      severity: 'info',
      message: `Las signatures se truncaron a ${normalizedRequest.maxSignatures}.`,
    });
  }

  if (
    normalizedRequest.includeEnumValues
    && normalizedRequest.maxEnumValues >= 0
    && (selected.kind === 'enumerated-type' || selected.kind === 'enumerated-value')
  ) {
    const totalEnumValues = selected.kind === 'enumerated-type'
      ? context.systemCatalog.listEnumeratedValuesForType(selected.name).length
      : (selected.enumValueOf ? context.systemCatalog.listEnumeratedValuesForType(selected.enumValueOf).length : 0);
    if (totalEnumValues > normalizedRequest.maxEnumValues) {
      pushExplainSystemSymbolFinding(findings, {
        code: 'enum-values-truncated',
        severity: 'info',
        message: `Los enum values se truncaron a ${normalizedRequest.maxEnumValues}.`,
      });
    }
  }

  const signatures = buildExplainSystemSymbolSignatures(selected, normalizedRequest);
  const enumInfo = buildExplainSystemSymbolEnumInfo(selected, context.systemCatalog, normalizedRequest);

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: true,
    query,
    resolution: {
      state: 'resolved',
      candidateCount: 1,
      selectedId: selected.id,
      confidence: 'high',
    },
    symbol: {
      id: selected.id,
      name: selected.name,
      normalizedName: selected.normalizedName,
      domain: selected.domain,
      kind: selected.kind,
      category: selected.category,
      ...(selected.ownerTypes?.length ? { ownerTypes: selected.ownerTypes } : {}),
      ...(selected.appliesTo?.length ? { appliesTo: selected.appliesTo } : {}),
      summary: localizedSummary,
      ...(localizedDocumentation ? { documentation: localizedDocumentation } : {}),
      ...(selected.obsolete ? { obsolete: true } : {}),
      ...(localizedObsoleteMessage ? { obsoleteMessage: localizedObsoleteMessage } : {}),
      ...(selected.replacement ? { replacement: selected.replacement } : {}),
      ...(selected.risk ? { risk: selected.risk } : {}),
      ...(normalizedRequest.includeProvenance && selected.provenance.sourceUrl ? { sourceUrl: selected.provenance.sourceUrl } : {}),
      ...(normalizedRequest.includeProvenance ? { authority: mapsToExplainSystemSymbolAuthority(selected) } : {}),
    },
    ...(signatures ? { signatures } : {}),
    ...(enumInfo ? { enumInfo } : {}),
    findings,
    recommendedActions: buildExplainSystemSymbolRecommendedActions({
      normalizedRequest,
      selected,
      candidateCount: 1,
      state: 'resolved',
    }),
  };
}