// @ts-nocheck
export class ParallelSemanticStore {
  publishedState = new Map();
  semanticEpoch = 0;
  documentSnapshots = new Map();
  entitiesByUri = new Map();
}