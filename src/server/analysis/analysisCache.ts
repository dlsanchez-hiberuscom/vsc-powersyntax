import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument, DocumentAnalysis } from './documentAnalysis';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { calculateHash } from '../system/hash';

interface CachedAnalysis {
  version: number;
  analysis: DocumentAnalysis;
}

const analysisByUri = new Map<string, CachedAnalysis>();

/**
 * Backend unificado: si está configurado, los resultados del análisis interactivo
 * se propagan a DocumentCache y KnowledgeBase para evitar doble parseo con el indexador.
 */
let cacheBackend: DocumentCache | null = null;
let kbBackend: KnowledgeBase | null = null;

/**
 * Conecta la caché de análisis interactivo con el DocumentCache y KnowledgeBase globales.
 * Debe llamarse durante el bootstrap del servidor.
 */
export function setAnalysisBackends(cache: DocumentCache, kb: KnowledgeBase): void {
  cacheBackend = cache;
  kbBackend = kb;
}

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

  // Sincronizar con DocumentCache y KnowledgeBase para evitar doble parseo
  if (cacheBackend) {
    const hash = calculateHash(document.getText());
    cacheBackend.set(document.uri, {
      version: hash,
      facts: analysis.semanticFacts,
      symbols: [] // Los símbolos LSP se sirven directamente desde el feature
    });
  }
  if (kbBackend) {
    kbBackend.upsertDocument(document.uri, analysis.semanticFacts);
  }

  return analysis;
}

export function invalidateDocumentAnalysis(uri: string): void {
  analysisByUri.delete(uri);
}

export function clearDocumentAnalysisCache(): void {
  analysisByUri.clear();
}
