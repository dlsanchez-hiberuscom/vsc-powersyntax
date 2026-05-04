import {
  PUBLIC_API_VERSION,
  type ApiCurrentObjectContext,
  type ApiExplainDiagnosticReport,
  type ApiExplainDiagnosticRequest,
  type ApiSafeEditPlan,
} from '../shared/publicApi';

export interface NormalizedExplainDiagnosticRequest {
  includeObjectContext: boolean;
  includeSafeFixPlan: boolean;
  maxEvidence: number;
  maxExcerptLines: number;
}

export interface ExplainDiagnosticCandidateData {
  confidence?: 'high' | 'medium' | 'low';
  reasonCodes?: string[];
  evidenceKinds?: string[];
  targetCount?: number;
  candidateCount?: number;
  hasAmbiguity?: boolean;
  qualifier?: string;
  ownerType?: string;
}

export interface ExplainDiagnosticCandidateInput {
  uri: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  line: number;
  character: number;
  endLine: number;
  endCharacter: number;
  source?: string;
  data?: ExplainDiagnosticCandidateData;
}

interface DiagnosticExplanationDescriptor {
  title: string;
  summary: string;
  area: ApiExplainDiagnosticReport['explanation']['area'];
  confidence: ApiExplainDiagnosticReport['explanation']['confidence'];
  whyItMatters?: string;
  recommendedActions: string[];
  safeFixKind?: NonNullable<ApiExplainDiagnosticReport['safeFix']>['kind'];
  safeFixConfidence?: NonNullable<ApiExplainDiagnosticReport['safeFix']>['confidence'];
}

export interface PickExplainDiagnosticCandidateResult {
  diagnostic?: ExplainDiagnosticCandidateInput;
  reason?: string;
}

const SEVERITY_ORDER: Record<ExplainDiagnosticCandidateInput['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3,
};

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

function normalizeCodeKey(code: string | undefined): string {
  return code?.trim().toLowerCase() ?? '';
}

function diagnosticContainsPosition(
  diagnostic: ExplainDiagnosticCandidateInput,
  line: number,
  character: number,
): boolean {
  if (line < diagnostic.line || line > diagnostic.endLine) {
    return false;
  }

  if (line === diagnostic.line && character < diagnostic.character) {
    return false;
  }

  if (line === diagnostic.endLine && character > diagnostic.endCharacter) {
    return false;
  }

  return true;
}

function diagnosticSpan(diagnostic: ExplainDiagnosticCandidateInput): number {
  return ((diagnostic.endLine - diagnostic.line) * 1000) + (diagnostic.endCharacter - diagnostic.character);
}

function distanceToPosition(
  diagnostic: ExplainDiagnosticCandidateInput,
  line: number,
  character: number,
): number {
  if (diagnosticContainsPosition(diagnostic, line, character)) {
    return 0;
  }

  if (line < diagnostic.line) {
    return ((diagnostic.line - line) * 1000) + Math.max(0, diagnostic.character - character);
  }

  if (line > diagnostic.endLine) {
    return ((line - diagnostic.endLine) * 1000) + Math.max(0, character - diagnostic.endCharacter);
  }

  if (line === diagnostic.line) {
    return Math.abs(diagnostic.character - character);
  }

  if (line === diagnostic.endLine) {
    return Math.abs(character - diagnostic.endCharacter);
  }

  return 1;
}

function sortCandidatesByRelevance(
  candidates: readonly ExplainDiagnosticCandidateInput[],
  line?: number,
  character?: number,
): ExplainDiagnosticCandidateInput[] {
  return [...candidates].sort((left, right) => {
    const leftDistance = typeof line === 'number' && typeof character === 'number'
      ? distanceToPosition(left, line, character)
      : 0;
    const rightDistance = typeof line === 'number' && typeof character === 'number'
      ? distanceToPosition(right, line, character)
      : 0;

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    const severityDelta = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const spanDelta = diagnosticSpan(left) - diagnosticSpan(right);
    if (spanDelta !== 0) {
      return spanDelta;
    }

    if (left.line !== right.line) {
      return left.line - right.line;
    }

    if (left.character !== right.character) {
      return left.character - right.character;
    }

    return left.message.localeCompare(right.message);
  });
}

function extractQuotedIdentifier(message: string): string | undefined {
  const singleQuoteMatch = /'([^']+)'/.exec(message);
  if (singleQuoteMatch?.[1]) {
    return singleQuoteMatch[1];
  }

  const doubleQuoteMatch = /"([^"]+)"/.exec(message);
  return doubleQuoteMatch?.[1];
}

function inferConfidence(
  diagnostic: ExplainDiagnosticCandidateInput,
  descriptor: DiagnosticExplanationDescriptor,
): ApiExplainDiagnosticReport['explanation']['confidence'] {
  return diagnostic.data?.confidence ?? descriptor.confidence;
}

function buildSafeFixPlanSummary(safeEditPlan: ApiSafeEditPlan | undefined): string | undefined {
  if (!safeEditPlan) {
    return undefined;
  }

  const parts: string[] = [];
  if (safeEditPlan.files.length > 0) {
    parts.push(`${safeEditPlan.files.length} archivo(s)`);
  }
  if (safeEditPlan.risks.length > 0) {
    parts.push(`${safeEditPlan.risks.length} riesgo(s)`);
  }
  if (safeEditPlan.recommendedTests.length > 0) {
    parts.push(`${safeEditPlan.recommendedTests.length} test(s)`);
  }
  if (safeEditPlan.docsToReview.length > 0) {
    parts.push(`${safeEditPlan.docsToReview.length} doc(s)`);
  }

  return parts.length > 0 ? `Plan read-only con ${parts.join(', ')}.` : undefined;
}

function addEvidence(
  evidence: ApiExplainDiagnosticReport['evidence'],
  item: ApiExplainDiagnosticReport['evidence'][number],
): void {
  const key = `${item.kind}:${item.label}:${item.uri ?? ''}:${item.line ?? ''}:${item.character ?? ''}`;
  if (evidence.some((existing: ApiExplainDiagnosticReport['evidence'][number]) => `${existing.kind}:${existing.label}:${existing.uri ?? ''}:${existing.line ?? ''}:${existing.character ?? ''}` === key)) {
    return;
  }

  evidence.push(item);
}

export function normalizeExplainDiagnosticRequest(request: ApiExplainDiagnosticRequest = {}): NormalizedExplainDiagnosticRequest {
  return {
    includeObjectContext: request.includeObjectContext ?? true,
    includeSafeFixPlan: request.includeSafeFixPlan ?? true,
    maxEvidence: clampNumber(request.maxEvidence, 1, 12, 4),
    maxExcerptLines: clampNumber(request.maxExcerptLines, 1, 40, 8),
  };
}

export function describeExplainableDiagnostic(input: {
  code?: string;
  message: string;
  data?: ExplainDiagnosticCandidateData;
}): DiagnosticExplanationDescriptor {
  const upperCode = (input.code ?? '').toUpperCase();
  const lowerCode = normalizeCodeKey(input.code);
  const lowerMessage = input.message.toLowerCase();

  switch (upperCode) {
    case 'SD2':
      return {
        title: 'Callable no resuelto',
        summary: 'La llamada no pudo ligarse a un símbolo único y defendible en el contexto actual.',
        area: 'semantic',
        confidence: input.data?.reasonCodes?.length ? 'high' : 'medium',
        whyItMatters: 'Mientras siga sin resolverse, navegación, referencias, rename y fixes seguros degradarán o quedarán bloqueados.',
        recommendedActions: [
          'Revisar owner, base type y scope visible del callable.',
          'Comprobar nombres, overloads y qualifier efectivo de la llamada.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'medium',
      };
    case 'SD3':
      return {
        title: 'Base type no resuelto',
        summary: 'La cadena de herencia o el tipo base del objeto no quedó demostrada con evidencia suficiente.',
        area: 'lifecycle',
        confidence: 'high',
        whyItMatters: 'Sin base type defendible, la semántica heredada y varios consumers read-only pierden contexto real.',
        recommendedActions: [
          'Verificar que el ancestor exista y esté descubierto en el workspace.',
          'Revisar project routing, sourceOrigin y librerías visibles para el objeto base.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'low',
      };
    case 'SD4':
    case 'SD5':
      return {
        title: 'Símbolo declarado pero no usado',
        summary: 'La declaración quedó publicada sin lecturas posteriores defendibles.',
        area: 'unused',
        confidence: 'high',
        whyItMatters: 'Añade ruido, complica el mantenimiento y suele señalar código muerto o refactors incompletos.',
        recommendedActions: [
          'Eliminar la declaración si ya no forma parte del flujo real.',
          'Si el uso existe, comprobar que no quede escondido por código muerto o rutas no soportadas.',
        ],
        safeFixKind: 'remove-declaration',
        safeFixConfidence: 'high',
      };
    case 'SD6':
      return {
        title: 'Shadowing de símbolo',
        summary: 'Una declaración cercana oculta otra previa y cambia el winner semántico esperado.',
        area: 'shadowing',
        confidence: 'high',
        whyItMatters: 'El código sigue compilando a veces, pero la intención real y las refactorizaciones se vuelven ambiguas.',
        recommendedActions: [
          'Renombrar el símbolo más cercano para recuperar claridad semántica.',
          'Verificar qué símbolo debería ganar realmente en ese scope.',
        ],
        safeFixKind: 'rename-symbol',
        safeFixConfidence: 'high',
      };
    case 'SD7':
      return {
        title: 'Símbolo obsoleto',
        summary: 'La llamada apunta a una API o símbolo marcado como obsoleto dentro del catálogo soportado.',
        area: 'catalog',
        confidence: 'high',
        whyItMatters: 'Mantener la API obsoleta aumenta riesgo de drift funcional y dificulta migraciones futuras.',
        recommendedActions: [
          'Buscar la alternativa vigente en catálogo o documentación del runtime.',
          'Revisar si existe quick fix, nota de obsolescencia o guidance del sistema.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'medium',
      };
    case 'SD8':
      return {
        title: 'Declaración duplicada',
        summary: 'El mismo identificador aparece en un scope incompatible o redundante.',
        area: 'semantic',
        confidence: 'high',
        whyItMatters: 'La duplicidad vuelve ambiguo el owner real del símbolo y puede romper rename o navegación.',
        recommendedActions: [
          'Eliminar la variante redundante o unificar la declaración.',
          'Si ambas son necesarias, renombrar para que el contrato semántico sea explícito.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'medium',
      };
    case 'SD9':
    case 'SD10':
    case 'SD11':
    case 'SD12':
    case 'SD13':
      return {
        title: 'Problema estructural o de control de flujo',
        summary: 'La forma del bloque o del retorno no respeta el contrato esperado por parser o passes semánticos.',
        area: 'parser',
        confidence: 'high',
        whyItMatters: 'Mientras la estructura siga rota, el resto de diagnostics y consumers pueden encadenar ruido secundario.',
        recommendedActions: [
          'Revisar delimitadores, ramas y retornos cerca de la posición reportada.',
          'Corregir primero el bloque estructural antes de abordar symptoms posteriores.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'low',
      };
    default:
      if (lowerCode === 'enum-value-context-mismatch') {
        return {
          title: 'Enum incompatible con el tipo esperado',
          summary: 'El enum value usado no encaja con el contexto o datatype esperado por el consumer.',
          area: 'catalog',
          confidence: 'high',
          whyItMatters: 'Usar el enum equivocado degrada signature help, completion contextual y seguridad del cambio posterior.',
          recommendedActions: [
            'Sustituir el enum por uno válido para el datatype esperado.',
            'Contrastar ownerType, enumValueOf y catálogo contextual antes de editar.',
          ],
          safeFixKind: 'replace-enum-value',
          safeFixConfidence: 'high',
        };
      }

      if (
        lowerCode.startsWith('dataobject-')
        || lowerCode === 'retrieve-arity-mismatch'
        || lowerCode.startsWith('transaction-binding-')
        || lowerCode.startsWith('datawindow-')
      ) {
        return {
          title: 'Binding DataWindow no defendible',
          summary: 'El bridge DataWindow no pudo demostrar de forma única el target, la aridad o el binding transaccional asociado.',
          area: 'datawindow',
          confidence: lowerCode.includes('dynamic') ? 'low' : 'high',
          whyItMatters: 'Mientras el binding siga incompleto, navegación, diagnostics y lineage derivados perderán precisión.',
          recommendedActions: [
            'Comprobar el literal DataObject, la aridad de Retrieve() y el binding transaccional previo.',
            'Reducir dinamismo si necesitas navegación o explicación más fuerte.',
          ],
          safeFixKind: 'manual-review',
          safeFixConfidence: lowerCode.includes('dynamic') ? 'low' : 'medium',
        };
      }

      if (lowerCode === 'native-dependency') {
        return {
          title: 'Dependencia externa o nativa',
          summary: 'La resolución depende de runtime nativo o superficie externa no modelada completamente por el plugin.',
          area: 'lifecycle',
          confidence: 'medium',
          whyItMatters: 'La automatización debe degradar con honestidad cuando el runtime observable no basta para cerrar el caso.',
          recommendedActions: [
            'Verificar firmas externas, librerías nativas y disponibilidad real del runtime.',
            'Aceptar degradación honesta si la dependencia no es observable desde el workspace.',
          ],
          safeFixKind: 'manual-review',
          safeFixConfidence: 'low',
        };
      }

      if (lowerMessage.includes('sql') || lowerMessage.includes('execute immediate')) {
        return {
          title: 'Riesgo SQL o binding dinámico',
          summary: 'La sentencia o el binding SQL no dejó suficiente evidencia estructurada para una explicación más fuerte.',
          area: 'sql',
          confidence: 'low',
          whyItMatters: 'SQL dinámico o poco estructurado reduce la seguridad de diagnóstico, lineage y automatización.',
          recommendedActions: [
            'Revisar la statement y el contexto transaccional exacto alrededor del cursor.',
            'Reducir dinamismo o aportar anchors más explícitos si necesitas tooling más fuerte.',
          ],
          safeFixKind: 'manual-review',
          safeFixConfidence: 'low',
        };
      }

      return {
        title: 'Diagnostic explicado de forma genérica',
        summary: 'El diagnostic no tiene una ficha específica todavía, pero puede resumirse con contexto mínimo y acciones conservadoras.',
        area: 'unknown',
        confidence: 'low',
        whyItMatters: 'Aunque el caso no esté especializado, sigue siendo importante anclarlo a código, posición y evidencia real antes de editar.',
        recommendedActions: [
          'Revisar el mensaje y la ubicación exacta antes de proponer cambios.',
          'Contrastar el caso con el contexto activo, diagnostics cercanos y reglas del proyecto.',
        ],
        safeFixKind: 'manual-review',
        safeFixConfidence: 'low',
      };
  }
}

export function pickExplainDiagnosticCandidate(
  candidates: readonly ExplainDiagnosticCandidateInput[],
  request: ApiExplainDiagnosticRequest = {},
): PickExplainDiagnosticCandidateResult {
  if (candidates.length === 0) {
    return { reason: 'No hay diagnostics publicados para la ubicación solicitada.' };
  }

  let filtered = [...candidates];
  if (request.code) {
    const requestedCode = normalizeCodeKey(request.code);
    filtered = filtered.filter((candidate) => normalizeCodeKey(candidate.code) === requestedCode);
    if (filtered.length === 0) {
      return { reason: `No se encontró ningún diagnostic con código ${request.code}.` };
    }
  }

  const hasPosition = typeof request.line === 'number' && typeof request.character === 'number';
  const sorted = sortCandidatesByRelevance(filtered, request.line, request.character);

  if (typeof request.diagnosticIndex === 'number') {
    const selected = sorted[Math.max(0, Math.trunc(request.diagnosticIndex))];
    return selected
      ? { diagnostic: selected }
      : { reason: `El diagnosticIndex ${request.diagnosticIndex} queda fuera del rango disponible (${sorted.length}).` };
  }

  if (hasPosition) {
    return { diagnostic: sorted[0] };
  }

  if (sorted.length === 1) {
    return { diagnostic: sorted[0] };
  }

  return {
    reason: 'Hay varios diagnostics disponibles y falta una posición, un código o un diagnosticIndex para elegir uno de forma defendible.',
  };
}

export function buildUnavailableExplainDiagnosticReport(reason: string): ApiExplainDiagnosticReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: false,
    reason,
    explanation: {
      summary: 'No se pudo construir una explicación del diagnostic solicitado.',
      area: 'unknown',
      confidence: 'low',
    },
    evidence: [],
    recommendedActions: ['Mover el cursor a un diagnostic PowerBuilder publicado y reintentar.'],
  };
}

function buildSafeFix(
  descriptor: DiagnosticExplanationDescriptor,
  safeEditPlan: ApiSafeEditPlan | undefined,
): ApiExplainDiagnosticReport['safeFix'] | undefined {
  if (!descriptor.safeFixKind && !safeEditPlan) {
    return undefined;
  }

  const blocked = safeEditPlan?.blocked ?? false;
  const planSummary = buildSafeFixPlanSummary(safeEditPlan);
  return {
    available: !blocked,
    kind: descriptor.safeFixKind ?? 'manual-review',
    confidence: descriptor.safeFixConfidence ?? descriptor.confidence,
    ...(blocked ? { blocked: true, blockedReasons: safeEditPlan?.blockedReasons ?? ['Safe edit plan bloqueado.'] } : {}),
    ...(planSummary ? { planSummary } : {}),
  };
}

function buildRecommendedActions(
  descriptor: DiagnosticExplanationDescriptor,
  safeEditPlan: ApiSafeEditPlan | undefined,
): string[] {
  const actions = new Set<string>(descriptor.recommendedActions);

  if (safeEditPlan?.blockedReasons.length) {
    for (const blockedReason of safeEditPlan.blockedReasons) {
      actions.add(`Resolver bloqueo del safe edit plan: ${blockedReason}.`);
    }
  }

  for (const recommendedTest of safeEditPlan?.recommendedTests ?? []) {
    actions.add(`Validar con ${recommendedTest}.`);
  }

  for (const doc of safeEditPlan?.docsToReview ?? []) {
    actions.add(`Revisar ${doc}.`);
  }

  return Array.from(actions).slice(0, 8);
}

function buildEvidence(
  diagnostic: ExplainDiagnosticCandidateInput,
  descriptor: DiagnosticExplanationDescriptor,
  objectContext: ApiCurrentObjectContext | undefined,
  request: NormalizedExplainDiagnosticRequest,
): ApiExplainDiagnosticReport['evidence'] {
  const evidence: ApiExplainDiagnosticReport['evidence'] = [];
  const identifier = extractQuotedIdentifier(diagnostic.message);

  addEvidence(evidence, {
    kind: 'rule',
    label: descriptor.title,
    detail: descriptor.summary,
    uri: diagnostic.uri,
    line: diagnostic.line,
    character: diagnostic.character,
  });

  if (diagnostic.data?.reasonCodes?.length) {
    addEvidence(evidence, {
      kind: 'scope',
      label: 'Reason codes',
      detail: diagnostic.data.reasonCodes.join(', '),
      uri: diagnostic.uri,
      line: diagnostic.line,
      character: diagnostic.character,
    });
  }

  if (typeof diagnostic.data?.candidateCount === 'number' || typeof diagnostic.data?.targetCount === 'number') {
    addEvidence(evidence, {
      kind: 'dependency',
      label: 'Resolution candidates',
      detail: [
        typeof diagnostic.data.candidateCount === 'number' ? `candidateCount=${diagnostic.data.candidateCount}` : undefined,
        typeof diagnostic.data.targetCount === 'number' ? `targetCount=${diagnostic.data.targetCount}` : undefined,
        diagnostic.data.hasAmbiguity ? 'hasAmbiguity=true' : undefined,
      ].filter((part): part is string => Boolean(part)).join(', '),
      uri: diagnostic.uri,
      line: diagnostic.line,
      character: diagnostic.character,
    });
  }

  if (objectContext?.objectInfo) {
    addEvidence(evidence, {
      kind: 'scope',
      label: 'Current object',
      detail: [objectContext.objectInfo.globalType, objectContext.objectInfo.objectKind, objectContext.objectInfo.readiness]
        .filter((part): part is string => Boolean(part))
        .join(' · '),
      uri: objectContext.objectInfo.uri,
      line: diagnostic.line,
      character: diagnostic.character,
    });
  }

  if (objectContext?.sourceExcerpt?.text) {
    addEvidence(evidence, {
      kind: 'source-excerpt',
      label: 'Source excerpt',
      detail: objectContext.sourceExcerpt.text,
      uri: diagnostic.uri,
      line: objectContext.sourceExcerpt.startLine,
      character: diagnostic.character,
    });
  }

  if (identifier) {
    const variable = objectContext?.visibleVariables?.find((entry) => entry.name.toLowerCase() === identifier.toLowerCase());
    if (variable) {
      addEvidence(evidence, {
        kind: 'symbol',
        label: variable.name,
        detail: [variable.scope, variable.datatype, variable.relation].filter((part): part is string => Boolean(part)).join(' · '),
        uri: variable.uri,
        line: variable.line,
        character: variable.character,
      });
    }

    const reference = objectContext?.referencedSymbols?.find((entry) => entry.identifier.toLowerCase() === identifier.toLowerCase());
    if (reference) {
      addEvidence(evidence, {
        kind: 'symbol',
        label: reference.target.name,
        detail: [reference.reasonCode, reference.invocationKind, reference.invocationRisk].filter((part): part is string => Boolean(part)).join(' · '),
        uri: reference.target.uri,
        line: reference.target.line,
        character: reference.target.character,
      });
    }
  }

  if (descriptor.area === 'datawindow') {
    const binding = objectContext?.dataWindowBindings?.[0];
    if (binding) {
      addEvidence(evidence, {
        kind: 'datawindow',
        label: binding.targetName,
        detail: [binding.state, binding.dataObject ?? undefined].filter((part): part is string => Boolean(part)).join(' · '),
        ...(binding.targetUri ? { uri: binding.targetUri } : { uri: diagnostic.uri }),
        line: binding.line,
        character: diagnostic.character,
      });
    }
  }

  return evidence.slice(0, request.maxEvidence);
}

export function buildExplainDiagnosticReport(input: {
  request?: ApiExplainDiagnosticRequest;
  diagnostic: ExplainDiagnosticCandidateInput;
  objectContext?: ApiCurrentObjectContext;
  safeEditPlan?: ApiSafeEditPlan;
}): ApiExplainDiagnosticReport {
  const normalized = normalizeExplainDiagnosticRequest(input.request);
  const descriptor = describeExplainableDiagnostic({
    code: input.diagnostic.code,
    message: input.diagnostic.message,
    data: input.diagnostic.data,
  });
  const reasonCode = input.diagnostic.data?.reasonCodes?.[0] ?? input.objectContext?.evidence?.primaryReasonCode;

  const safeFix = buildSafeFix(descriptor, input.safeEditPlan);
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: true,
    diagnostic: {
      ...(input.diagnostic.code ? { code: input.diagnostic.code } : {}),
      message: input.diagnostic.message,
      severity: input.diagnostic.severity,
      uri: input.diagnostic.uri,
      line: input.diagnostic.line,
      character: input.diagnostic.character,
    },
    explanation: {
      summary: descriptor.summary,
      ...(reasonCode ? { reasonCode } : {}),
      area: descriptor.area,
      confidence: inferConfidence(input.diagnostic, descriptor),
      ...(descriptor.whyItMatters ? { whyItMatters: descriptor.whyItMatters } : {}),
    },
    evidence: buildEvidence(input.diagnostic, descriptor, input.objectContext, normalized),
    ...(safeFix ? { safeFix } : {}),
    recommendedActions: buildRecommendedActions(descriptor, input.safeEditPlan),
  };
}

export function buildExplainDiagnosticMarkdown(report: ApiExplainDiagnosticReport): string {
  const lines: string[] = ['# Explain Diagnostic', ''];

  if (!report.available) {
    lines.push(report.reason ?? 'Explain diagnostic no disponible.', '');
    if (report.recommendedActions.length > 0) {
      lines.push('## Recommended actions', '');
      for (const action of report.recommendedActions) {
        lines.push(`- ${action}`);
      }
    }
    return lines.join('\n');
  }

  lines.push(`**Message:** ${report.diagnostic?.message ?? 'unknown'}`);
  lines.push(`**Code:** ${report.diagnostic?.code ?? 'sin código'}`);
  lines.push(`**Severity:** ${report.diagnostic?.severity ?? 'unknown'}`);
  lines.push(`**Location:** ${report.diagnostic ? `${report.diagnostic.line + 1}:${report.diagnostic.character + 1}` : 'unknown'}`);
  lines.push('');
  lines.push('## Explanation', '');
  lines.push(report.explanation.summary, '');

  if (report.explanation.reasonCode) {
    lines.push(`- Reason code: ${report.explanation.reasonCode}`);
  }
  lines.push(`- Area: ${report.explanation.area}`);
  lines.push(`- Confidence: ${report.explanation.confidence}`);
  if (report.explanation.whyItMatters) {
    lines.push(`- Why it matters: ${report.explanation.whyItMatters}`);
  }

  if (report.evidence.length > 0) {
    lines.push('', '## Evidence', '');
    for (const entry of report.evidence) {
      const location = typeof entry.line === 'number' && typeof entry.character === 'number'
        ? ` (${entry.line + 1}:${entry.character + 1})`
        : '';
      lines.push(`- ${entry.kind}: ${entry.label}${location}`);
      if (entry.detail) {
        lines.push(`  ${entry.detail}`);
      }
    }
  }

  if (report.safeFix) {
    lines.push('', '## Safe fix', '');
    lines.push(`- Available: ${report.safeFix.available ? 'yes' : 'no'}`);
    if (report.safeFix.kind) {
      lines.push(`- Kind: ${report.safeFix.kind}`);
    }
    if (report.safeFix.confidence) {
      lines.push(`- Confidence: ${report.safeFix.confidence}`);
    }
    if (report.safeFix.planSummary) {
      lines.push(`- Plan: ${report.safeFix.planSummary}`);
    }
    for (const blockedReason of report.safeFix.blockedReasons ?? []) {
      lines.push(`- Blocked reason: ${blockedReason}`);
    }
  }

  if (report.recommendedActions.length > 0) {
    lines.push('', '## Recommended actions', '');
    for (const action of report.recommendedActions) {
      lines.push(`- ${action}`);
    }
  }

  return lines.join('\n');
}