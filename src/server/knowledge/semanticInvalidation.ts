import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { normalizeUri } from '../system/uriUtils';
import { diffSemanticSnapshots } from './semanticDiff';

export interface SemanticDependencySource {
  getDependentDocumentsForUri(uri: string): string[];
}

export interface SemanticInvalidationPlan {
  sourceUri: string;
  directlyImpactedUris: string[];
  transitivelyImpactedUris: string[];
  allUris: string[];
}

export function createDocumentOnlyInvalidationPlan(sourceUri: string): SemanticInvalidationPlan {
  const source = normalizeUri(sourceUri);
  return {
    sourceUri: source,
    directlyImpactedUris: [],
    transitivelyImpactedUris: [],
    allUris: [source]
  };
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

export function mergeSemanticInvalidationPlans(
  sourceUri: string,
  ...plans: SemanticInvalidationPlan[]
): SemanticInvalidationPlan {
  const source = normalizeUri(sourceUri);
  const direct = new Set<string>();
  const transitive = new Set<string>();

  for (const plan of plans) {
    for (const uri of plan.directlyImpactedUris) {
      const normalized = normalizeUri(uri);
      if (normalized !== source) {
        direct.add(normalized);
      }
    }
    for (const uri of plan.transitivelyImpactedUris) {
      const normalized = normalizeUri(uri);
      if (normalized !== source) {
        transitive.add(normalized);
      }
    }
  }

  const directlyImpactedUris = [...direct].sort();
  const transitivelyImpactedUris = [...transitive].filter((uri) => !direct.has(uri)).sort();

  return {
    sourceUri: source,
    directlyImpactedUris,
    transitivelyImpactedUris,
    allUris: [source, ...directlyImpactedUris, ...transitivelyImpactedUris]
  };
}

export function createSnapshotAwareInvalidationPlan(
  sourceUri: string,
  previousSnapshot: SemanticDocumentSnapshot | undefined,
  nextSnapshot: SemanticDocumentSnapshot | undefined,
  previousPlan: SemanticInvalidationPlan,
  nextPlan: SemanticInvalidationPlan
): SemanticInvalidationPlan {
  const diff = diffSemanticSnapshots(previousSnapshot, nextSnapshot);
  if (!diff.changed) {
    return createDocumentOnlyInvalidationPlan(sourceUri);
  }

  return mergeSemanticInvalidationPlans(sourceUri, previousPlan, nextPlan);
}