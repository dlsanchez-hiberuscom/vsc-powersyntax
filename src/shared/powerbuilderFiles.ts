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

export const POWERBUILDER_SOURCE_GLOB = '**/*.{sru,srw,srm,sra,srs,srf,srd,srp,srq}';

export const POWERBUILDER_PROJECT_MARKER_GLOB = '**/*.{pbw,pbt,pbproj,pbsln}';
export const PBAUTOBUILD_BUILD_FILE_GLOB = '**/*.json';

export function isPowerBuilderSourceUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return POWERBUILDER_SOURCE_EXTENSIONS.some((extension) => candidate.endsWith(extension));
}

export function isPowerBuilderSemanticUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return POWERBUILDER_SEMANTIC_EXTENSIONS.some((extension) => candidate.endsWith(extension));
}

export function isPowerBuilderProjectMarkerUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return POWERBUILDER_PROJECT_MARKER_EXTENSIONS.some((extension) => candidate.endsWith(extension));
}

export function isPbAutoBuildBuildFileCandidateUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return candidate.endsWith('.json');
}