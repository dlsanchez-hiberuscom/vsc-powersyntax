import type { ApiSemanticWorkspaceManifestObject } from '../../shared/publicApi';

export function inferPowerBuilderObjectKindFromUri(uri: string): ApiSemanticWorkspaceManifestObject['objectKind'] {
  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith('.sra')) return 'application';
  if (normalizedUri.endsWith('.srw')) return 'window';
  if (normalizedUri.endsWith('.sru')) return 'userobject';
  if (normalizedUri.endsWith('.srm')) return 'menu';
  if (normalizedUri.endsWith('.srd')) return 'datawindow';
  if (normalizedUri.endsWith('.srf')) return 'function';
  if (normalizedUri.endsWith('.srs')) return 'structure';
  if (normalizedUri.endsWith('.srp')) return 'pipeline';
  if (normalizedUri.endsWith('.srq')) return 'query';
  return 'unknown';
}