/**
 * Public API surface (Spec 054 / B109).
 *
 * @module shared/publicApi
 */

export const PUBLIC_API_VERSION = '0.1.0';

export interface ApiSymbol {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
}

export interface ApiQuerySymbolsRequest {
  query: string;
  limit?: number;
}

export interface ApiCatalogReport {
  total: number;
  duplicates: number;
  missingSignatures: number;
}

/**
 * Spec 128: estadísticas globales del servidor expuestas como contrato
 * estable. Los campos son opcionales para permitir extensiones sin romper
 * compatibilidad de minor.
 */
export interface ApiServerStats {
  kb?: {
    totalEntities?: number;
    totalScopes?: number;
    indexedScopes?: number;
    version?: number;
  };
  scheduler?: {
    pendingNear?: number;
    pendingBackground?: number;
    interactiveBusy?: boolean;
  };
  workspace?: {
    mode?: string;
    files?: number;
  };
  caches?: {
    analysis?: { size?: number; capacity?: number };
    serving?: { size?: number; capacity?: number };
    documents?: { size?: number };
    hotContext?: { inheritedTypes?: number; capacity?: number };
  };
}

/**
 * Spec 129: información mínima de un proyecto detectado.
 */
export interface ApiProjectInfo {
  id: string;
  name?: string;
  pbtUri?: string;
  pbwUri?: string;
  fileCount: number;
}

/**
 * Spec 130: árbol agregado de diagnósticos por archivo.
 */
export interface ApiDiagnosticsTreeNode {
  uri: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
}

/**
 * Compatibilidad mayor.
 *
 * Mismo MAJOR ⇒ compatible. MAJOR distinto ⇒ no compatible.
 */
export function isApiVersionCompatible(requested: string): boolean {
  const parts = requested.split('.');
  if (parts.length < 1) return false;
  const reqMajor = Number.parseInt(parts[0] ?? '', 10);
  const ourMajor = Number.parseInt(PUBLIC_API_VERSION.split('.')[0] ?? '', 10);
  if (Number.isNaN(reqMajor) || Number.isNaN(ourMajor)) return false;
  return reqMajor === ourMajor;
}

