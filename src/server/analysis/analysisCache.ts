import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument, DocumentAnalysis } from './documentAnalysis';

interface CachedAnalysis {
  version: number;
  analysis: DocumentAnalysis;
}

const analysisByUri = new Map<string, CachedAnalysis>();

export function getDocumentAnalysis(document: TextDocument): DocumentAnalysis {
  const cached = analysisByUri.get(document.uri);

  if (cached && cached.version === document.version) {
    return cached.analysis;
  }

  const analysis = analyzeDocument(document);
  analysisByUri.set(document.uri, {
    version: document.version,
    analysis
  });

  return analysis;
}

export function invalidateDocumentAnalysis(uri: string): void {
  analysisByUri.delete(uri);
}

export function clearDocumentAnalysisCache(): void {
  analysisByUri.clear();
}
