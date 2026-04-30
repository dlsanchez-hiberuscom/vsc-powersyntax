/**
 * Parser tolerante de la topología de workspace y solution PowerBuilder 2025.
 *
 * No intenta replicar el parser binario oficial del IDE; extrae los tokens
 * relevantes mediante heurísticas léxicas suficientes para el modelo del
 * plugin: nombres de targets/proyectos y librerías referenciadas.
 *
 * @module workspace/topology
 */

import { normalizeUri } from '../system/uriUtils';

export interface TargetInfo {
  /** URI del archivo `.pbt`. */
  uri: string;
  /** Nombre derivado del basename, sin extensión. */
  name: string;
  /** URIs (resueltos lo mejor posible) de las `.pbl` referenciadas. */
  libraries: string[];
}

export interface ProjectInfo {
  /** URI del archivo `.pbproj`. */
  uri: string;
  name: string;
  libraries: string[];
}

export interface SolutionInfo {
  /** URI del archivo `.pbsln`. */
  uri: string;
  /** URIs de los `.pbproj` referenciados. */
  projects: string[];
}

export interface WorkspaceFile {
  /** URI del archivo `.pbw`. */
  uri: string;
  name: string;
  /** URIs de targets referenciados (tanto `.pbt` como `.pbproj`). */
  targets: string[];
}

export interface WorkspaceTopology {
  workspaces: WorkspaceFile[];
  targets: TargetInfo[];
  projects: ProjectInfo[];
  solutions: SolutionInfo[];
}

export function emptyTopology(): WorkspaceTopology {
  return { workspaces: [], targets: [], projects: [], solutions: [] };
}

/** Tokens entre comillas, espacios o saltos de línea. */
const TOKEN_REGEX = /["'<>]?([^"'<>\s,;]+)["'<>]?/g;

function basenameNoExt(uri: string): string {
  const last = uri.substring(uri.lastIndexOf('/') + 1);
  const dot = last.lastIndexOf('.');
  return dot > 0 ? last.substring(0, dot) : last;
}

function dirname(uri: string): string {
  const i = uri.lastIndexOf('/');
  return i > 0 ? uri.substring(0, i) : uri;
}

function resolveRelative(baseUri: string, relative: string): string {
  // Normalizamos separadores Windows.
  const cleaned = relative.replace(/\\/g, '/').trim();
  if (!cleaned) return '';

  // Si ya es absoluto (incluye esquema o drive) lo dejamos como está,
  // simplemente lo normalizamos.
  if (/^[a-z]+:\/\//i.test(cleaned) || /^[A-Za-z]:\//.test(cleaned)) {
    return normalizeUri(cleaned);
  }

  // Resolución relativa simple: combina dirname con el segmento.
  let base = dirname(baseUri);
  let rel = cleaned;
  while (rel.startsWith('../')) {
    base = dirname(base);
    rel = rel.substring(3);
  }
  if (rel.startsWith('./')) rel = rel.substring(2);
  return normalizeUri(`${base}/${rel}`);
}

function extractTokensWithExt(content: string, exts: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  const lower = exts.map((e) => e.toLowerCase());

  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(content)) !== null) {
    const token = match[1];
    if (!token) continue;
    const tl = token.toLowerCase();
    if (lower.some((e) => tl.endsWith(e))) {
      if (!seen.has(tl)) {
        seen.add(tl);
        result.push(token);
      }
    }
  }
  return result;
}

/**
 * Parsea el contenido del archivo de topología según su extensión y
 * devuelve la información estructurada correspondiente.
 *
 * Devuelve `null` si la extensión no está soportada.
 */
export function parseTopology(
  uri: string,
  content: string
):
  | { kind: 'workspace'; data: WorkspaceFile }
  | { kind: 'target'; data: TargetInfo }
  | { kind: 'project'; data: ProjectInfo }
  | { kind: 'solution'; data: SolutionInfo }
  | null {
  const lower = uri.toLowerCase();
  const name = basenameNoExt(uri);

  if (lower.endsWith('.pbw')) {
    const targets = extractTokensWithExt(content, ['.pbt', '.pbproj']).map((t) =>
      resolveRelative(uri, t)
    );
    return { kind: 'workspace', data: { uri: normalizeUri(uri), name, targets } };
  }

  if (lower.endsWith('.pbt')) {
    const libraries = extractTokensWithExt(content, ['.pbl']).map((t) =>
      resolveRelative(uri, t)
    );
    return { kind: 'target', data: { uri: normalizeUri(uri), name, libraries } };
  }

  if (lower.endsWith('.pbsln')) {
    const projects = extractTokensWithExt(content, ['.pbproj']).map((t) =>
      resolveRelative(uri, t)
    );
    return { kind: 'solution', data: { uri: normalizeUri(uri), projects } };
  }

  if (lower.endsWith('.pbproj')) {
    const libraries = extractTokensWithExt(content, ['.pbl']).map((t) =>
      resolveRelative(uri, t)
    );
    return { kind: 'project', data: { uri: normalizeUri(uri), name, libraries } };
  }

  return null;
}
