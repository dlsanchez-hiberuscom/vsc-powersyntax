export const POWERBUILDER_SOURCE_EXTENSIONS = [
  '.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srq'
] as const;

export const POWERBUILDER_SEMANTIC_EXTENSIONS = [
  ...POWERBUILDER_SOURCE_EXTENSIONS,
  '.srj'
] as const;

export const POWERBUILDER_PROJECT_MARKER_EXTENSIONS = [
  '.pbw', '.pbt', '.pbproj', '.pbsln'
] as const;

export const POWERBUILDER_BUILD_SUPPORT_EXTENSIONS = [
  '.pbg'
] as const;

export const POWERBUILDER_RESOURCE_EXTENSIONS = [
  '.pbr'
] as const;

export const POWERBUILDER_REPORT_EXTENSIONS = [
  '.psr'
] as const;

export const POWERBUILDER_SOURCE_GLOB = '**/*.{sru,srw,srm,sra,srs,srf,srd,srp,srq}';

export const POWERBUILDER_PROJECT_MARKER_GLOB = '**/*.{pbw,pbt,pbproj,pbsln}';
export const PBAUTOBUILD_BUILD_FILE_GLOB = '**/*.json';

export type PowerBuilderArtifactKind =
  | 'source'
  | 'semantic-only'
  | 'project-marker'
  | 'library-binary'
  | 'build-support'
  | 'resource'
  | 'report';

function normalizePowerBuilderUriCandidate(uri: string): string {
  return uri.split('?')[0].split('#')[0].toLowerCase();
}

export function getPowerBuilderArtifactKind(uri: string): PowerBuilderArtifactKind | undefined {
  const candidate = normalizePowerBuilderUriCandidate(uri);

  if (POWERBUILDER_SOURCE_EXTENSIONS.some((extension) => candidate.endsWith(extension))) {
    return 'source';
  }

  if (candidate.endsWith('.srj')) {
    return 'semantic-only';
  }

  if (POWERBUILDER_PROJECT_MARKER_EXTENSIONS.some((extension) => candidate.endsWith(extension))) {
    return 'project-marker';
  }

  if (candidate.endsWith('.pbl')) {
    return 'library-binary';
  }

  if (POWERBUILDER_BUILD_SUPPORT_EXTENSIONS.some((extension) => candidate.endsWith(extension))) {
    return 'build-support';
  }

  if (POWERBUILDER_RESOURCE_EXTENSIONS.some((extension) => candidate.endsWith(extension))) {
    return 'resource';
  }

  if (POWERBUILDER_REPORT_EXTENSIONS.some((extension) => candidate.endsWith(extension))) {
    return 'report';
  }

  return undefined;
}

export function isPowerBuilderSourceUri(uri: string): boolean {
  return getPowerBuilderArtifactKind(uri) === 'source';
}

export function isPowerBuilderSemanticUri(uri: string): boolean {
  const kind = getPowerBuilderArtifactKind(uri);
  return kind === 'source' || kind === 'semantic-only';
}

export function isPowerBuilderProjectMarkerUri(uri: string): boolean {
  return getPowerBuilderArtifactKind(uri) === 'project-marker';
}

export function isPbAutoBuildBuildFileCandidateUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return candidate.endsWith('.json');
}