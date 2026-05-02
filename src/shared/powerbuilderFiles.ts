export const POWERBUILDER_SOURCE_EXTENSIONS = [
  '.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq'
] as const;

export const POWERBUILDER_PROJECT_MARKER_EXTENSIONS = [
  '.pbw', '.pbt', '.pbproj', '.pbsln'
] as const;

export const POWERBUILDER_SOURCE_GLOB = '**/*.{sru,srw,srm,sra,srs,srf,srd,srp,srj,srq}';

export const POWERBUILDER_PROJECT_MARKER_GLOB = '**/*.{pbw,pbt,pbproj,pbsln}';

export function isPowerBuilderSourceUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return POWERBUILDER_SOURCE_EXTENSIONS.some((extension) => candidate.endsWith(extension));
}

export function isPowerBuilderProjectMarkerUri(uri: string): boolean {
  const candidate = uri.split('?')[0].split('#')[0].toLowerCase();
  return POWERBUILDER_PROJECT_MARKER_EXTENSIONS.some((extension) => candidate.endsWith(extension));
}