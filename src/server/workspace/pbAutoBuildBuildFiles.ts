import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceTopology } from './topology';

const PROJECT_MARKER_EXTENSIONS = ['.pbw', '.pbt', '.pbproj', '.pbsln'] as const;
const BUILD_FILE_HINT_KEYS = new Set([
  'buildplan',
  'metainfo',
  'ideversion',
  'runtimeversion',
  'buildjob',
  'projects',
  'projecttype',
  'libraries',
  'pbrfilename',
  'codegenerationoptions',
  'projectbuildoptions',
  'powerclient',
  'powerserver'
]);

export type PbAutoBuildBuildFileStatus = 'usable' | 'invalid' | 'ambiguous';

export type PbAutoBuildBuildFileReasonCode =
  | 'missing-build-plan'
  | 'malformed-json'
  | 'missing-project-reference'
  | 'unresolved-project-reference'
  | 'ambiguous-project-reference';

export interface PbAutoBuildBuildFileCandidate {
  uri: string;
  hasBuildPlan: boolean;
  referencedProjectUris: string[];
  parseError?: string;
}

export interface PbAutoBuildBuildFileInfo extends PbAutoBuildBuildFileCandidate {
  status: PbAutoBuildBuildFileStatus;
  reasonCode?: PbAutoBuildBuildFileReasonCode;
  representedProjectUri?: string;
  detail?: string;
}

export interface PbAutoBuildBuildFileSummary {
  total: number;
  usable: number;
  invalid: number;
  ambiguous: number;
}

export function clonePbAutoBuildBuildFileCandidate(
  candidate: PbAutoBuildBuildFileCandidate
): PbAutoBuildBuildFileCandidate {
  return {
    uri: normalizeUri(candidate.uri),
    hasBuildPlan: candidate.hasBuildPlan,
    referencedProjectUris: [...candidate.referencedProjectUris].map((uri) => normalizeUri(uri)).sort(),
    ...(candidate.parseError ? { parseError: candidate.parseError } : {})
  };
}

export function clonePbAutoBuildBuildFileInfo(
  info: PbAutoBuildBuildFileInfo
): PbAutoBuildBuildFileInfo {
  return {
    ...clonePbAutoBuildBuildFileCandidate(info),
    status: info.status,
    ...(info.reasonCode ? { reasonCode: info.reasonCode } : {}),
    ...(info.representedProjectUri ? { representedProjectUri: normalizeUri(info.representedProjectUri) } : {}),
    ...(info.detail ? { detail: info.detail } : {})
  };
}

export function parsePbAutoBuildBuildFileCandidate(
  uri: string,
  content: string
): PbAutoBuildBuildFileCandidate | null {
  if (!uri.toLowerCase().endsWith('.json')) {
    return null;
  }

  const rawLooksLikeBuildFile = looksLikePbAutoBuildBuildFileText(content);

  try {
    const parsed = JSON.parse(content) as unknown;
    const metadata = collectBuildFileMetadata(uri, parsed);
    if (!metadata.looksLikeBuildFile && !rawLooksLikeBuildFile) {
      return null;
    }
    return {
      uri: normalizeUri(uri),
      hasBuildPlan: metadata.hasBuildPlan,
      referencedProjectUris: metadata.referencedProjectUris
    };
  } catch (error) {
    if (!rawLooksLikeBuildFile) {
      return null;
    }
    return {
      uri: normalizeUri(uri),
      hasBuildPlan: /"BuildPlan"/i.test(content),
      referencedProjectUris: extractProjectMarkerUrisFromText(uri, content),
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

export function resolvePbAutoBuildBuildFiles(
  candidates: readonly PbAutoBuildBuildFileCandidate[],
  topology: WorkspaceTopology
): PbAutoBuildBuildFileInfo[] {
  const knownProjectUris = new Set<string>([
    ...topology.workspaces.map((entry) => normalizeUri(entry.uri)),
    ...topology.targets.map((entry) => normalizeUri(entry.uri)),
    ...topology.projects.map((entry) => normalizeUri(entry.uri)),
    ...topology.solutions.map((entry) => normalizeUri(entry.uri))
  ]);

  return candidates
    .map((candidate) => resolvePbAutoBuildBuildFileCandidate(candidate, knownProjectUris))
    .sort((left, right) => left.uri.localeCompare(right.uri));
}

export function summarizePbAutoBuildBuildFiles(
  buildFiles: readonly PbAutoBuildBuildFileInfo[]
): PbAutoBuildBuildFileSummary {
  return buildFiles.reduce<PbAutoBuildBuildFileSummary>(
    (summary, buildFile) => {
      summary.total++;
      if (buildFile.status === 'usable') {
        summary.usable++;
      } else if (buildFile.status === 'ambiguous') {
        summary.ambiguous++;
      } else {
        summary.invalid++;
      }
      return summary;
    },
    { total: 0, usable: 0, invalid: 0, ambiguous: 0 }
  );
}

function resolvePbAutoBuildBuildFileCandidate(
  candidate: PbAutoBuildBuildFileCandidate,
  knownProjectUris: ReadonlySet<string>
): PbAutoBuildBuildFileInfo {
  const base = clonePbAutoBuildBuildFileCandidate(candidate);

  if (base.parseError) {
    return {
      ...base,
      status: 'invalid',
      reasonCode: 'malformed-json',
      detail: `No se pudo parsear el JSON: ${base.parseError}`
    };
  }

  if (!base.hasBuildPlan) {
    return {
      ...base,
      status: 'invalid',
      reasonCode: 'missing-build-plan',
      detail: 'El JSON no declara BuildPlan.'
    };
  }

  if (base.referencedProjectUris.length === 0) {
    return {
      ...base,
      status: 'invalid',
      reasonCode: 'missing-project-reference',
      detail: 'El build file no referencia markers .pbw/.pbt/.pbproj/.pbsln.'
    };
  }

  const resolvedProjectUris = [...new Set(base.referencedProjectUris.filter((uri) => knownProjectUris.has(uri)))].sort();
  if (resolvedProjectUris.length === 1) {
    return {
      ...base,
      status: 'usable',
      representedProjectUri: resolvedProjectUris[0]
    };
  }

  if (resolvedProjectUris.length > 1) {
    return {
      ...base,
      status: 'ambiguous',
      reasonCode: 'ambiguous-project-reference',
      detail: `El build file referencia múltiples markers utilizables: ${resolvedProjectUris.join(', ')}`
    };
  }

  return {
    ...base,
    status: 'invalid',
    reasonCode: 'unresolved-project-reference',
    detail: 'El build file no referencia ningún marker conocido del workspace.'
  };
}

function looksLikePbAutoBuildBuildFileText(content: string): boolean {
  return /"BuildPlan"|"MetaInfo"|"IDEVersion"|"RuntimeVersion"|"Projects"|"ProjectBuildOptions"|\.pbw"|\.pbt"|\.pbproj"|\.pbsln"/i.test(content);
}

function collectBuildFileMetadata(
  uri: string,
  value: unknown
): { hasBuildPlan: boolean; referencedProjectUris: string[]; looksLikeBuildFile: boolean } {
  const referencedProjectUris = new Set<string>();
  let hasBuildPlan = false;
  let hintHits = 0;
  const pending: unknown[] = [value];

  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      for (const item of current) {
        pending.push(item);
      }
      continue;
    }

    if (typeof current === 'string') {
      collectProjectMarkerUris(uri, current, referencedProjectUris);
      continue;
    }

    if (!current || typeof current !== 'object') {
      continue;
    }

    for (const [key, child] of Object.entries(current)) {
      const lowerKey = key.toLowerCase();
      if (BUILD_FILE_HINT_KEYS.has(lowerKey)) {
        hintHits++;
        if (lowerKey === 'buildplan') {
          hasBuildPlan = true;
        }
      }

      if (typeof child === 'string') {
        collectProjectMarkerUris(uri, child, referencedProjectUris);
      } else {
        pending.push(child);
      }
    }
  }

  return {
    hasBuildPlan,
    referencedProjectUris: [...referencedProjectUris].sort(),
    looksLikeBuildFile: hasBuildPlan || hintHits > 0 || referencedProjectUris.size > 0
  };
}

function extractProjectMarkerUrisFromText(baseUri: string, content: string): string[] {
  const uris = new Set<string>();
  const patterns = [
    /"([^"\r\n]+\.(?:pbw|pbt|pbproj|pbsln))"/gi,
    /'([^'\r\n]+\.(?:pbw|pbt|pbproj|pbsln))'/gi
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const rawValue = match[1];
      if (!rawValue) {
        continue;
      }
      uris.add(resolveRelativeUri(baseUri, rawValue));
    }
  }

  return [...uris].sort();
}

function collectProjectMarkerUris(baseUri: string, value: string, uris: Set<string>): void {
  for (const chunk of value.split(/[;\r\n]+/)) {
    const candidate = chunk.trim().replace(/^['"]|['"]$/g, '');
    if (!candidate) {
      continue;
    }
    const lower = candidate.toLowerCase();
    if (!PROJECT_MARKER_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
      continue;
    }
    uris.add(resolveRelativeUri(baseUri, candidate));
  }
}

function resolveRelativeUri(baseUri: string, relative: string): string {
  const cleaned = relative.replace(/\\/g, '/').trim();
  if (!cleaned) {
    return '';
  }

  if (/^[a-z]+:\/\//i.test(cleaned) || /^[A-Za-z]:\//.test(cleaned)) {
    return normalizeUri(cleaned);
  }

  let base = dirname(baseUri);
  let rel = cleaned;
  while (rel.startsWith('../')) {
    base = dirname(base);
    rel = rel.substring(3);
  }
  if (rel.startsWith('./')) {
    rel = rel.substring(2);
  }
  return normalizeUri(`${base}/${rel}`);
}

function dirname(uri: string): string {
  const index = uri.lastIndexOf('/');
  return index > 0 ? uri.substring(0, index) : uri;
}