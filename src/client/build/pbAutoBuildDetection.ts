import * as path from 'path';

export type PbAutoBuildDetectionStatus = 'available' | 'missing' | 'invalid';
export type PbAutoBuildDetectionSource = 'config' | 'env' | 'default' | 'unresolved';

export interface PbAutoBuildCapabilitySnapshot {
  status: PbAutoBuildDetectionStatus;
  source: PbAutoBuildDetectionSource;
  executablePath?: string;
  versionLabel?: string;
  capabilities: string[];
  detail: string;
}

export interface DetectPbAutoBuildCapabilityOptions {
  configuredPath?: string;
  envPath?: string;
  defaultCandidates?: string[];
  pathExists: (candidate: string) => Promise<boolean>;
}

export interface PbAutoBuildDetector {
  detect(
    inputs?: { configuredPath?: string; envPath?: string },
    force?: boolean,
  ): Promise<PbAutoBuildCapabilitySnapshot>;
  invalidate(): void;
}

interface PbAutoBuildCandidate {
  source: Exclude<PbAutoBuildDetectionSource, 'unresolved'>;
  path: string;
}

const KNOWN_PBAUTOBUILD_BINARY = 'pbautobuild250.exe';
const KNOWN_PBAUTOBUILD_VERSION = '25.0 / 2025';
const KNOWN_PBAUTOBUILD_CAPABILITIES = ['json-build', 'pbc-compile'];

export const DEFAULT_PBAUTOBUILD_CANDIDATES = [
  'C:/Program Files (x86)/Appeon/PowerBuilder 25.0/pbautobuild250.exe',
  'C:/Program Files/Appeon/PowerBuilder 25.0/pbautobuild250.exe',
  'C:/Program Files (x86)/Appeon/PowerBuilder 2025/pbautobuild250.exe',
  'C:/Program Files/Appeon/PowerBuilder 2025/pbautobuild250.exe',
];

export async function detectPbAutoBuildCapability(
  options: DetectPbAutoBuildCapabilityOptions,
): Promise<PbAutoBuildCapabilitySnapshot> {
  const candidates = collectCandidates(options);
  let firstInvalid:
    | { source: Exclude<PbAutoBuildDetectionSource, 'unresolved'>; path: string; reason: 'missing' | 'unexpected-binary' }
    | undefined;

  for (const candidate of candidates) {
    const exists = await options.pathExists(candidate.path);
    if (!exists) {
      if (candidate.source !== 'default' && !firstInvalid) {
        firstInvalid = { source: candidate.source, path: candidate.path, reason: 'missing' };
      }
      continue;
    }

    if (!isExpectedPbAutoBuildBinary(candidate.path)) {
      if (!firstInvalid) {
        firstInvalid = { source: candidate.source, path: candidate.path, reason: 'unexpected-binary' };
      }
      continue;
    }

    return {
      status: 'available',
      source: candidate.source,
      executablePath: candidate.path,
      versionLabel: KNOWN_PBAUTOBUILD_VERSION,
      capabilities: [...KNOWN_PBAUTOBUILD_CAPABILITIES],
      detail: `PBAutoBuild disponible vía ${formatSource(candidate.source)}.`,
    };
  }

  if (firstInvalid) {
    return {
      status: 'invalid',
      source: firstInvalid.source,
      executablePath: firstInvalid.path,
      capabilities: [],
      detail: firstInvalid.reason === 'missing'
        ? `La ruta ${formatSource(firstInvalid.source)} no existe: ${firstInvalid.path}`
        : `La ruta ${formatSource(firstInvalid.source)} no apunta a ${KNOWN_PBAUTOBUILD_BINARY}: ${firstInvalid.path}`,
    };
  }

  return {
    status: 'missing',
    source: 'unresolved',
    capabilities: [],
    detail: 'No se encontró PBAutoBuild250.exe. Configura vscPowerSyntax.build.pbAutoBuildPath o PB_AUTOBUILD_PATH.',
  };
}

export function createPbAutoBuildDetector(options: {
  pathExists: (candidate: string) => Promise<boolean>;
  defaultCandidates?: string[];
  now?: () => number;
  ttlMs?: number;
}): PbAutoBuildDetector {
  const defaultCandidates = options.defaultCandidates ?? DEFAULT_PBAUTOBUILD_CANDIDATES;
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.ttlMs ?? 30_000;

  let cachedSignature = '';
  let cachedAt = 0;
  let cachedSnapshot: PbAutoBuildCapabilitySnapshot | undefined;

  return {
    async detect(inputs = {}, force = false): Promise<PbAutoBuildCapabilitySnapshot> {
      const signature = JSON.stringify({
        configuredPath: normalizeCandidate(inputs.configuredPath),
        envPath: normalizeCandidate(inputs.envPath),
        defaultCandidates: defaultCandidates.map((candidate) => normalizeCandidate(candidate)).filter((candidate): candidate is string => !!candidate),
      });

      if (!force && cachedSnapshot && cachedSignature === signature && now() - cachedAt < ttlMs) {
        return cachedSnapshot;
      }

      const snapshot = await detectPbAutoBuildCapability({
        configuredPath: inputs.configuredPath,
        envPath: inputs.envPath,
        defaultCandidates,
        pathExists: options.pathExists,
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

export function formatPbAutoBuildStatusInline(snapshot?: PbAutoBuildCapabilitySnapshot): string | undefined {
  if (!snapshot) {
    return undefined;
  }

  if (snapshot.status === 'available') {
    return `PBAutoBuild ${snapshot.versionLabel ?? KNOWN_PBAUTOBUILD_VERSION} disponible · ${formatSource(snapshot.source)}`;
  }

  if (snapshot.status === 'invalid') {
    return `PBAutoBuild inválido · ${snapshot.detail}`;
  }

  return 'PBAutoBuild no detectado';
}

function collectCandidates(options: DetectPbAutoBuildCapabilityOptions): PbAutoBuildCandidate[] {
  const seen = new Set<string>();
  const candidates: PbAutoBuildCandidate[] = [];

  const pushCandidate = (
    source: Exclude<PbAutoBuildDetectionSource, 'unresolved'>,
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
  for (const candidate of options.defaultCandidates ?? DEFAULT_PBAUTOBUILD_CANDIDATES) {
    pushCandidate('default', candidate);
  }

  return candidates;
}

function normalizeCandidate(candidatePath: string | undefined): string | undefined {
  const trimmed = candidatePath?.trim();
  return trimmed ? path.normalize(trimmed) : undefined;
}

function isExpectedPbAutoBuildBinary(candidatePath: string): boolean {
  return path.basename(candidatePath).toLowerCase() === KNOWN_PBAUTOBUILD_BINARY;
}

function formatSource(source: PbAutoBuildDetectionSource): string {
  switch (source) {
    case 'config':
      return 'configuración';
    case 'env':
      return 'entorno';
    case 'default':
      return 'candidatos por defecto';
    case 'unresolved':
      return 'sin resolver';
  }
}