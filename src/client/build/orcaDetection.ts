import * as path from 'path';

import type { ApiOrcaCapabilitySnapshot } from '../../shared/publicApi';

export type OrcaDetectionStatus = ApiOrcaCapabilitySnapshot['status'];
export type OrcaDetectionSource = ApiOrcaCapabilitySnapshot['source'];

export interface DetectOrcaCapabilityOptions {
  configuredPath?: string;
  envPath?: string;
  platform: NodeJS.Platform;
  inspectPath: (candidate: string) => Promise<'file' | 'directory' | 'missing'>;
}

export interface OrcaDetector {
  detect(
    inputs?: { configuredPath?: string; envPath?: string },
    force?: boolean,
  ): Promise<ApiOrcaCapabilitySnapshot>;
  invalidate(): void;
}

interface OrcaCandidate {
  source: Exclude<OrcaDetectionSource, 'unresolved'>;
  path: string;
}

const KNOWN_ORCA_CAPABILITIES = ['legacy-script-runner', 'staging-export', 'staging-import-compile', 'staging-regenerate', 'project-rebuild'];

export async function detectOrcaCapability(
  options: DetectOrcaCapabilityOptions,
): Promise<ApiOrcaCapabilitySnapshot> {
  if (options.platform !== 'win32') {
    return {
      status: 'invalid',
      source: 'unresolved',
      capabilities: [],
      detail: 'ORCA legacy solo está soportado en Windows.',
    };
  }

  const candidates = collectCandidates(options);
  let firstInvalid:
    | { source: Exclude<OrcaDetectionSource, 'unresolved'>; path: string; reason: 'missing' | 'directory' }
    | undefined;

  for (const candidate of candidates) {
    const inspected = await options.inspectPath(candidate.path);
    if (inspected === 'missing') {
      if (!firstInvalid) {
        firstInvalid = { source: candidate.source, path: candidate.path, reason: 'missing' };
      }
      continue;
    }

    if (inspected === 'directory') {
      if (!firstInvalid) {
        firstInvalid = { source: candidate.source, path: candidate.path, reason: 'directory' };
      }
      continue;
    }

    return {
      status: 'available',
      source: candidate.source,
      executablePath: candidate.path,
      capabilities: [...KNOWN_ORCA_CAPABILITIES],
      detail: `ORCA disponible vía ${formatSource(candidate.source)}.`,
    };
  }

  if (firstInvalid) {
    return {
      status: 'invalid',
      source: firstInvalid.source,
      executablePath: firstInvalid.path,
      capabilities: [],
      detail: firstInvalid.reason === 'directory'
        ? `La ruta ${formatSource(firstInvalid.source)} apunta a un directorio, no a un ejecutable: ${firstInvalid.path}`
        : `La ruta ${formatSource(firstInvalid.source)} no existe: ${firstInvalid.path}`,
    };
  }

  return {
    status: 'missing',
    source: 'unresolved',
    capabilities: [],
    detail: 'No se encontró ORCA. Configura vscPowerSyntax.legacy.orcaPath o PB_ORCA_PATH.',
  };
}

export function createOrcaDetector(options: {
  inspectPath: (candidate: string) => Promise<'file' | 'directory' | 'missing'>;
  platform?: NodeJS.Platform;
  now?: () => number;
  ttlMs?: number;
}): OrcaDetector {
  const platform = options.platform ?? process.platform;
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.ttlMs ?? 30_000;

  let cachedSignature = '';
  let cachedAt = 0;
  let cachedSnapshot: ApiOrcaCapabilitySnapshot | undefined;

  return {
    async detect(inputs = {}, force = false): Promise<ApiOrcaCapabilitySnapshot> {
      const signature = JSON.stringify({
        configuredPath: normalizeCandidate(inputs.configuredPath),
        envPath: normalizeCandidate(inputs.envPath),
        platform,
      });

      if (!force && cachedSnapshot && cachedSignature === signature && now() - cachedAt < ttlMs) {
        return cachedSnapshot;
      }

      const snapshot = await detectOrcaCapability({
        configuredPath: inputs.configuredPath,
        envPath: inputs.envPath,
        platform,
        inspectPath: options.inspectPath,
      });

      cachedSignature = signature;
      cachedAt = now();
      cachedSnapshot = snapshot;
      return snapshot;
    },
    invalidate(): void {
      cachedSignature = '';
      cachedAt = 0;
      cachedSnapshot = undefined;
    },
  };
}

export function formatOrcaStatusInline(snapshot?: ApiOrcaCapabilitySnapshot): string | undefined {
  if (!snapshot) {
    return undefined;
  }

  if (snapshot.status === 'available') {
    return `ORCA disponible · ${formatSource(snapshot.source)}`;
  }

  if (snapshot.status === 'invalid') {
    return `ORCA inválido · ${snapshot.detail}`;
  }

  return 'ORCA no detectado';
}

function collectCandidates(options: DetectOrcaCapabilityOptions): OrcaCandidate[] {
  const seen = new Set<string>();
  const candidates: OrcaCandidate[] = [];

  const pushCandidate = (
    source: Exclude<OrcaDetectionSource, 'unresolved'>,
    candidatePath: string | undefined,
  ): void => {
    const normalized = normalizeCandidate(candidatePath);
    if (!normalized) {
      return;
    }
    const signature = normalized.toLowerCase();
    if (seen.has(signature)) {
      return;
    }
    seen.add(signature);
    candidates.push({ source, path: normalized });
  };

  pushCandidate('config', options.configuredPath);
  pushCandidate('env', options.envPath);

  return candidates;
}

function normalizeCandidate(candidatePath: string | undefined): string | undefined {
  const trimmed = candidatePath?.trim();
  return trimmed ? path.normalize(trimmed) : undefined;
}

function formatSource(source: OrcaDetectionSource): string {
  switch (source) {
    case 'config':
      return 'configuración';
    case 'env':
      return 'entorno';
    case 'unresolved':
      return 'sin resolver';
  }
}