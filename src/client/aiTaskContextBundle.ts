import {
  PUBLIC_API_VERSION,
  type ApiAiTaskContextBundle,
  type ApiAiTaskContextBundleRequest,
  type ApiAiTaskIntent,
  type ApiAiTaskContextBundleReasonCode,
  type ApiAiTaskContextBundleSectionKey,
  type ApiAiTaskContextExecutionPlanReceipt,
  type ApiAiTaskContextExecutionPlanSkipReceipt,
  type ApiCurrentObjectContext,
  type ApiExplainDiagnosticReport,
  type ApiExplainSystemSymbolReport,
  type ApiObjectCheckReport,
  type ApiPowerBuilderDependencyGraph,
  type ApiSafeEditPlan,
  type ApiWorkspaceCheckReport,
} from '../shared/publicApi';

type AiTaskContextSectionKey = ApiAiTaskContextBundleSectionKey;

type AiTaskContextPaginationState = {
  diagnosticExplanations: {
    requested: number;
    available: number;
  };
  systemSymbolExplanations: {
    requested: number;
    available: number;
  };
};

type AiTaskContextExecutionSkipReason = ApiAiTaskContextExecutionPlanSkipReceipt['reason'];
type AiTaskContextExecutionSectionStatus = 'scheduled' | 'skipped-before-execution' | 'not-requested';

export interface AiTaskContextExecutionPlan {
  estimatedRequestedTokens: number;
  estimatedScheduledTokens: number;
  sections: Array<{
    key: AiTaskContextSectionKey;
    status: AiTaskContextExecutionSectionStatus;
    reason: 'requested' | 'disabled-by-request' | AiTaskContextExecutionSkipReason;
    estimatedTokens: number;
  }>;
  receipt: ApiAiTaskContextExecutionPlanReceipt;
}

interface NormalizedAiTaskContextBundleRequest {
  intent: ApiAiTaskIntent;
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;
  includeWorkspaceCheck: boolean;
  includeObjectCheck: boolean;
  includeSafeEditPlan: boolean;
  includeDependencyGraph: boolean;
  includeDiagnosticsExplanation: boolean;
  includeSystemSymbolExplanations: boolean;
  maxTokensHint: number;
  maxDiagnostics: number;
  maxSymbols: number;
  maxFiles: number;
}

export interface AiTaskContextBundleBuildInput {
  request?: ApiAiTaskContextBundleRequest;
  executionPlan?: ApiAiTaskContextExecutionPlanReceipt;
  workspaceCheck?: ApiWorkspaceCheckReport;
  objectCheck?: ApiObjectCheckReport;
  currentObjectContext?: ApiCurrentObjectContext;
  safeEditPlan?: ApiSafeEditPlan;
  dependencyGraph?: ApiPowerBuilderDependencyGraph;
  diagnosticExplanations?: ApiExplainDiagnosticReport[];
  systemSymbolExplanations?: ApiExplainSystemSymbolReport[];
}

const DEFAULT_MAX_TOKENS = 2400;
const DEFAULT_MAX_DIAGNOSTICS = 4;
const DEFAULT_MAX_SYMBOLS = 4;
const DEFAULT_MAX_FILES = 4;
const EXECUTION_PLAN_META_RESERVE = 700;

const DEFAULTS_BY_INTENT: Record<ApiAiTaskIntent, Omit<NormalizedAiTaskContextBundleRequest, 'intent'>> = {
  'bug-fix': {
    includeWorkspaceCheck: false,
    includeObjectCheck: true,
    includeSafeEditPlan: true,
    includeDependencyGraph: true,
    includeDiagnosticsExplanation: true,
    includeSystemSymbolExplanations: false,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  'refactor': {
    includeWorkspaceCheck: false,
    includeObjectCheck: true,
    includeSafeEditPlan: true,
    includeDependencyGraph: true,
    includeDiagnosticsExplanation: false,
    includeSystemSymbolExplanations: false,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  'add-feature': {
    includeWorkspaceCheck: true,
    includeObjectCheck: true,
    includeSafeEditPlan: true,
    includeDependencyGraph: true,
    includeDiagnosticsExplanation: false,
    includeSystemSymbolExplanations: true,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  diagnose: {
    includeWorkspaceCheck: true,
    includeObjectCheck: true,
    includeSafeEditPlan: true,
    includeDependencyGraph: true,
    includeDiagnosticsExplanation: true,
    includeSystemSymbolExplanations: true,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  'catalog-work': {
    includeWorkspaceCheck: false,
    includeObjectCheck: false,
    includeSafeEditPlan: false,
    includeDependencyGraph: false,
    includeDiagnosticsExplanation: false,
    includeSystemSymbolExplanations: true,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  'documentation-update': {
    includeWorkspaceCheck: true,
    includeObjectCheck: true,
    includeSafeEditPlan: false,
    includeDependencyGraph: false,
    includeDiagnosticsExplanation: false,
    includeSystemSymbolExplanations: true,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
  unknown: {
    includeWorkspaceCheck: false,
    includeObjectCheck: true,
    includeSafeEditPlan: true,
    includeDependencyGraph: false,
    includeDiagnosticsExplanation: false,
    includeSystemSymbolExplanations: false,
    maxTokensHint: DEFAULT_MAX_TOKENS,
    maxDiagnostics: DEFAULT_MAX_DIAGNOSTICS,
    maxSymbols: DEFAULT_MAX_SYMBOLS,
    maxFiles: DEFAULT_MAX_FILES,
  },
};

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

export function normalizeAiTaskContextBundleRequest(
  request: ApiAiTaskContextBundleRequest = {},
): NormalizedAiTaskContextBundleRequest {
  const intent = request.intent ?? 'unknown';
  const defaults = DEFAULTS_BY_INTENT[intent];

  return {
    intent,
    ...(request.uri ? { uri: request.uri } : {}),
    ...(request.objectName?.trim() ? { objectName: request.objectName.trim() } : {}),
    ...(typeof request.line === 'number' ? { line: Math.max(0, Math.trunc(request.line)) } : {}),
    ...(typeof request.character === 'number' ? { character: Math.max(0, Math.trunc(request.character)) } : {}),
    includeWorkspaceCheck: request.includeWorkspaceCheck ?? defaults.includeWorkspaceCheck,
    includeObjectCheck: request.includeObjectCheck ?? defaults.includeObjectCheck,
    includeSafeEditPlan: request.includeSafeEditPlan ?? defaults.includeSafeEditPlan,
    includeDependencyGraph: request.includeDependencyGraph ?? defaults.includeDependencyGraph,
    includeDiagnosticsExplanation: request.includeDiagnosticsExplanation ?? defaults.includeDiagnosticsExplanation,
    includeSystemSymbolExplanations: request.includeSystemSymbolExplanations ?? defaults.includeSystemSymbolExplanations,
    maxTokensHint: clampNumber(request.maxTokensHint, 32, 12000, defaults.maxTokensHint),
    maxDiagnostics: clampNumber(request.maxDiagnostics, 0, 32, defaults.maxDiagnostics),
    maxSymbols: clampNumber(request.maxSymbols, 0, 32, defaults.maxSymbols),
    maxFiles: clampNumber(request.maxFiles, 1, 32, defaults.maxFiles),
  };
}

function estimateExecutionSectionTokens(
  normalizedRequest: NormalizedAiTaskContextBundleRequest,
  key: AiTaskContextSectionKey,
): number {
  switch (key) {
    case 'currentObjectContext':
      return 180 + Math.min(96, normalizedRequest.maxFiles * 12);
    case 'objectCheck':
      return 220 + (normalizedRequest.maxDiagnostics * 18);
    case 'safeEditPlan':
      return 260 + (normalizedRequest.maxFiles * 24);
    case 'dependencyGraph':
      return 300 + (normalizedRequest.maxFiles * 32);
    case 'workspaceCheck':
      return 360 + (normalizedRequest.maxFiles * 36) + (normalizedRequest.maxDiagnostics * 24);
    case 'diagnosticExplanations':
      return normalizedRequest.maxDiagnostics > 0
        ? 120 + (normalizedRequest.maxDiagnostics * 90)
        : 0;
    case 'systemSymbolExplanations':
      return normalizedRequest.maxSymbols > 0
        ? 140 + (normalizedRequest.maxSymbols * 100)
        : 0;
  }
}

function isExecutionSectionEnabledByRequest(
  normalizedRequest: NormalizedAiTaskContextBundleRequest,
  key: AiTaskContextSectionKey,
): boolean {
  switch (key) {
    case 'workspaceCheck':
      return normalizedRequest.includeWorkspaceCheck;
    case 'objectCheck':
      return normalizedRequest.includeObjectCheck;
    case 'currentObjectContext':
      return true;
    case 'safeEditPlan':
      return normalizedRequest.includeSafeEditPlan;
    case 'dependencyGraph':
      return normalizedRequest.includeDependencyGraph;
    case 'diagnosticExplanations':
      return normalizedRequest.includeDiagnosticsExplanation && normalizedRequest.maxDiagnostics > 0;
    case 'systemSymbolExplanations':
      return normalizedRequest.includeSystemSymbolExplanations && normalizedRequest.maxSymbols > 0;
  }
}

function resolveExecutionSectionSkipReason(
  normalizedRequest: NormalizedAiTaskContextBundleRequest,
  key: AiTaskContextSectionKey,
): AiTaskContextExecutionSkipReason | undefined {
  switch (key) {
    case 'currentObjectContext':
    case 'safeEditPlan':
    case 'diagnosticExplanations':
      return normalizedRequest.uri ? undefined : 'missing-uri';
    case 'objectCheck':
    case 'dependencyGraph':
    case 'systemSymbolExplanations':
      return normalizedRequest.uri || normalizedRequest.objectName ? undefined : 'missing-focus';
    case 'workspaceCheck':
      return undefined;
  }
}

function isExecutionAnchorSection(key: AiTaskContextSectionKey): boolean {
  return key === 'currentObjectContext' || key === 'objectCheck';
}

export function buildAiTaskContextExecutionPlan(
  request: ApiAiTaskContextBundleRequest = {},
): AiTaskContextExecutionPlan {
  const normalizedRequest = normalizeAiTaskContextBundleRequest(request);
  const sections: AiTaskContextExecutionPlan['sections'] = [];
  let estimatedRequestedTokens = 0;
  let estimatedScheduledTokens = 0;
  const optionalKeys = ([
    'safeEditPlan',
    'diagnosticExplanations',
    'dependencyGraph',
    'systemSymbolExplanations',
    'workspaceCheck',
  ] as AiTaskContextSectionKey[])
    .sort((left, right) => getDropPriority(normalizedRequest.intent, left) - getDropPriority(normalizedRequest.intent, right));
  const orderedKeys: AiTaskContextSectionKey[] = ['currentObjectContext', 'objectCheck', ...optionalKeys];
  const preflightBudget = Math.max(0, normalizedRequest.maxTokensHint - EXECUTION_PLAN_META_RESERVE);

  for (const key of orderedKeys) {
    if (!isExecutionSectionEnabledByRequest(normalizedRequest, key)) {
      sections.push({
        key,
        status: 'not-requested',
        reason: 'disabled-by-request',
        estimatedTokens: 0,
      });
      continue;
    }

    const estimatedTokens = estimateExecutionSectionTokens(normalizedRequest, key);
    estimatedRequestedTokens += estimatedTokens;

    const missingReason = resolveExecutionSectionSkipReason(normalizedRequest, key);
    if (missingReason) {
      sections.push({
        key,
        status: 'skipped-before-execution',
        reason: missingReason,
        estimatedTokens,
      });
      continue;
    }

    if (isExecutionAnchorSection(key) || estimatedScheduledTokens + estimatedTokens <= preflightBudget) {
      estimatedScheduledTokens += estimatedTokens;
      sections.push({
        key,
        status: 'scheduled',
        reason: 'requested',
        estimatedTokens,
      });
      continue;
    }

    sections.push({
      key,
      status: 'skipped-before-execution',
      reason: 'budget-preflight',
      estimatedTokens,
    });
  }

  const skippedSections: ApiAiTaskContextExecutionPlanSkipReceipt[] = [];
  for (const section of sections) {
    if (section.status !== 'skipped-before-execution') {
      continue;
    }

    skippedSections.push({
      key: section.key,
      reason: section.reason as AiTaskContextExecutionSkipReason,
      estimatedTokens: section.estimatedTokens,
    });
  }

  const receipt: ApiAiTaskContextExecutionPlanReceipt = {
    maxTokensHint: normalizedRequest.maxTokensHint,
    estimatedRequestedTokens,
    estimatedScheduledTokens,
    skippedSections,
  };

  return {
    estimatedRequestedTokens,
    estimatedScheduledTokens,
    sections,
    receipt,
  };
}

export function shouldExecuteAiTaskContextSection(
  plan: AiTaskContextExecutionPlan,
  key: AiTaskContextSectionKey,
): boolean {
  return plan.sections.some((section) => section.key === key && section.status === 'scheduled');
}

function estimateTokens(value: unknown): number {
  return Math.max(1, Math.ceil(JSON.stringify(value).length / 4));
}

function addOmission(
  omissions: string[],
  reasonCodes: Set<ApiAiTaskContextBundleReasonCode>,
  message: string,
  reasonCode?: ApiAiTaskContextBundleReasonCode,
): void {
  omissions.push(message);
  if (reasonCode) {
    reasonCodes.add(reasonCode);
  }
}

function resolveFocus(input: AiTaskContextBundleBuildInput): ApiAiTaskContextBundle['focus'] {
  const request = input.request;
  const objectCheckSource = input.objectCheck?.source;
  const objectName = request?.objectName
    ?? input.objectCheck?.summary.objectName
    ?? input.currentObjectContext?.objectInfo?.globalType;

  return {
    ...(request?.uri ? { uri: request.uri } : objectCheckSource?.uri ? { uri: objectCheckSource.uri } : {}),
    ...(objectName ? { objectName } : {}),
    ...(typeof request?.line === 'number' ? { line: request.line } : typeof objectCheckSource?.line === 'number' ? { line: objectCheckSource.line } : {}),
    ...(typeof request?.character === 'number' ? { character: request.character } : typeof objectCheckSource?.character === 'number' ? { character: objectCheckSource.character } : {}),
  };
}

function hasExplicitFocus(focus: ApiAiTaskContextBundle['focus']): boolean {
  return Boolean(focus.uri || focus.objectName || typeof focus.line === 'number' || typeof focus.character === 'number');
}

function buildBaseRules(intent: ApiAiTaskIntent): string[] {
  const rules = [
    'Read-only: no modificar archivos, ORCA, build ni estado del workspace a partir de este bundle.',
    'Preferir reports compactos y evidencia publicada por el runtime antes que reabrir contexto masivo.',
    'Toda omision por budget o ausencia de foco debe considerarse constraint explicita, no contexto implicito.',
  ];

  if (intent === 'bug-fix' || intent === 'refactor') {
    rules.push('No proponer cambios sin revisar `safeEditPlan`, dependencias inmediatas y diagnostics relacionados.');
  }

  if (intent === 'catalog-work') {
    rules.push('No cargar ni duplicar `generated/manual/localization` completos; usar solo explainability puntual del catalogo.');
  }

  return rules;
}

function buildRecommendedWorkflow(
  intent: ApiAiTaskIntent,
  context: ApiAiTaskContextBundle['context'],
): string[] {
  const steps: string[] = [];

  if (context.objectCheck) {
    steps.push('Leer primero `objectCheck.summary/findings` para validar foco, readiness y riesgos locales.');
  }
  if (context.currentObjectContext) {
    steps.push('Usar `currentObjectContext` para confirmar members visibles, ancestros y diagnostics realmente activos.');
  }
  if (context.diagnosticExplanations?.length) {
    steps.push('Priorizar `diagnosticExplanations` para entender blockers antes de tocar codigo.');
  }
  if (context.systemSymbolExplanations?.length) {
    steps.push('Usar `systemSymbolExplanations` para fijar semantica de lenguaje, signatures o enums sin releer catalogos completos.');
  }
  if (context.dependencyGraph) {
    steps.push('Revisar `dependencyGraph` antes de widen changes o renames.');
  }
  if (context.safeEditPlan) {
    steps.push('Tratar `safeEditPlan` como gate antes de cualquier propuesta de cambio.');
  }
  if (context.workspaceCheck && (intent === 'diagnose' || intent === 'documentation-update')) {
    steps.push('Cerrar con `workspaceCheck` para detectar constraints globales o drift documental.');
  }

  if (steps.length === 0) {
    steps.push('Resolver un foco explicito antes de preparar cambios o recomendaciones.');
  }

  return steps;
}

function buildValidationCommands(
  intent: ApiAiTaskIntent,
  safeEditPlan: ApiSafeEditPlan | undefined,
): string[] {
  const commands = new Set<string>(['npm run build:test']);

  if (intent === 'catalog-work') {
    commands.add('npm run test:unit -- --grep "explainSystemSymbol|publicApi"');
  }

  if (intent === 'bug-fix' || intent === 'refactor' || intent === 'diagnose') {
    commands.add('npm run test:unit -- --grep "objectCheck|publicApi"');
  }

  for (const test of safeEditPlan?.recommendedTests ?? []) {
    commands.add(test);
  }

  return [...commands];
}

function buildDocsToReview(
  intent: ApiAiTaskIntent,
  safeEditPlan: ApiSafeEditPlan | undefined,
): string[] {
  const docs = new Set<string>(safeEditPlan?.docsToReview ?? []);
  docs.add('docs/current-focus.md');

  if (intent === 'catalog-work') {
    docs.add('docs/architecture.md');
    docs.add('docs/testing.md');
  }

  if (intent === 'documentation-update') {
    docs.add('docs/developer-workflows.md');
    docs.add('docs/ai-orchestrator.md');
  }

  return [...docs];
}

function buildSummary(
  intent: ApiAiTaskIntent,
  focus: ApiAiTaskContextBundle['focus'],
  context: ApiAiTaskContextBundle['context'],
  omissions: readonly string[],
): string {
  const focusLabel = focus.objectName ?? focus.uri ?? 'foco no resuelto';
  const includedSections = Object.values(context).filter((value) => value !== undefined).length;
  const omissionSuffix = omissions.length > 0 ? ` Se registran ${omissions.length} omisiones.` : '';
  return `Bundle read-only para ${intent} sobre ${focusLabel} con ${includedSections} secciones compactas.${omissionSuffix}`;
}

function buildMinimalSummary(intent: ApiAiTaskIntent, focus: ApiAiTaskContextBundle['focus']): string {
  return `Bundle minimo para ${intent} sobre ${focus.objectName ?? focus.uri ?? 'foco parcial'}.`;
}

function sectionLabel(key: AiTaskContextSectionKey): string {
  switch (key) {
    case 'workspaceCheck':
      return 'workspaceCheck';
    case 'objectCheck':
      return 'objectCheck';
    case 'currentObjectContext':
      return 'currentObjectContext';
    case 'safeEditPlan':
      return 'safeEditPlan';
    case 'dependencyGraph':
      return 'dependencyGraph';
    case 'diagnosticExplanations':
      return 'diagnosticExplanations';
    case 'systemSymbolExplanations':
      return 'systemSymbolExplanations';
  }
}

function applyExecutionPlanOmissions(
  executionPlan: ApiAiTaskContextExecutionPlanReceipt | undefined,
  omissions: string[],
  reasonCodes: Set<ApiAiTaskContextBundleReasonCode>,
): void {
  for (const skippedSection of executionPlan?.skippedSections ?? []) {
    addOmission(
      omissions,
      reasonCodes,
      `Pre-ejecucion omitio ${sectionLabel(skippedSection.key)} (${skippedSection.reason}).`,
      skippedSection.reason === 'budget-preflight' ? 'token-budget-preflight' : undefined,
    );
  }
}

function trimDiagnosticsExplanations(
  items: ApiExplainDiagnosticReport[] | undefined,
  maxDiagnostics: number,
): ApiExplainDiagnosticReport[] | undefined {
  if (!items) {
    return undefined;
  }

  return items.slice(0, maxDiagnostics);
}

function trimSystemSymbolExplanations(
  items: ApiExplainSystemSymbolReport[] | undefined,
  maxSymbols: number,
): ApiExplainSystemSymbolReport[] | undefined {
  if (!items) {
    return undefined;
  }

  return items.slice(0, maxSymbols);
}

function buildContext(
  normalizedRequest: NormalizedAiTaskContextBundleRequest,
  input: AiTaskContextBundleBuildInput,
  omissions: string[],
  reasonCodes: Set<ApiAiTaskContextBundleReasonCode>,
): { context: ApiAiTaskContextBundle['context']; pagination: AiTaskContextPaginationState } {
  const diagnosticExplanations = trimDiagnosticsExplanations(input.diagnosticExplanations, normalizedRequest.maxDiagnostics);
  const systemSymbolExplanations = trimSystemSymbolExplanations(input.systemSymbolExplanations, normalizedRequest.maxSymbols);
  const pagination: AiTaskContextPaginationState = {
    diagnosticExplanations: {
      requested: normalizedRequest.includeDiagnosticsExplanation ? normalizedRequest.maxDiagnostics : 0,
      available: input.diagnosticExplanations?.length ?? 0,
    },
    systemSymbolExplanations: {
      requested: normalizedRequest.includeSystemSymbolExplanations ? normalizedRequest.maxSymbols : 0,
      available: input.systemSymbolExplanations?.length ?? 0,
    },
  };

  if (normalizedRequest.includeDiagnosticsExplanation && (input.diagnosticExplanations?.length ?? 0) > (diagnosticExplanations?.length ?? 0)) {
    addOmission(
      omissions,
      reasonCodes,
      `diagnosticExplanations truncadas a ${normalizedRequest.maxDiagnostics}.`,
      'diagnostics-limit',
    );
  }

  if (normalizedRequest.includeSystemSymbolExplanations && (input.systemSymbolExplanations?.length ?? 0) > (systemSymbolExplanations?.length ?? 0)) {
    addOmission(
      omissions,
      reasonCodes,
      `systemSymbolExplanations truncadas a ${normalizedRequest.maxSymbols}.`,
      'system-symbol-limit',
    );
  }

  const context: ApiAiTaskContextBundle['context'] = {
    ...(normalizedRequest.includeWorkspaceCheck && input.workspaceCheck ? { workspaceCheck: input.workspaceCheck } : {}),
    ...(normalizedRequest.includeObjectCheck && input.objectCheck ? { objectCheck: input.objectCheck } : {}),
    ...(input.currentObjectContext ? { currentObjectContext: input.currentObjectContext } : {}),
    ...(normalizedRequest.includeSafeEditPlan && input.safeEditPlan ? { safeEditPlan: input.safeEditPlan } : {}),
    ...(normalizedRequest.includeDependencyGraph && input.dependencyGraph ? { dependencyGraph: input.dependencyGraph } : {}),
    ...(normalizedRequest.includeDiagnosticsExplanation && diagnosticExplanations?.length ? { diagnosticExplanations } : {}),
    ...(normalizedRequest.includeSystemSymbolExplanations && systemSymbolExplanations?.length ? { systemSymbolExplanations } : {}),
  };

  if (normalizedRequest.includeWorkspaceCheck && !input.workspaceCheck) {
    addOmission(omissions, reasonCodes, 'workspaceCheck no disponible.');
  }
  if (normalizedRequest.includeObjectCheck && !input.objectCheck) {
    addOmission(omissions, reasonCodes, 'objectCheck no disponible.');
  }
  if (normalizedRequest.includeSafeEditPlan && !input.safeEditPlan) {
    addOmission(omissions, reasonCodes, 'safeEditPlan no disponible.');
  }
  if (normalizedRequest.includeDependencyGraph && !input.dependencyGraph) {
    addOmission(omissions, reasonCodes, 'dependencyGraph no disponible.');
  }
  if (normalizedRequest.includeDiagnosticsExplanation && !diagnosticExplanations?.length) {
    addOmission(omissions, reasonCodes, 'Sin diagnosticExplanations en el foco.');
  }
  if (normalizedRequest.includeSystemSymbolExplanations && !systemSymbolExplanations?.length) {
    addOmission(omissions, reasonCodes, 'Sin systemSymbolExplanations en el foco.');
  }

  return { context, pagination };
}

function getDropPriority(intent: ApiAiTaskIntent, key: AiTaskContextSectionKey): number {
  const priorities: Record<ApiAiTaskIntent, Record<AiTaskContextSectionKey, number>> = {
    'bug-fix': {
      workspaceCheck: 80,
      objectCheck: 10,
      currentObjectContext: 20,
      safeEditPlan: 5,
      dependencyGraph: 40,
      diagnosticExplanations: 15,
      systemSymbolExplanations: 60,
    },
    refactor: {
      workspaceCheck: 80,
      objectCheck: 10,
      currentObjectContext: 15,
      safeEditPlan: 5,
      dependencyGraph: 20,
      diagnosticExplanations: 70,
      systemSymbolExplanations: 60,
    },
    'add-feature': {
      workspaceCheck: 50,
      objectCheck: 10,
      currentObjectContext: 20,
      safeEditPlan: 15,
      dependencyGraph: 25,
      diagnosticExplanations: 70,
      systemSymbolExplanations: 30,
    },
    diagnose: {
      workspaceCheck: 40,
      objectCheck: 10,
      currentObjectContext: 20,
      safeEditPlan: 25,
      dependencyGraph: 30,
      diagnosticExplanations: 5,
      systemSymbolExplanations: 50,
    },
    'catalog-work': {
      workspaceCheck: 90,
      objectCheck: 80,
      currentObjectContext: 70,
      safeEditPlan: 100,
      dependencyGraph: 60,
      diagnosticExplanations: 50,
      systemSymbolExplanations: 5,
    },
    'documentation-update': {
      workspaceCheck: 30,
      objectCheck: 20,
      currentObjectContext: 40,
      safeEditPlan: 90,
      dependencyGraph: 80,
      diagnosticExplanations: 70,
      systemSymbolExplanations: 10,
    },
    unknown: {
      workspaceCheck: 70,
      objectCheck: 10,
      currentObjectContext: 20,
      safeEditPlan: 15,
      dependencyGraph: 50,
      diagnosticExplanations: 60,
      systemSymbolExplanations: 40,
    },
  };

  return priorities[intent][key];
}

function pruneContextToBudget(input: {
  normalizedRequest: NormalizedAiTaskContextBundleRequest;
  focus: ApiAiTaskContextBundle['focus'];
  executionPlan?: ApiAiTaskContextExecutionPlanReceipt;
  rules: string[];
  context: ApiAiTaskContextBundle['context'];
  omissions: string[];
  reasonCodes: Set<ApiAiTaskContextBundleReasonCode>;
  docsToReview: string[];
  validationCommands: string[];
  recommendedWorkflow: string[];
}): { context: ApiAiTaskContextBundle['context']; estimatedTokens: number; truncated: boolean } {
  const { normalizedRequest, focus, rules, omissions, reasonCodes, docsToReview, validationCommands, recommendedWorkflow } = input;
  const context: ApiAiTaskContextBundle['context'] = { ...input.context };

  const estimateCurrent = (): number => estimateTokens({
    focus,
    ...(input.executionPlan ? { executionPlan: input.executionPlan } : {}),
    rules,
    context,
    omissions,
    docsToReview,
    validationCommands,
    recommendedWorkflow,
  });

  let estimatedTokens = estimateCurrent();
  let truncated = false;

  const removableKeys = (Object.keys(context) as AiTaskContextSectionKey[])
    .filter((key) => context[key] !== undefined)
    .sort((left, right) => getDropPriority(normalizedRequest.intent, right) - getDropPriority(normalizedRequest.intent, left));

  for (const key of removableKeys) {
    if (estimatedTokens <= normalizedRequest.maxTokensHint) {
      break;
    }

    delete context[key];
    addOmission(omissions, reasonCodes, `Budget omitio ${sectionLabel(key)}.`, 'token-budget-context');
    estimatedTokens = estimateCurrent();
    truncated = true;
  }

  return { context, estimatedTokens, truncated };
}

function compactOmissions(omissions: string[]): string[] {
  const budgetSections: string[] = [];
  const preExecutionBudgetSections: string[] = [];
  const compacted: string[] = [];

  for (const omission of omissions) {
    const budgetMatch = /^Budget omitio (.+)\.$/u.exec(omission);
    if (budgetMatch) {
      budgetSections.push(budgetMatch[1]);
      continue;
    }

    const preExecutionBudgetMatch = /^Pre-ejecucion omitio (.+) \(budget-preflight\)\.$/u.exec(omission);
    if (preExecutionBudgetMatch) {
      preExecutionBudgetSections.push(preExecutionBudgetMatch[1]);
      continue;
    }

    compacted.push(omission);
  }

  if (budgetSections.length > 0) {
    compacted.push(`Budget omitio: ${budgetSections.join(', ')}.`);
  }

  if (preExecutionBudgetSections.length > 0) {
    compacted.push(`Pre-ejecucion omitio por budget: ${preExecutionBudgetSections.join(', ')}.`);
  }

  return compacted;
}

function minimizeBundleMeta(input: {
  normalizedRequest: NormalizedAiTaskContextBundleRequest;
  focus: ApiAiTaskContextBundle['focus'];
  executionPlan?: ApiAiTaskContextExecutionPlanReceipt;
  context: ApiAiTaskContextBundle['context'];
  omissions: string[];
  reasonCodes: Set<ApiAiTaskContextBundleReasonCode>;
  rules: string[];
  validationCommands: string[];
  docsToReview: string[];
  recommendedWorkflow: string[];
}): {
  omissions: string[];
  rules: string[];
  validationCommands: string[];
  docsToReview: string[];
  recommendedWorkflow: string[];
  estimatedTokens: number;
} {
  const omissions = compactOmissions([...input.omissions]);
  const rules = [...input.rules];
  const validationCommands = [...input.validationCommands];
  const docsToReview = [...input.docsToReview];
  const recommendedWorkflow = [...input.recommendedWorkflow];

  const estimateCurrent = (minimalSummary = false): number => estimateTokens({
    focus: input.focus,
    ...(input.executionPlan ? { executionPlan: input.executionPlan } : {}),
    summary: minimalSummary
      ? buildMinimalSummary(input.normalizedRequest.intent, input.focus)
      : buildSummary(input.normalizedRequest.intent, input.focus, input.context, omissions),
    rules,
    context: input.context,
    omissions,
    docsToReview,
    validationCommands,
    recommendedWorkflow,
  });

  let estimatedTokens = estimateCurrent();
  if (estimatedTokens <= input.normalizedRequest.maxTokensHint) {
    return {
      omissions,
      rules,
      validationCommands,
      docsToReview,
      recommendedWorkflow,
      estimatedTokens,
    };
  }

  if (!omissions.includes('Bundle minimizado por budget extremo.')) {
    omissions.push('Bundle minimizado por budget extremo.');
    input.reasonCodes.add('token-budget-meta');
  }

  while (estimatedTokens > input.normalizedRequest.maxTokensHint && docsToReview.length > 0) {
    docsToReview.pop();
    estimatedTokens = estimateCurrent();
  }
  while (estimatedTokens > input.normalizedRequest.maxTokensHint && validationCommands.length > 1) {
    validationCommands.pop();
    estimatedTokens = estimateCurrent();
  }
  while (estimatedTokens > input.normalizedRequest.maxTokensHint && recommendedWorkflow.length > 1) {
    recommendedWorkflow.pop();
    estimatedTokens = estimateCurrent();
  }
  while (estimatedTokens > input.normalizedRequest.maxTokensHint && rules.length > 1) {
    rules.pop();
    estimatedTokens = estimateCurrent();
  }
  while (estimatedTokens > input.normalizedRequest.maxTokensHint && omissions.length > 2) {
    omissions.splice(0, omissions.length - 2);
    estimatedTokens = estimateCurrent(true);
  }

  if (estimatedTokens > input.normalizedRequest.maxTokensHint) {
    rules.length = Math.min(rules.length, 1);
    recommendedWorkflow.length = 0;
    validationCommands.length = Math.min(validationCommands.length, 1);
    docsToReview.length = 0;
    estimatedTokens = estimateCurrent(true);
  }

  if (estimatedTokens > input.normalizedRequest.maxTokensHint) {
    omissions.length = 0;
    omissions.push('Budget extremo: bundle minimo.');
    input.reasonCodes.add('token-budget-minimal');
    estimatedTokens = estimateCurrent(true);
  }

  return {
    omissions,
    rules,
    validationCommands,
    docsToReview,
    recommendedWorkflow,
    estimatedTokens,
  };
}

export function buildUnavailableAiTaskContextBundle(
  reason: string,
  request: ApiAiTaskContextBundleRequest = {},
): ApiAiTaskContextBundle {
  const normalizedRequest = normalizeAiTaskContextBundleRequest(request);
  const reasonCodes: ApiAiTaskContextBundleReasonCode[] = ['missing-focus'];
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: false,
    reason,
    intent: normalizedRequest.intent,
    tokenBudget: {
      maxTokensHint: normalizedRequest.maxTokensHint,
      truncated: false,
    },
    reasonCodes,
    pagination: {
      diagnosticExplanations: { requested: 0, available: 0, included: 0, truncated: false },
      systemSymbolExplanations: { requested: 0, available: 0, included: 0, truncated: false },
    },
    focus: resolveFocus({ request }),
    summary: 'No se pudo preparar un bundle de contexto IA defendible.',
    rules: buildBaseRules(normalizedRequest.intent),
    context: {},
    recommendedWorkflow: ['Resolver primero un foco explicito antes de solicitar un bundle IA.'],
    validationCommands: ['npm run build:test'],
    docsToReview: ['docs/current-focus.md'],
    omissions: [reason],
  };
}

export function buildAiTaskContextBundle(
  input: AiTaskContextBundleBuildInput,
): ApiAiTaskContextBundle {
  const normalizedRequest = normalizeAiTaskContextBundleRequest(input.request);
  const focus = resolveFocus(input);

  if (!hasExplicitFocus(focus) && !input.objectCheck && !input.currentObjectContext) {
    return buildUnavailableAiTaskContextBundle(
      'No se pudo resolver un foco explicito para preparar el bundle IA.',
      input.request,
    );
  }

  const omissions: string[] = [];
  const reasonCodes = new Set<ApiAiTaskContextBundleReasonCode>();
  applyExecutionPlanOmissions(input.executionPlan, omissions, reasonCodes);
  const builtContext = buildContext(normalizedRequest, input, omissions, reasonCodes);
  const context = builtContext.context;
  const rules = buildBaseRules(normalizedRequest.intent);
  const validationCommands = buildValidationCommands(normalizedRequest.intent, input.safeEditPlan);
  const docsToReview = buildDocsToReview(normalizedRequest.intent, input.safeEditPlan);
  const recommendedWorkflow = buildRecommendedWorkflow(normalizedRequest.intent, context);
  const pruned = pruneContextToBudget({
    normalizedRequest,
    focus,
    executionPlan: input.executionPlan,
    rules,
    context,
    omissions,
    reasonCodes,
    docsToReview,
    validationCommands,
    recommendedWorkflow,
  });
  const minimized = minimizeBundleMeta({
    normalizedRequest,
    focus,
    executionPlan: input.executionPlan,
    context: pruned.context,
    omissions,
    reasonCodes,
    rules,
    validationCommands,
    docsToReview,
    recommendedWorkflow,
  });
  let finalContext = pruned.context;
  let finalRules = minimized.rules;
  let finalRecommendedWorkflow = minimized.recommendedWorkflow;
  let finalValidationCommands = minimized.validationCommands;
  let finalDocsToReview = minimized.docsToReview;
  let finalOmissions = minimized.omissions;
  let finalSummary = minimized.estimatedTokens <= normalizedRequest.maxTokensHint
    ? buildSummary(normalizedRequest.intent, focus, finalContext, finalOmissions)
    : buildMinimalSummary(normalizedRequest.intent, focus);
  let finalEstimatedTokens = minimized.estimatedTokens;

  if (finalEstimatedTokens > normalizedRequest.maxTokensHint) {
    finalContext = {};
    finalRules = [];
    finalRecommendedWorkflow = [];
    finalValidationCommands = [];
    finalDocsToReview = [];
    finalOmissions = ['Budget extremo: bundle minimo.'];
    reasonCodes.add('token-budget-minimal');
    finalSummary = buildMinimalSummary(normalizedRequest.intent, focus);
    finalEstimatedTokens = estimateTokens({
      focus,
      ...(input.executionPlan ? { executionPlan: input.executionPlan } : {}),
      summary: finalSummary,
      context: finalContext,
      omissions: finalOmissions,
      docsToReview: finalDocsToReview,
      validationCommands: finalValidationCommands,
      recommendedWorkflow: finalRecommendedWorkflow,
    });
  }

  const diagnosticIncluded = finalContext.diagnosticExplanations?.length ?? 0;
  const systemSymbolIncluded = finalContext.systemSymbolExplanations?.length ?? 0;
  const pagination: ApiAiTaskContextBundle['pagination'] = {
    diagnosticExplanations: {
      requested: builtContext.pagination.diagnosticExplanations.requested,
      available: builtContext.pagination.diagnosticExplanations.available,
      included: diagnosticIncluded,
      truncated: builtContext.pagination.diagnosticExplanations.available > diagnosticIncluded,
      ...(builtContext.pagination.diagnosticExplanations.available > diagnosticIncluded
        ? {
            reasonCode: diagnosticIncluded < Math.min(builtContext.pagination.diagnosticExplanations.available, builtContext.pagination.diagnosticExplanations.requested)
              ? 'token-budget-context'
              : 'diagnostics-limit',
          }
        : {}),
    },
    systemSymbolExplanations: {
      requested: builtContext.pagination.systemSymbolExplanations.requested,
      available: builtContext.pagination.systemSymbolExplanations.available,
      included: systemSymbolIncluded,
      truncated: builtContext.pagination.systemSymbolExplanations.available > systemSymbolIncluded,
      ...(builtContext.pagination.systemSymbolExplanations.available > systemSymbolIncluded
        ? {
            reasonCode: systemSymbolIncluded < Math.min(builtContext.pagination.systemSymbolExplanations.available, builtContext.pagination.systemSymbolExplanations.requested)
              ? 'token-budget-context'
              : 'system-symbol-limit',
          }
        : {}),
    },
  };

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: true,
    intent: normalizedRequest.intent,
    tokenBudget: {
      maxTokensHint: normalizedRequest.maxTokensHint,
      estimatedTokens: finalEstimatedTokens,
      truncated: pruned.truncated || finalOmissions.some((entry) => entry.toLowerCase().includes('budget')),
    },
    ...(input.executionPlan ? { executionPlan: input.executionPlan } : {}),
    reasonCodes: [...reasonCodes],
    pagination,
    focus,
    summary: finalSummary,
    rules: finalRules,
    context: finalContext,
    recommendedWorkflow: finalRecommendedWorkflow,
    validationCommands: finalValidationCommands,
    docsToReview: finalDocsToReview,
    omissions: finalOmissions,
  };
}