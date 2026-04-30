import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument, DocumentAnalysis } from './documentAnalysis';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { calculateHash } from '../system/hash';
import { normalizeUri } from '../system/uriUtils';

interface CachedAnalysis {
  version: number;
  analysis: DocumentAnalysis;
}

/**
 * Spec 083: la caché de análisis interactivo era ilimitada. En sesiones largas
 * con muchos archivos abiertos podía crecer indefinidamente. Aplicamos un
 * límite blando con eviction LRU. La operación es lineal en `size` cuando se
 * supera el límite, pero `MAX_CACHED_ANALYSES` se elige conservador para que
 * el coste sea negligible frente al ahorro de re-análisis.
 */
const MAX_CACHED_ANALYSES = 256;
const analysisByUri = new Map<string, CachedAnalysis>();

/**
 * Spec 102: warning opcional cuando un análisis individual supera este
 * presupuesto en milisegundos. No emite logs en producción si la variable de
 * entorno no está activa, para evitar ruido.
 */
const ANALYSIS_BUDGET_MS = 100;
const PERF_LOG_ENABLED = process.env.PB_PERF_LOG === '1';

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
  // Spec 085: normalizamos la clave para que `file:///C:/X` y `file:///c:/X`
  // compartan entrada (consistente con DocumentCache/KnowledgeBase).
  const key = normalizeUri(document.uri);
  const cached = analysisByUri.get(key);

  if (cached && cached.version === document.version) {
    // Re-insertamos para LRU (Map preserva orden de inserción).
    analysisByUri.delete(key);
    analysisByUri.set(key, cached);
    return cached.analysis;
  }

  const t0 = PERF_LOG_ENABLED ? Date.now() : 0;
  const analysis = analyzeDocument(document);
  if (PERF_LOG_ENABLED) {
    const elapsed = Date.now() - t0;
    if (elapsed > ANALYSIS_BUDGET_MS) {
      // Solo log a stderr; no alteramos el flujo del LSP.
      // eslint-disable-next-line no-console
      console.warn(`[pb-perf] analyzeDocument ${document.uri} took ${elapsed}ms`);
    }
  }

  analysisByUri.set(key, {
    version: document.version,
    analysis
  });
  // Evict LRU si se supera el tope.
  if (analysisByUri.size > MAX_CACHED_ANALYSES) {
    const firstKey = analysisByUri.keys().next().value;
    if (firstKey !== undefined) analysisByUri.delete(firstKey);
  }

  // Sincronizar con DocumentCache y KnowledgeBase para evitar doble parseo
  if (cacheBackend) {
    const hash = calculateHash(document.getText());
    cacheBackend.set(document.uri, {
      version: hash,
      facts: analysis.semanticFacts,
      symbols: [], // Los símbolos LSP se sirven directamente desde el feature
      scopes: analysis.scopes
    });
  }
  if (kbBackend) {
    kbBackend.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);
  }

  return analysis;
}

/**
 * Spec 084: invalidación en cascada. Limpiamos también las cachés downstream
 * para que un edit posterior recompute el análisis y reindexe la KB sin
 * arrastrar facts/scopes obsoletos.
 */
export function invalidateDocumentAnalysis(uri: string): void {
  const key = normalizeUri(uri);
  analysisByUri.delete(key);
  if (cacheBackend) cacheBackend.invalidate(uri);
  if (kbBackend) kbBackend.removeDocument(uri);
}

export function clearDocumentAnalysisCache(): void {
  analysisByUri.clear();
}
