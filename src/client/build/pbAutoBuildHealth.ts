import type { ApiBuildHealthFinding, ApiBuildHealthSnapshot } from '../../shared/publicApi';
import type { PbAutoBuildProblemSummary, PbAutoBuildRunSnapshot } from '../../shared/pbAutoBuildProtocol';
import type { PbAutoBuildCapabilitySnapshot } from './pbAutoBuildDetection';

export interface PbAutoBuildHealthInput {
  buildTooling?: PbAutoBuildCapabilitySnapshot;
  buildFiles?: {
    total?: number;
    usable?: number;
    invalid?: number;
    ambiguous?: number;
  };
  buildRunner?: PbAutoBuildRunSnapshot;
  buildProblems?: PbAutoBuildProblemSummary;
}

export function buildPbAutoBuildHealthSnapshot(input: PbAutoBuildHealthInput): ApiBuildHealthSnapshot {
  const findings: ApiBuildHealthFinding[] = [];
  const runnerState = input.buildRunner?.state;

  const toolingAvailable = input.buildTooling?.status === 'available' && Boolean(input.buildTooling.executablePath);
  if (!toolingAvailable) {
    findings.push({
      code: 'build-tooling-unavailable',
      layer: 'tooling',
      severity: 'error',
      message: input.buildTooling?.detail?.trim() || 'PBAutoBuild no disponible',
      ...(input.buildTooling?.source ? { detail: `origen ${input.buildTooling.source}` } : {})
    });
  }

  const usableBuildFiles = input.buildFiles?.usable ?? 0;
  const totalBuildFiles = input.buildFiles?.total ?? 0;
  const ambiguousBuildFiles = input.buildFiles?.ambiguous ?? 0;
  const invalidBuildFiles = input.buildFiles?.invalid ?? 0;

  if (totalBuildFiles === 0) {
    findings.push({
      code: 'build-files-missing',
      layer: 'build-files',
      severity: 'warning',
      message: 'sin build files PBAutoBuild detectados'
    });
  } else if (usableBuildFiles === 0) {
    findings.push({
      code: ambiguousBuildFiles > 0 ? 'build-files-ambiguous' : 'build-files-unusable',
      layer: 'build-files',
      severity: 'warning',
      message: ambiguousBuildFiles > 0
        ? 'sin build file utilizable por ambigüedad'
        : 'sin build file utilizable',
      detail: [
        ambiguousBuildFiles > 0 ? `${ambiguousBuildFiles} ambiguos` : undefined,
        invalidBuildFiles > 0 ? `${invalidBuildFiles} inválidos` : undefined,
        totalBuildFiles > 0 ? `${totalBuildFiles} detectados` : undefined
      ].filter((part): part is string => Boolean(part)).join(' · ') || undefined
    });
  }

  if (runnerState === 'running') {
    findings.push({
      code: 'build-runner-running',
      layer: 'runner',
      severity: 'info',
      message: 'build moderno en ejecución',
      ...(input.buildRunner?.buildFileUri ? { detail: input.buildRunner.buildFileUri } : {})
    });
  } else if (runnerState === 'failed') {
    findings.push({
      code: 'build-runner-failed',
      layer: 'runner',
      severity: 'error',
      message: input.buildRunner?.detail?.trim() || 'último build falló'
    });
  } else if (runnerState === 'timed-out') {
    findings.push({
      code: 'build-runner-timeout',
      layer: 'runner',
      severity: 'warning',
      message: input.buildRunner?.detail?.trim() || 'último build excedió el timeout'
    });
  } else if (runnerState === 'cancelled') {
    findings.push({
      code: 'build-runner-cancelled',
      layer: 'runner',
      severity: 'warning',
      message: input.buildRunner?.detail?.trim() || 'último build cancelado'
    });
  }

  const buildProblems = input.buildProblems;
  if (buildProblems && buildProblems.total > 0) {
    findings.push({
      code: 'build-problems-present',
      layer: 'problems',
      severity: runnerState === 'failed' ? 'error' : 'warning',
      message: summarizeBuildProblems(buildProblems),
      ...(buildProblems.unresolved > 0
        ? { detail: `${buildProblems.unresolved} sin ubicación fiable` }
        : {})
    });
  }

  const blocked = findings.some((finding) =>
    (finding.layer === 'tooling' && finding.severity === 'error')
    || (finding.layer === 'build-files' && finding.severity !== 'info')
  );
  const running = runnerState === 'running';
  const attention = !running && findings.some((finding) =>
    finding.layer === 'runner' || finding.layer === 'problems'
  );

  const state = running
    ? 'running'
    : blocked
      ? 'blocked'
      : attention
        ? 'attention'
        : 'ready';

  const status = state === 'blocked'
    ? findings.some((finding) => finding.layer === 'tooling' && finding.severity === 'error') ? 'error' : 'warning'
    : state === 'attention'
      ? findings.some((finding) => finding.severity === 'error') ? 'error' : 'warning'
      : 'healthy';

  const canRun = toolingAvailable && usableBuildFiles > 0 && !running;

  return {
    state,
    status,
    canRun,
    summary: summarizeHealth(state, findings),
    findings
  };
}

function summarizeBuildProblems(summary: PbAutoBuildProblemSummary): string {
  if (summary.published > 0) {
    return `${summary.published}/${summary.total} problemas de build publicados`;
  }
  return `${summary.total} problemas de build sin ubicación publicable`;
}

function summarizeHealth(state: ApiBuildHealthSnapshot['state'], findings: readonly ApiBuildHealthFinding[]): string {
  if (state === 'ready') {
    return 'listo para ejecutar build moderno';
  }

  const prioritized = state === 'running'
    ? findings.find((finding) => finding.layer === 'runner')
    : state === 'attention'
      ? findings.find((finding) => finding.layer === 'runner' || finding.layer === 'problems')
      : findings.find((finding) => finding.layer === 'tooling' || finding.layer === 'build-files');

  if (prioritized) {
    return prioritized.message;
  }

  const firstFinding = findings[0];
  if (!firstFinding) {
    return state === 'running'
      ? 'build moderno en ejecución'
      : state === 'blocked'
        ? 'build moderno bloqueado'
        : 'build moderno requiere atención';
  }

  return firstFinding.message;
}