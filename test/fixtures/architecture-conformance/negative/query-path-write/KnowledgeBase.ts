// @ts-nocheck
export class KnowledgeBaseProbe {
  constructor() {
    this.publishedState = { scopeIndex: new Map() };
  }

  getScopeAtReadonly() {
    this.publishedState.scopeIndex.set('file:///probe.sru', []);
    return null;
  }
}