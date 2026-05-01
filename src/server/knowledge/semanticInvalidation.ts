import { normalizeUri } from '../system/uriUtils';

export interface SemanticDependencySource {
  getDependentDocumentsForUri(uri: string): string[];
}

export interface SemanticInvalidationPlan {
  sourceUri: string;
  directlyImpactedUris: string[];
  transitivelyImpactedUris: string[];
  allUris: string[];
}

export function createSemanticInvalidationPlan(
  sourceUri: string,
  dependencies: SemanticDependencySource
): SemanticInvalidationPlan {
  const source = normalizeUri(sourceUri);
  const visited = new Set<string>([source]);
  const queue = dependencies.getDependentDocumentsForUri(source);
  const directlyImpactedUris: string[] = [];
  const transitivelyImpactedUris: string[] = [];

  for (const uri of queue) {
    const normalized = normalizeUri(uri);
    if (visited.has(normalized)) continue;
    visited.add(normalized);
    directlyImpactedUris.push(normalized);
  }

  for (let index = 0; index < queue.length; index++) {
    const current = normalizeUri(queue[index]!);
    for (const next of dependencies.getDependentDocumentsForUri(current)) {
      const normalized = normalizeUri(next);
      if (visited.has(normalized)) continue;
      visited.add(normalized);
      queue.push(normalized);
      transitivelyImpactedUris.push(normalized);
    }
  }

  return {
    sourceUri: source,
    directlyImpactedUris: directlyImpactedUris.sort(),
    transitivelyImpactedUris: transitivelyImpactedUris.sort(),
    allUris: [source, ...directlyImpactedUris, ...transitivelyImpactedUris]
  };
}