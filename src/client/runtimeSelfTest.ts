import type {
  ApiDiagnosticsSnapshot,
  ApiPublicContractDescriptor,
  ApiSemanticWorkspaceManifest,
} from '../shared/publicApi';
import { formatOrcaPackagingPolicyInline, formatOrcaStatusInline } from './build/orcaDetection';
import { formatPbAutoBuildStatusInline } from './build/pbAutoBuildDetection';
import type { RuntimeStatusStats } from './statusBarPresentation';

export type RuntimeSelfTestCheckKey =
  | 'api'
  | 'lsp'
  | 'cache'
  | 'project-model'
  | 'diagnostics'
  | 'build'
  | 'orca';

export type RuntimeSelfTestCheckStatus = 'pass' | 'warning' | 'fail';

export interface RuntimeSelfTestCheck {
  key: RuntimeSelfTestCheckKey;
  label: string;
  status: RuntimeSelfTestCheckStatus;
  detail: string;
  recommendation?: string;
}

export interface RuntimeSelfTestReport {
  generatedAt: string;
  overallStatus: RuntimeSelfTestCheckStatus;
  summary: string;
  checks: RuntimeSelfTestCheck[];
}

export interface RuntimeSelfTestInput {
  contract?: ApiPublicContractDescriptor;
  stats?: RuntimeStatusStats;
  manifest?: ApiSemanticWorkspaceManifest;
  generatedAt?: string;
}

const STATUS_RANK: Record<RuntimeSelfTestCheckStatus, number> = {
  pass: 0,
  warning: 1,
  fail: 2,
};

function combineStatuses(...statuses: RuntimeSelfTestCheckStatus[]): RuntimeSelfTestCheckStatus {
  return statuses.reduce<RuntimeSelfTestCheckStatus>((current, candidate) => {
    return STATUS_RANK[candidate] > STATUS_RANK[current] ? candidate : current;
  }, 'pass');
}

function formatCheckStatus(status: RuntimeSelfTestCheckStatus): string {
  switch (status) {
    case 'pass':
      return 'ok';
    case 'warning':
      return 'warning';
    default:
      return 'fail';
  }
}

function formatDiagnosticsTotals(snapshot?: ApiDiagnosticsSnapshot | null): string | undefined {
  if (!snapshot) {
    return undefined;
  }

  return [
    `${snapshot.totals.error} error`,
    `${snapshot.totals.warning} warning`,
    `${snapshot.totals.info} info`,
    `${snapshot.totals.hint} hint`,
  ].join(' · ');
}

function buildApiCheck(contract?: ApiPublicContractDescriptor): RuntimeSelfTestCheck {
  if (!contract) {
    return {
      key: 'api',
      label: 'API pública',
      status: 'fail',
      detail: 'No se pudo materializar el contrato público de la extensión.',
      recommendation: 'Verificar activación del cliente y disponibilidad de getPublicContract().',
    };
  }

  return {
    key: 'api',
    label: 'API pública',
    status: 'pass',
    detail: [
      `v${contract.apiVersion}`,
      `${contract.methods.length} métodos`,
      `${contract.capabilities.readOnlyTools.length} tools read-only`,
    ].join(' · '),
  };
}

function buildLspCheck(stats?: RuntimeStatusStats): RuntimeSelfTestCheck {
  if (!stats) {
    return {
      key: 'lsp',
      label: 'LSP/runtime',
      status: 'fail',
      detail: 'No se pudo leer ApiServerStats; el roundtrip cliente-servidor no quedó validado.',
      recommendation: 'Revisar arranque del cliente LSP, canal de salida y errores del servidor.',
    };
  }

  return {
    key: 'lsp',
    label: 'LSP/runtime',
    status: 'pass',
    detail: [
      stats.readiness?.state ? `readiness ${stats.readiness.state}` : undefined,
      stats.health?.status ? `health ${stats.health.status}` : undefined,
      stats.indexer?.phase ? `indexer ${stats.indexer.phase}` : undefined,
    ].filter((part): part is string => Boolean(part)).join(' · ') || 'ApiServerStats disponible',
  };
}

function buildCacheCheck(stats?: RuntimeStatusStats): RuntimeSelfTestCheck {
  if (!stats) {
    return {
      key: 'cache',
      label: 'Cache/runtime journal',
      status: 'fail',
      detail: 'Sin stats del runtime no se puede validar cache ni persistencia.',
      recommendation: 'Recuperar ApiServerStats antes de evaluar serving cache o warm resume.',
    };
  }

  const persistence = stats.persistence;
  const cacheLabels = [
    stats.caches?.analysis?.size !== undefined
      ? `analysis ${stats.caches.analysis.size}/${stats.caches.analysis.capacity ?? 0}`
      : undefined,
    stats.caches?.serving?.size !== undefined
      ? `serving ${stats.caches.serving.size}/${stats.caches.serving.capacity ?? 0}`
      : undefined,
    persistence?.restoreState ? `restore ${persistence.restoreState}` : undefined,
  ].filter((part): part is string => Boolean(part));

  const hasVisibility = cacheLabels.length > 0 || Boolean(persistence?.workspaceKey);
  const status: RuntimeSelfTestCheckStatus = !hasVisibility
    ? 'warning'
    : persistence?.maintenance?.maintenanceRecommended || persistence?.maintenance?.needsCompaction
      ? 'warning'
      : 'pass';

  return {
    key: 'cache',
    label: 'Cache/runtime journal',
    status,
    detail: hasVisibility
      ? cacheLabels.join(' · ') || 'Snapshot de cache visible'
      : 'El runtime no publicó métricas de cache o persistencia en este snapshot.',
    ...(status === 'warning'
      ? { recommendation: 'Ejecutar validación de cache persistente o mantenimiento semántico si el workspace debería reutilizar warm resume.' }
      : {}),
  };
}

function buildProjectModelCheck(stats?: RuntimeStatusStats, manifest?: ApiSemanticWorkspaceManifest): RuntimeSelfTestCheck {
  const manifestParts = manifest
    ? [
        `${manifest.projects.length} proyectos`,
        `${manifest.libraries.length} librerías`,
        `${manifest.objects.length} objetos`,
      ]
    : [];
  const statsParts = stats?.projectModel
    ? [
        typeof stats.projectModel.projects === 'number' ? `${stats.projectModel.projects} proyectos runtime` : undefined,
        typeof stats.projectModel.libraries === 'number' ? `${stats.projectModel.libraries} librerías runtime` : undefined,
      ].filter((part): part is string => Boolean(part))
    : [];
  const activeProject = stats?.workspace?.activeProject?.name;

  if (!manifest && statsParts.length === 0 && !activeProject) {
    return {
      key: 'project-model',
      label: 'Project model',
      status: 'warning',
      detail: stats?.workspace?.mode
        ? `Modo ${stats.workspace.mode} sin manifest ni resumen topológico exportado.`
        : 'No hay evidencia suficiente del project model en el snapshot actual.',
      recommendation: 'Revisar getSemanticWorkspaceManifest() o el routing/topology del workspace activo.',
    };
  }

  return {
    key: 'project-model',
    label: 'Project model',
    status: 'pass',
    detail: [
      activeProject ? `activo ${activeProject}` : undefined,
      ...manifestParts,
      ...statsParts,
    ].filter((part): part is string => Boolean(part)).join(' · '),
  };
}

function buildDiagnosticsCheck(stats?: RuntimeStatusStats, manifest?: ApiSemanticWorkspaceManifest): RuntimeSelfTestCheck {
  const diagnostics = manifest?.diagnosticsSummary ?? stats?.diagnostics;
  if (!diagnostics) {
    return {
      key: 'diagnostics',
      label: 'Diagnósticos',
      status: 'warning',
      detail: 'No hay snapshot diagnóstico visible en el self-test.',
      recommendation: 'Verificar exportación de diagnosticsSummary en el manifest o diagnostics en ApiServerStats.',
    };
  }

  return {
    key: 'diagnostics',
    label: 'Diagnósticos',
    status: 'pass',
    detail: formatDiagnosticsTotals(diagnostics) ?? 'Snapshot diagnóstico disponible',
  };
}

function buildBuildCheck(stats?: RuntimeStatusStats): RuntimeSelfTestCheck {
  const tooling = formatPbAutoBuildStatusInline(stats?.buildTooling);
  const detail = [
    tooling,
    stats?.buildHealth ? `${stats.buildHealth.state} · ${stats.buildHealth.summary}` : undefined,
    stats?.buildFiles?.total !== undefined ? `${stats.buildFiles.total} build files` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · ');

  if (!detail) {
    return {
      key: 'build',
      label: 'Build snapshot',
      status: 'warning',
      detail: 'No hay snapshot moderno de build en ApiServerStats.',
      recommendation: 'Comprobar detección PBAutoBuild y build files del workspace.',
    };
  }

  return {
    key: 'build',
    label: 'Build snapshot',
    status: 'pass',
    detail,
  };
}

function buildOrcaCheck(stats?: RuntimeStatusStats): RuntimeSelfTestCheck {
  const detail = [
    formatOrcaStatusInline(stats?.orcaTooling),
    formatOrcaPackagingPolicyInline(stats?.orcaTooling),
    stats?.orcaRunner?.state ? `runner ${stats.orcaRunner.state}` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · ');

  if (!detail) {
    return {
      key: 'orca',
      label: 'ORCA snapshot',
      status: 'warning',
      detail: 'No hay snapshot ORCA visible en ApiServerStats.',
      recommendation: 'Validar detección legacy/ORCA solo si el workspace necesita esa ruta.',
    };
  }

  return {
    key: 'orca',
    label: 'ORCA snapshot',
    status: 'pass',
    detail,
  };
}

function buildSummary(checks: readonly RuntimeSelfTestCheck[]): string {
  const counts = checks.reduce<Record<RuntimeSelfTestCheckStatus, number>>((accumulator, check) => {
    accumulator[check.status] += 1;
    return accumulator;
  }, { pass: 0, warning: 0, fail: 0 });

  return `${counts.pass} ok · ${counts.warning} warning · ${counts.fail} fail`;
}

export function buildRuntimeSelfTestReport(input: RuntimeSelfTestInput): RuntimeSelfTestReport {
  const checks: RuntimeSelfTestCheck[] = [
    buildApiCheck(input.contract),
    buildLspCheck(input.stats),
    buildCacheCheck(input.stats),
    buildProjectModelCheck(input.stats, input.manifest),
    buildDiagnosticsCheck(input.stats, input.manifest),
    buildBuildCheck(input.stats),
    buildOrcaCheck(input.stats),
  ];

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    overallStatus: combineStatuses(...checks.map((check) => check.status)),
    summary: buildSummary(checks),
    checks,
  };
}

export function buildRuntimeSelfTestMarkdown(report: RuntimeSelfTestReport): string {
  const lines: string[] = [
    '# PowerSyntax Runtime Self-Test',
    '',
    `Generado: ${report.generatedAt}`,
    '',
    `Resultado: ${formatCheckStatus(report.overallStatus)} · ${report.summary}`,
    '',
    '| Check | Estado | Detalle |',
    '| --- | --- | --- |',
  ];

  for (const check of report.checks) {
    lines.push(`| ${check.label} | ${formatCheckStatus(check.status)} | ${check.detail.replace(/\|/g, '\\|')} |`);
  }

  const actionableChecks = report.checks.filter((check) => check.status !== 'pass');
  if (actionableChecks.length > 0) {
    lines.push('');
    lines.push('## Acciones sugeridas');
    for (const check of actionableChecks) {
      lines.push(`- ${check.label}: ${check.recommendation ?? check.detail}`);
    }
  }

  return `${lines.join('\n')}\n`;
}