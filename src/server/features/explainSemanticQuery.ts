import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  PUBLIC_API_VERSION,
  toApiSymbol,
  type ApiExplainSemanticQueryReport,
  type ApiExplainSemanticQueryRequest,
} from '../../shared/publicApi';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { type TraceStep } from '../knowledge/queryTrace';
import { type InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import {
  type ContextDiscardEvidence,
  type DistanceDiscardEvidence,
  type FallbackAmbiguityEvidence,
  type QueryEvidenceEntry,
  type ResolvedTargetInfo,
  type SignatureDiscardEvidence,
  type SourceOriginConflictEvidence,
} from '../knowledge/resolution/semanticQueryService';
import { getDocumentLineText } from '../utils/documentLineText';
import { createDocumentQueryContext } from './queryContext';

const DEFAULT_MAX_CANDIDATES = 8;
const DEFAULT_MAX_DISCARDS = 8;
const DEFAULT_MAX_TRACE_STEPS = 24;

export interface ExplainSemanticQueryBuildContext {
  knowledgeBase: KnowledgeBase;
  inheritanceGraph: InheritanceGraph;
  document?: TextDocument;
  hotContext?: HotContextCache;
}

interface NormalizedExplainSemanticQueryRequest {
  uri?: string;
  line?: number;
  character?: number;
  includeCandidates: boolean;
  includeDiscards: boolean;
  includeTrace: boolean;
  maxCandidates: number;
  maxDiscards: number;
  maxTraceSteps: number;
}

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

function normalizeExplainSemanticQueryRequest(
  request: ApiExplainSemanticQueryRequest = {},
): NormalizedExplainSemanticQueryRequest {
  return {
    ...(request.uri ? { uri: request.uri } : {}),
    ...(typeof request.line === 'number' ? { line: Math.max(0, Math.trunc(request.line)) } : {}),
    ...(typeof request.character === 'number' ? { character: Math.max(0, Math.trunc(request.character)) } : {}),
    includeCandidates: request.includeCandidates ?? true,
    includeDiscards: request.includeDiscards ?? true,
    includeTrace: request.includeTrace ?? true,
    maxCandidates: clampNumber(request.maxCandidates, 1, 50, DEFAULT_MAX_CANDIDATES),
    maxDiscards: clampNumber(request.maxDiscards, 0, 50, DEFAULT_MAX_DISCARDS),
    maxTraceSteps: clampNumber(request.maxTraceSteps, 0, 100, DEFAULT_MAX_TRACE_STEPS),
  };
}

function toTracePhases(trace: readonly TraceStep[]): string[] {
  const phases: string[] = [];
  const seen = new Set<string>();
  for (const step of trace) {
    if (!step.phase || seen.has(step.phase)) {
      continue;
    }

    seen.add(step.phase);
    phases.push(step.phase);
  }
  return phases;
}

function toTraceActions(trace: readonly TraceStep[]): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();
  for (const step of trace) {
    if (!step.action || seen.has(step.action)) {
      continue;
    }

    seen.add(step.action);
    actions.push(step.action);
  }
  return actions;
}

function mapDiscardEvidence(
  evidence: QueryEvidenceEntry,
): NonNullable<ApiExplainSemanticQueryReport['discards']>[number] | undefined {
  switch (evidence.kind) {
    case 'discarded-distance': {
      const item = evidence as DistanceDiscardEvidence;
      return {
        kind: item.kind,
        reasonCode: item.reasonCode,
        summary: `${item.targetName} descartado por distancia (${item.candidateDistance} > ${item.winnerDistance}).`,
        detail: item.targetContainer
          ? `Container ${item.targetContainer}.`
          : undefined,
      };
    }
    case 'discarded-signature': {
      const item = evidence as SignatureDiscardEvidence;
      return {
        kind: item.kind,
        reasonCode: item.reasonCode,
        summary: `${item.targetName} descartado por firma (${item.reason}).`,
        detail: item.signature
          ? `Signature ${item.signature}.`
          : undefined,
      };
    }
    case 'discarded-context': {
      const item = evidence as ContextDiscardEvidence;
      return {
        kind: item.kind,
        summary: item.reason === 'qualifier-unresolved'
          ? `El qualifier ${item.qualifier} no pudo resolverse.`
          : `El qualifier ${item.qualifier} no coincide con el owner esperado.`,
        detail: item.resolvedType
          ? `Resolved type ${item.resolvedType}.`
          : undefined,
      };
    }
    case 'source-origin-conflict': {
      const item = evidence as SourceOriginConflictEvidence;
      return {
        kind: item.kind,
        reasonCode: item.reasonCode,
        summary: `Se priorizó sourceOrigin ${item.preferredOrigin} frente a ${item.discardedOrigins.join(', ')}.`,
        detail: `${item.candidateCount} candidatos competían por el mismo target.`,
      };
    }
    case 'fallback-ambiguity': {
      const item = evidence as FallbackAmbiguityEvidence;
      return {
        kind: item.kind,
        reasonCode: item.reasonCode,
        summary: `El fallback global dejó ${item.candidateCount} candidatos empatados.`,
      };
    }
    default:
      return undefined;
  }
}

function deriveCostBucket(
  traceSteps: number,
  candidateCount: number,
  discardCount: number,
): ApiExplainSemanticQueryReport['cost']['approximate'] {
  const score = traceSteps + candidateCount + discardCount;
  if (score >= 18) {
    return 'high';
  }
  if (score >= 8) {
    return 'medium';
  }
  return 'low';
}

function buildResolutionState(resolvedTargets: ResolvedTargetInfo | null): ApiExplainSemanticQueryReport['resolution']['state'] {
  if (!resolvedTargets) {
    return 'no-context';
  }
  if (resolvedTargets.targets.length === 0) {
    return 'unresolved';
  }
  if (resolvedTargets.targets.length > 1) {
    return 'ambiguous';
  }
  return 'resolved';
}

function buildFindings(
  state: ApiExplainSemanticQueryReport['resolution']['state'],
  resolvedTargets: ResolvedTargetInfo | null,
): ApiExplainSemanticQueryReport['findings'] {
  const findings: ApiExplainSemanticQueryReport['findings'] = [];

  if (state === 'no-context') {
    findings.push({
      code: 'query-no-context',
      severity: 'warning',
      message: 'La posición no expone una invocación o identificador resoluble.',
    });
  }

  if (state === 'unresolved') {
    findings.push({
      code: 'query-unresolved',
      severity: 'warning',
      message: 'La query semántica no encontró targets compatibles.',
    });
  }

  if (state === 'ambiguous') {
    findings.push({
      code: 'query-ambiguous',
      severity: 'warning',
      message: 'La query semántica terminó con más de un target ganador.',
      detail: resolvedTargets?.ambiguityKind,
    });
  }

  if (resolvedTargets?.confidence === 'low') {
    findings.push({
      code: 'query-low-confidence',
      severity: 'info',
      message: 'La resolución quedó con confidence low.',
      detail: resolvedTargets.reasonCodes[0],
    });
  }

  return findings;
}

function buildRecommendedActions(
  state: ApiExplainSemanticQueryReport['resolution']['state'],
  resolvedTargets: ResolvedTargetInfo | null,
): string[] {
  if (state === 'resolved') {
    return ['Usar el winner actual como baseline para definition/references/rename.'];
  }

  if (state === 'ambiguous') {
    return [
      'Añadir un qualifier o un owner más explícito para romper el empate.',
      'Inspeccionar los candidatos ganadores antes de abrir rename o references.',
    ];
  }

  if (state === 'unresolved') {
    return [
      'Verificar el owner activo y el nombre del símbolo en la posición analizada.',
      'Revisar si la invocación depende de un qualifier o de un target global no indexado.',
    ];
  }

  return [
    resolvedTargets?.resolvedQualifierType
      ? `Mover el cursor sobre una invocación completa del owner ${resolvedTargets.resolvedQualifierType}.`
      : 'Mover el cursor sobre una invocación o identificador PowerBuilder resoluble.',
  ];
}

function buildPhases(
  state: ApiExplainSemanticQueryReport['resolution']['state'],
  resolvedTargets: ResolvedTargetInfo | null,
  trace: readonly TraceStep[],
  discardCount: number,
): ApiExplainSemanticQueryReport['phases'] {
  const candidateCount = resolvedTargets?.candidatePool.length ?? 0;
  return [
    {
      name: 'context',
      status: state === 'no-context' ? 'unresolved' : 'resolved',
      summary: state === 'no-context'
        ? 'No se detectó un contexto de invocación utilizable en la posición.'
        : `Contexto identificado para ${resolvedTargets?.context.identifier ?? 'unknown'}.`,
    },
    {
      name: 'candidates',
      status: candidateCount === 0 ? 'unresolved' : (candidateCount > 1 ? 'ambiguous' : 'resolved'),
      summary: `${candidateCount} candidatos tras filtros semánticos; ${discardCount} descartes registrados.`,
    },
    {
      name: 'resolution',
      status: state === 'resolved' ? 'resolved' : (state === 'ambiguous' ? 'ambiguous' : 'unresolved'),
      summary: state === 'resolved'
        ? `Winner único con reason ${resolvedTargets?.reasonCodes[0] ?? 'unknown'} y confidence ${resolvedTargets?.confidence ?? 'unknown'}.`
        : state === 'ambiguous'
          ? `La resolución quedó ambigua (${resolvedTargets?.ambiguityKind ?? 'unknown'}).`
          : state === 'unresolved'
            ? 'No hubo targets finales después del ranking.'
            : 'La resolución no llegó a ejecutarse por falta de contexto.',
    },
    {
      name: 'trace',
      status: trace.length > 0 ? 'resolved' : 'skipped',
      summary: trace.length > 0
        ? `${trace.length} pasos de trace capturados en ${toTracePhases(trace).join(', ') || 'sin fases'} .`
        : 'No se capturaron pasos de trace para esta query.',
    },
  ];
}

export function buildExplainSemanticQueryReport(
  request: ApiExplainSemanticQueryRequest = {},
  context: ExplainSemanticQueryBuildContext,
): ApiExplainSemanticQueryReport {
  const normalizedRequest = normalizeExplainSemanticQueryRequest(request);

  if (!context.document) {
    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      apiVersion: PUBLIC_API_VERSION,
      available: false,
      reason: 'No se pudo cargar el documento solicitado.',
      query: request,
      resolution: {
        state: 'no-context',
        candidateCount: 0,
        targetCount: 0,
        reasonCodes: [],
        evidenceKinds: [],
      },
      phases: [],
      cost: {
        approximate: 'low',
        traceSteps: 0,
        candidateCount: 0,
        discardCount: 0,
      },
      findings: [{
        code: 'document-unavailable',
        severity: 'error',
        message: 'No se pudo cargar el documento solicitado.',
      }],
      recommendedActions: ['Volver a ejecutar la query con un documento PowerBuilder accesible.'],
    };
  }

  if (typeof normalizedRequest.line !== 'number' || typeof normalizedRequest.character !== 'number') {
    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      apiVersion: PUBLIC_API_VERSION,
      available: false,
      reason: 'La query semántica necesita line y character para construir el explain plan.',
      query: request,
      resolution: {
        state: 'no-context',
        candidateCount: 0,
        targetCount: 0,
        reasonCodes: [],
        evidenceKinds: [],
      },
      phases: [],
      cost: {
        approximate: 'low',
        traceSteps: 0,
        candidateCount: 0,
        discardCount: 0,
      },
      findings: [{
        code: 'position-required',
        severity: 'error',
        message: 'La query semántica necesita line y character.',
      }],
      recommendedActions: ['Reenviar la petición con la posición exacta del cursor.'],
    };
  }

  const position = Position.create(normalizedRequest.line, normalizedRequest.character);
  const queryContext = createDocumentQueryContext(
    context.document,
    position,
    context.knowledgeBase,
    context.inheritanceGraph,
    context.hotContext,
    'explain-semantic-query',
  );
  const resolvedTargets = queryContext.resolvedTargets;
  const state = buildResolutionState(resolvedTargets);
  const discardEntries = resolvedTargets?.evidence
    .map(mapDiscardEvidence)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .slice(0, normalizedRequest.maxDiscards) ?? [];
  const traceSteps = normalizedRequest.includeTrace
    ? (resolvedTargets?.trace ?? []).slice(0, normalizedRequest.maxTraceSteps)
    : [];
  const candidateCount = resolvedTargets?.candidatePool.length ?? 0;
  const targetCount = resolvedTargets?.targets.length ?? 0;
  const winner = state === 'resolved' && resolvedTargets?.targets[0]
    ? {
      ...toApiSymbol(resolvedTargets.targets[0]),
      ...(resolvedTargets.targets[0].containerName ? { containerName: resolvedTargets.targets[0].containerName } : {}),
      ...(resolvedTargets.targets[0].lineage?.sourceOrigin ? { sourceOrigin: resolvedTargets.targets[0].lineage.sourceOrigin } : {}),
      ...(resolvedTargets.targets[0].lineage?.authority ? { authority: resolvedTargets.targets[0].lineage.authority } : {}),
      ...(resolvedTargets.targets[0].lineage?.phase ? { phase: resolvedTargets.targets[0].lineage.phase } : {}),
      ...(resolvedTargets.targets[0].lineage?.role ? { role: resolvedTargets.targets[0].lineage.role } : {}),
      ...(resolvedTargets.winnerLineage?.confidence ? { confidence: resolvedTargets.winnerLineage.confidence } : {}),
      ...(resolvedTargets.winnerLineage?.resolutionKind ? { resolutionKind: resolvedTargets.winnerLineage.resolutionKind } : {}),
    }
    : undefined;
  const findings = buildFindings(state, resolvedTargets);
  const recommendedActions = buildRecommendedActions(state, resolvedTargets);
  const phases = buildPhases(state, resolvedTargets, traceSteps, discardEntries.length);

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: true,
    query: request,
    document: {
      uri: context.document.uri,
      line: normalizedRequest.line,
      character: normalizedRequest.character,
      ...(queryContext.context?.identifier ? { identifier: queryContext.context.identifier } : {}),
      ...(queryContext.context?.qualifier ? { qualifier: queryContext.context.qualifier } : {}),
      ...(queryContext.currentMainObject?.name ? { currentObject: queryContext.currentMainObject.name } : {}),
    },
    resolution: {
      state,
      candidateCount,
      targetCount,
      ...(resolvedTargets?.confidence ? { confidence: resolvedTargets.confidence } : {}),
      reasonCodes: resolvedTargets?.reasonCodes ?? [],
      ...(queryContext.primaryResolutionReasonCode ? { primaryReasonCode: queryContext.primaryResolutionReasonCode } : {}),
      ...(queryContext.invocationKind ? { invocationKind: queryContext.invocationKind } : {}),
      ...(queryContext.invocationRisk ? { invocationRisk: queryContext.invocationRisk } : {}),
      ...(queryContext.ambiguityKind ? { ambiguityKind: queryContext.ambiguityKind } : {}),
      ...(resolvedTargets?.resolvedQualifierType ? { resolvedQualifierType: resolvedTargets.resolvedQualifierType } : {}),
      evidenceKinds: queryContext.resolutionEvidenceKinds,
    },
    ...(winner ? { winner } : {}),
    ...(normalizedRequest.includeCandidates
      ? {
        candidates: (resolvedTargets?.candidatePool ?? [])
          .slice(0, normalizedRequest.maxCandidates)
          .map((candidate) => ({
            name: candidate.targetName,
            kind: candidate.targetKind,
            uri: candidate.targetUri,
            ...(candidate.targetContainer ? { containerName: candidate.targetContainer } : {}),
            reasonCode: candidate.reasonCode,
          })),
      }
      : {}),
    ...(normalizedRequest.includeDiscards && discardEntries.length > 0 ? { discards: discardEntries } : {}),
    phases,
    cost: {
      approximate: deriveCostBucket(traceSteps.length, candidateCount, discardEntries.length),
      traceSteps: traceSteps.length,
      candidateCount,
      discardCount: discardEntries.length,
    },
    ...(normalizedRequest.includeTrace
      ? {
        trace: {
          label: 'explain-semantic-query',
          stepCount: traceSteps.length,
          phases: toTracePhases(traceSteps),
          actions: toTraceActions(traceSteps),
          ...(traceSteps.length > 0 ? { lastStepName: traceSteps[traceSteps.length - 1]?.name } : {}),
          steps: traceSteps.map((step) => ({
            name: step.name,
            ...(step.phase ? { phase: step.phase } : {}),
            ...(step.action ? { action: step.action } : {}),
            ...(step.detail !== undefined ? { detail: step.detail } : {}),
          })),
        },
      }
      : {}),
    findings,
    recommendedActions,
  };
}