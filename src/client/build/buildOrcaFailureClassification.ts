import type { ApiRuntimeJournalSnapshot, ApiServerStats } from '../../shared/publicApi';

export type BuildOrcaFailureReasonCode =
  | 'missing-tool'
  | 'invalid-env'
  | 'compile-errors'
  | 'stale-staging'
  | 'source-conflict'
  | 'packaging-disabled'
  | 'runner-failed'
  | 'timeout'
  | 'cancelled';

export interface BuildOrcaFailureFinding {
  reasonCode: BuildOrcaFailureReasonCode;
  severity: 'info' | 'warning' | 'error';
  summary: string;
  detail?: string;
  source: 'server-stats' | 'build-orca-journal';
}

export interface BuildOrcaFailureDomainSummary {
  primaryReasonCode?: BuildOrcaFailureReasonCode;
  findings: BuildOrcaFailureFinding[];
}

export interface BuildOrcaFailureSummary {
  build: BuildOrcaFailureDomainSummary;
  orca: BuildOrcaFailureDomainSummary;
}

export function classifyBuildOrcaFailures(input: {
  stats: ApiServerStats;
  buildOrcaJournal?: ApiRuntimeJournalSnapshot;
}): BuildOrcaFailureSummary {
  const buildFindings: BuildOrcaFailureFinding[] = [];
  const orcaFindings: BuildOrcaFailureFinding[] = [];

  classifyBuildFailures(input.stats, buildFindings);
  classifyOrcaFailures(input.stats, input.buildOrcaJournal, orcaFindings);

  return {
    build: finalizeDomain(buildFindings),
    orca: finalizeDomain(orcaFindings),
  };
}

function classifyBuildFailures(stats: ApiServerStats, findings: BuildOrcaFailureFinding[]): void {
  if (stats.buildTooling?.status === 'missing') {
    pushFinding(findings, {
      reasonCode: 'missing-tool',
      severity: 'error',
      summary: 'PBAutoBuild no está disponible.',
      detail: stats.buildTooling.detail,
      source: 'server-stats',
    });
  } else if (stats.buildTooling?.status === 'invalid') {
    pushFinding(findings, {
      reasonCode: 'invalid-env',
      severity: 'error',
      summary: 'El entorno de PBAutoBuild es inválido.',
      detail: stats.buildTooling.detail,
      source: 'server-stats',
    });
  }

  const buildRunner = stats.buildRunner;
  const buildProblems = stats.buildProblems;
  const hasBuildProblems = (buildProblems?.total ?? 0) > 0;

  if (buildRunner?.state === 'timed-out') {
    pushFinding(findings, {
      reasonCode: 'timeout',
      severity: 'warning',
      summary: 'El último build moderno agotó el timeout.',
      detail: buildRunner.detail,
      source: 'server-stats',
    });
  } else if (buildRunner?.state === 'cancelled') {
    pushFinding(findings, {
      reasonCode: 'cancelled',
      severity: 'warning',
      summary: 'El último build moderno fue cancelado.',
      detail: buildRunner.detail,
      source: 'server-stats',
    });
  }

  if (buildProblems && hasBuildProblems) {
    pushFinding(findings, {
      reasonCode: 'compile-errors',
      severity: buildRunner?.state === 'failed' ? 'error' : 'warning',
      summary: 'El último build moderno dejó errores de compilación.',
      detail: summarizeBuildProblems(buildProblems),
      source: 'server-stats',
    });
    return;
  }

  if (buildRunner?.state === 'failed') {
    pushFinding(findings, {
      reasonCode: 'runner-failed',
      severity: 'error',
      summary: 'El último build moderno falló antes de publicar problemas clasificables.',
      detail: buildRunner.detail,
      source: 'server-stats',
    });
  }
}

function classifyOrcaFailures(
  stats: ApiServerStats,
  buildOrcaJournal: ApiRuntimeJournalSnapshot | undefined,
  findings: BuildOrcaFailureFinding[],
): void {
  if (stats.orcaTooling?.status === 'missing') {
    pushFinding(findings, {
      reasonCode: 'missing-tool',
      severity: 'error',
      summary: 'ORCA no está disponible.',
      detail: stats.orcaTooling.detail,
      source: 'server-stats',
    });
  } else if (stats.orcaTooling?.status === 'invalid') {
    pushFinding(findings, {
      reasonCode: 'invalid-env',
      severity: 'error',
      summary: 'El entorno ORCA es inválido.',
      detail: stats.orcaTooling.detail,
      source: 'server-stats',
    });
  }

  if (stats.orcaTooling?.packagingPolicy?.exposure === 'not-exposed') {
    pushFinding(findings, {
      reasonCode: 'packaging-disabled',
      severity: 'warning',
      summary: 'El packaging ORCA está deshabilitado en la surface pública actual.',
      detail: stats.orcaTooling.packagingPolicy.detail,
      source: 'server-stats',
    });
  }

  const journalFindings = extractOrcaJournalFindings(buildOrcaJournal);
  for (const finding of journalFindings) {
    pushFinding(findings, finding);
  }

  const hasSpecificJournalFailure = journalFindings.some((finding) =>
    finding.reasonCode === 'stale-staging'
    || finding.reasonCode === 'source-conflict'
    || finding.reasonCode === 'compile-errors'
  );

  if (hasSpecificJournalFailure) {
    return;
  }

  if (stats.orcaRunner?.state === 'timed-out') {
    pushFinding(findings, {
      reasonCode: 'timeout',
      severity: 'warning',
      summary: 'La última ejecución ORCA agotó el timeout.',
      detail: stats.orcaRunner.detail,
      source: 'server-stats',
    });
  } else if (stats.orcaRunner?.state === 'cancelled') {
    pushFinding(findings, {
      reasonCode: 'cancelled',
      severity: 'warning',
      summary: 'La última ejecución ORCA fue cancelada.',
      detail: stats.orcaRunner.detail,
      source: 'server-stats',
    });
  } else if (stats.orcaRunner?.state === 'failed') {
    pushFinding(findings, {
      reasonCode: 'runner-failed',
      severity: 'error',
      summary: 'La última ejecución ORCA falló sin una clasificación más específica.',
      detail: stats.orcaRunner.detail,
      source: 'server-stats',
    });
  }
}

function extractOrcaJournalFindings(buildOrcaJournal: ApiRuntimeJournalSnapshot | undefined): BuildOrcaFailureFinding[] {
  const events = buildOrcaJournal?.events ?? [];
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    if (event.phase !== 'legacy') {
      continue;
    }
    if (event.kind !== 'orca-import' && event.kind !== 'orca-build') {
      continue;
    }
    if (event.action !== 'blocked' && event.action !== 'failed' && event.action !== 'completed') {
      continue;
    }

    const findings = extractOrcaJournalEventFindings(event.kind, event.detail);
    if (findings.length > 0) {
      return findings;
    }
  }

  return [];
}

function extractOrcaJournalEventFindings(kind: 'orca-import' | 'orca-build', detail: unknown): BuildOrcaFailureFinding[] {
  const findings: BuildOrcaFailureFinding[] = [];
  const record = asRecord(detail);
  if (!record) {
    return findings;
  }

  const issues = Array.isArray(record.issues) ? record.issues : [];
  for (const issue of issues) {
    const issueRecord = asRecord(issue);
    const code = asString(issueRecord?.code);
    const message = asString(issueRecord?.message);
    if (code === 'stale-staging') {
      pushFinding(findings, {
        reasonCode: 'stale-staging',
        severity: 'error',
        summary: 'ORCA detectó staging obsoleto antes de escribir en librerías.',
        detail: normalizeOrcaIssueDetail(message, 'El preflight ORCA reportó staging obsoleto.'),
        source: 'build-orca-journal',
      });
    } else if (code === 'source-conflict') {
      pushFinding(findings, {
        reasonCode: 'source-conflict',
        severity: 'error',
        summary: 'ORCA detectó conflicto entre source real y staging.',
        detail: normalizeOrcaIssueDetail(message, 'El preflight ORCA reportó conflicto entre source real y staging.'),
        source: 'build-orca-journal',
      });
    }
  }

  const compileResult = asRecord(record.compileResult);
  if (compileResult && asString(compileResult.status) === 'failed') {
    pushFinding(findings, {
      reasonCode: 'compile-errors',
      severity: 'error',
      summary: kind === 'orca-import'
        ? 'El último import ORCA terminó con errores de compilación.'
        : 'La última operación ORCA de build terminó con errores de compilación.',
      detail: summarizeOrcaCompileResult(compileResult),
      source: 'build-orca-journal',
    });
  }

  return findings;
}

function summarizeBuildProblems(summary: NonNullable<ApiServerStats['buildProblems']>): string {
  return [
    `${summary.total} problema(s)`,
    `${summary.published} publicado(s)`,
    summary.unresolved > 0 ? `${summary.unresolved} sin ubicación fiable` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · ');
}

function summarizeOrcaCompileResult(compileResult: Record<string, unknown>): string | undefined {
  const errors = asNumber(compileResult.errors);
  const warnings = asNumber(compileResult.warnings);
  const parts = [
    typeof errors === 'number' ? `${errors} error(es)` : undefined,
    typeof warnings === 'number' ? `${warnings} warning(s)` : undefined,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function normalizeOrcaIssueDetail(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  return containsPathLikeText(message) ? fallback : message;
}

function finalizeDomain(findings: BuildOrcaFailureFinding[]): BuildOrcaFailureDomainSummary {
  const normalizedFindings = [...findings].sort(compareFindings);
  return {
    ...(normalizedFindings[0] ? { primaryReasonCode: normalizedFindings[0].reasonCode } : {}),
    findings: normalizedFindings,
  };
}

function compareFindings(left: BuildOrcaFailureFinding, right: BuildOrcaFailureFinding): number {
  const severityDelta = severityPriority(left.severity) - severityPriority(right.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }

  const reasonDelta = reasonPriority(left.reasonCode) - reasonPriority(right.reasonCode);
  if (reasonDelta !== 0) {
    return reasonDelta;
  }

  return left.summary.localeCompare(right.summary, 'es');
}

function severityPriority(severity: BuildOrcaFailureFinding['severity']): number {
  switch (severity) {
    case 'error':
      return 0;
    case 'warning':
      return 1;
    case 'info':
      return 2;
  }
}

function reasonPriority(reasonCode: BuildOrcaFailureReasonCode): number {
  switch (reasonCode) {
    case 'missing-tool':
      return 0;
    case 'invalid-env':
      return 1;
    case 'stale-staging':
      return 2;
    case 'source-conflict':
      return 3;
    case 'compile-errors':
      return 4;
    case 'packaging-disabled':
      return 5;
    case 'runner-failed':
      return 6;
    case 'timeout':
      return 7;
    case 'cancelled':
      return 8;
  }
}

function pushFinding(findings: BuildOrcaFailureFinding[], finding: BuildOrcaFailureFinding): void {
  if (findings.some((current) => current.reasonCode === finding.reasonCode)) {
    return;
  }
  findings.push(finding);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function containsPathLikeText(value: string): boolean {
  return /^file:\/\//i.test(value)
    || /[a-zA-Z]:[\\/]/.test(value)
    || /[\\/][^\s]+\.[a-z0-9][a-z0-9-]{0,31}/i.test(value);
}