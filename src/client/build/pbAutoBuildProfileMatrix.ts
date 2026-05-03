import {
  type ApiBuildProfileMatrix,
  type ApiBuildProfileMatrixFinding,
  type ApiBuildProfileMatrixProfile,
  type ApiPbAutoBuildCapabilitySnapshot,
} from '../../shared/publicApi';
import { buildPbAutoBuildHealthSnapshot } from './pbAutoBuildHealth';

export type PbAutoBuildProfileInventoryStatus = 'usable' | 'invalid' | 'ambiguous';

export type PbAutoBuildProfileInventoryReasonCode =
  | 'missing-build-plan'
  | 'malformed-json'
  | 'missing-project-reference'
  | 'unresolved-project-reference'
  | 'ambiguous-project-reference';

export interface PbAutoBuildProfileInventoryEntry {
  uri: string;
  label: string;
  detail?: string;
  representedProjectUri?: string;
  status: PbAutoBuildProfileInventoryStatus;
  reasonCode?: PbAutoBuildProfileInventoryReasonCode;
}

export interface PbAutoBuildProfileMatrixInput {
  inventory: readonly PbAutoBuildProfileInventoryEntry[];
  buildTooling?: ApiPbAutoBuildCapabilitySnapshot;
  preferredBuildFileUri?: string;
  maxProfiles?: number;
}

export function buildPbAutoBuildProfileMatrix(
  input: PbAutoBuildProfileMatrixInput,
): ApiBuildProfileMatrix {
  const preferredUri = input.preferredBuildFileUri?.trim();
  const toolingStatus: ApiBuildProfileMatrix['summary']['toolingStatus'] = input.buildTooling?.status ?? 'unknown';
  const toolingReady = input.buildTooling?.status === 'available' && Boolean(input.buildTooling.executablePath);
  const fullProfiles = input.inventory
    .map((entry) => toMatrixProfile(entry, preferredUri, toolingReady, input.buildTooling))
    .sort(compareProfiles);
  const profiles = typeof input.maxProfiles === 'number' && Number.isFinite(input.maxProfiles)
    ? fullProfiles.slice(0, Math.max(0, Math.trunc(input.maxProfiles)))
    : fullProfiles;

  const findings: ApiBuildProfileMatrixFinding[] = [];
  if (!toolingReady) {
    findings.push({
      code: 'tooling-unavailable',
      severity: input.buildTooling?.status === 'invalid' ? 'error' : 'warning',
      message: input.buildTooling?.detail ?? 'PBAutoBuild no está disponible para ejecutar perfiles.',
    });
  }

  if (fullProfiles.length === 0) {
    findings.push({
      code: 'profiles-missing',
      severity: 'warning',
      message: 'No hay build profiles PBAutoBuild detectados.',
    });
  } else if (!fullProfiles.some((profile) => profile.status === 'usable')) {
    findings.push({
      code: 'profiles-not-runnable',
      severity: 'warning',
      message: 'No hay build profiles utilizables en el workspace.',
    });
  }

  if (preferredUri && !fullProfiles.some((profile) => profile.buildFileUri === preferredUri)) {
    findings.push({
      code: 'preferred-profile-stale',
      severity: 'warning',
      message: 'El último build profile recordado ya no está disponible en el inventario actual.',
      detail: preferredUri,
    });
  }

  const health = buildPbAutoBuildHealthSnapshot({
    buildTooling: input.buildTooling,
    buildFiles: {
      total: input.inventory.length,
      usable: input.inventory.filter((entry) => entry.status === 'usable').length,
      ambiguous: input.inventory.filter((entry) => entry.status === 'ambiguous').length,
      invalid: input.inventory.filter((entry) => entry.status === 'invalid').length,
    },
  });

  const summary = fullProfiles.reduce(
    (accumulator, profile) => {
      accumulator.totalProfiles++;
      if (profile.status === 'usable') {
        accumulator.usableProfiles++;
      } else if (profile.status === 'ambiguous') {
        accumulator.ambiguousProfiles++;
      } else {
        accumulator.invalidProfiles++;
      }

      if (profile.canRun) {
        accumulator.runnableProfiles++;
      }

      return accumulator;
    },
    {
      totalProfiles: 0,
      usableProfiles: 0,
      ambiguousProfiles: 0,
      invalidProfiles: 0,
      runnableProfiles: 0,
      toolingStatus,
      healthState: health.state,
      ...(preferredUri ? { preferredProfileUri: preferredUri } : {}),
    },
  );

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    available: true,
    summary,
    ...(input.buildTooling ? { tooling: input.buildTooling } : {}),
    health,
    findings,
    profiles,
  };
}

function toMatrixProfile(
  entry: PbAutoBuildProfileInventoryEntry,
  preferredUri: string | undefined,
  toolingReady: boolean,
  buildTooling: ApiPbAutoBuildCapabilitySnapshot | undefined,
): ApiBuildProfileMatrixProfile {
  const isLastUsed = preferredUri === entry.uri;
  if (entry.status === 'usable') {
    return {
      buildFileUri: entry.uri,
      label: entry.label,
      ...(entry.detail ? { detail: entry.detail } : {}),
      ...(entry.representedProjectUri ? { representedProjectUri: entry.representedProjectUri } : {}),
      status: entry.status,
      isLastUsed,
      canRun: toolingReady,
      validationState: toolingReady ? 'ready' : 'error',
      validationMessage: toolingReady
        ? 'listo para ejecutar con el entorno actual'
        : buildTooling?.detail ?? 'PBAutoBuild no está disponible para este profile',
    };
  }

  if (entry.status === 'ambiguous') {
    return {
      buildFileUri: entry.uri,
      label: entry.label,
      ...(entry.detail ? { detail: entry.detail } : {}),
      ...(entry.representedProjectUri ? { representedProjectUri: entry.representedProjectUri } : {}),
      status: entry.status,
      ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      isLastUsed,
      canRun: false,
      validationState: 'warning',
      validationMessage: entry.detail ?? 'El build profile referencia varios markers utilizables y necesita consolidación.',
    };
  }

  return {
    buildFileUri: entry.uri,
    label: entry.label,
    ...(entry.detail ? { detail: entry.detail } : {}),
    ...(entry.representedProjectUri ? { representedProjectUri: entry.representedProjectUri } : {}),
    status: entry.status,
    ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
    isLastUsed,
    canRun: false,
    validationState: 'error',
    validationMessage: entry.detail ?? describeInvalidReason(entry.reasonCode),
  };
}

function describeInvalidReason(
  reasonCode: PbAutoBuildProfileInventoryReasonCode | undefined,
): string {
  switch (reasonCode) {
    case 'missing-build-plan':
      return 'El build profile no declara BuildPlan.';
    case 'malformed-json':
      return 'El build profile no se pudo parsear como JSON válido.';
    case 'missing-project-reference':
      return 'El build profile no referencia markers conocidos.';
    case 'unresolved-project-reference':
      return 'El build profile referencia markers que el workspace no resolvió.';
    case 'ambiguous-project-reference':
      return 'El build profile es ambiguo y requiere consolidar markers.';
    default:
      return 'El build profile no es utilizable con el estado actual del workspace.';
  }
}

function compareProfiles(
  left: ApiBuildProfileMatrixProfile,
  right: ApiBuildProfileMatrixProfile,
): number {
  if (left.isLastUsed !== right.isLastUsed) {
    return left.isLastUsed ? -1 : 1;
  }

  const statusOrder = (status: PbAutoBuildProfileInventoryStatus): number => {
    switch (status) {
      case 'usable':
        return 0;
      case 'ambiguous':
        return 1;
      default:
        return 2;
    }
  };

  const byStatus = statusOrder(left.status) - statusOrder(right.status);
  if (byStatus !== 0) {
    return byStatus;
  }

  return left.label.localeCompare(right.label);
}