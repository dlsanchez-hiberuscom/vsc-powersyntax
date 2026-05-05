import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { clearDocumentAnalysisCache, getDocumentAnalysis, invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

export type HotPathSpyStats = {
  fsCalls: number;
  analyzeCalls: number;
};

export type HotPathSpyResult<T> = {
  result: T;
  stats: HotPathSpyStats;
};

export type HotPathHarness = {
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  warmDocument: (document: TextDocument) => ReturnType<typeof analyzeDocument>;
};

export function createHotPathHarness(): HotPathHarness {
  const kb = new KnowledgeBase();
  const graph = new InheritanceGraph(kb);
  const systemCatalog = new SystemCatalog();

  return {
    kb,
    graph,
    systemCatalog,
    warmDocument(document: TextDocument) {
      const analysis = analyzeDocument(document);
      kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
      invalidateDocumentAnalysis(document.uri);
      getDocumentAnalysis(document);
      return analysis;
    },
  };
}

export function createHotPathDocument(uri: string, languageId: string, source: string, version = 1): TextDocument {
  return TextDocument.create(uri, languageId, version, source);
}

export function resetHotPathAnalysisCache(): void {
  clearDocumentAnalysisCache();
}

export function withHotPathSpies<T>(exercise: () => T): HotPathSpyResult<T> {
  const nodeFs = require('node:fs') as typeof import('node:fs');
  const documentAnalysisModule = require('../../../src/server/analysis/documentAnalysis') as typeof import('../../../src/server/analysis/documentAnalysis');
  const originalReadFileSync = nodeFs.readFileSync;
  const originalReaddirSync = nodeFs.readdirSync;
  const originalAnalyzeDocument = documentAnalysisModule.analyzeDocument;
  const stats: HotPathSpyStats = { fsCalls: 0, analyzeCalls: 0 };

  nodeFs.readFileSync = ((...args: Parameters<typeof nodeFs.readFileSync>) => {
    stats.fsCalls++;
    return originalReadFileSync(...args);
  }) as typeof nodeFs.readFileSync;
  nodeFs.readdirSync = ((...args: Parameters<typeof nodeFs.readdirSync>) => {
    stats.fsCalls++;
    return originalReaddirSync(...args);
  }) as typeof nodeFs.readdirSync;
  documentAnalysisModule.analyzeDocument = ((...args: Parameters<typeof originalAnalyzeDocument>) => {
    stats.analyzeCalls++;
    return originalAnalyzeDocument(...args);
  }) as typeof documentAnalysisModule.analyzeDocument;

  try {
    return { result: exercise(), stats };
  } finally {
    nodeFs.readFileSync = originalReadFileSync;
    nodeFs.readdirSync = originalReaddirSync;
    documentAnalysisModule.analyzeDocument = originalAnalyzeDocument;
  }
}

export function assertNoHotPathSideEffects(stats: HotPathSpyStats): void {
  assert.equal(stats.fsCalls, 0, 'El hot path no debe hacer IO de filesystem.');
  assert.equal(stats.analyzeCalls, 0, 'El hot path no debe forzar full parse con snapshot/cache caliente.');
}