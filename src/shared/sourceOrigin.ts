export type SourceOrigin =
  | 'solution-source'
  | 'workspace-ws_objects'
  | 'pbl-folder-source'
  | 'manual-export-source'
  | 'orca-staging'
  | 'pbl-dump-source'
  | 'generated'
  | 'backup'
  | 'unknown';

const SOURCE_ORIGIN_ORDER: SourceOrigin[] = [
  'solution-source',
  'workspace-ws_objects',
  'pbl-folder-source',
  'manual-export-source',
  'orca-staging',
  'pbl-dump-source',
  'generated',
  'backup',
  'unknown'
];

const SOURCE_ORIGIN_PRIORITY = new Map<SourceOrigin, number>(
  SOURCE_ORIGIN_ORDER.map((origin, index) => [origin, index])
);

export function compareSourceOriginPriority(left: SourceOrigin, right: SourceOrigin): number {
  return (SOURCE_ORIGIN_PRIORITY.get(left) ?? SOURCE_ORIGIN_ORDER.length)
    - (SOURCE_ORIGIN_PRIORITY.get(right) ?? SOURCE_ORIGIN_ORDER.length);
}

export function pickPreferredSourceOrigin(current: SourceOrigin | undefined, candidate: SourceOrigin): SourceOrigin {
  if (!current) {
    return candidate;
  }

  return compareSourceOriginPriority(candidate, current) < 0 ? candidate : current;
}

export function inferSourceOrigin(
  uri: string,
  options: { hasSolutionRoots?: boolean } = {}
): SourceOrigin {
  const normalized = uri.toLowerCase();

  if (normalized.includes('/orca-staging/') || normalized.includes('/orca_staging/')) {
    return 'orca-staging';
  }
  if (normalized.includes('/pbl-dump/') || normalized.includes('/pbl_dump/')) {
    return 'pbl-dump-source';
  }
  if (normalized.includes('/generated/')) {
    return 'generated';
  }
  if (normalized.includes('/_backupfiles/') || normalized.includes('/backup/')) {
    return 'backup';
  }
  if (normalized.includes('/manual-export/') || normalized.includes('/manual_export/')) {
    return 'manual-export-source';
  }
  if (normalized.includes('/ws_objects/')) {
    return 'workspace-ws_objects';
  }
  if (normalized.includes('.pbl/')) {
    return 'pbl-folder-source';
  }
  if (options.hasSolutionRoots) {
    return 'solution-source';
  }
  return 'unknown';
}

export function summarizeSourceOrigins(
  origins: Iterable<SourceOrigin>
): Partial<Record<SourceOrigin, number>> {
  const summary: Partial<Record<SourceOrigin, number>> = {};
  for (const origin of origins) {
    summary[origin] = (summary[origin] ?? 0) + 1;
  }
  return summary;
}