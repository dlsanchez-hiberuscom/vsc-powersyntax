import { URI } from 'vscode-uri';

/**
 * Convierte un URI de archivo (file:///) en una ruta del sistema operativo.
 */
export function uriToFsPath(uri: string): string {
  try {
    return URI.parse(uri).fsPath;
  } catch (e) {
    return '';
  }
}

/**
 * Convierte una ruta del sistema operativo en un URI de archivo (file:///).
 */
export function fsPathToUri(fsPath: string): string {
  return URI.file(fsPath).toString();
}

/**
 * Extrae el nombre base de un URI o path.
 */
export function getBasename(pathOrUri: string): string {
  const parts = pathOrUri.split(/[\\/]/);
  return parts[parts.length - 1] || '';
}

/**
 * Normaliza un URI para comparaciones (especialmente en Windows donde las rutas son case-insensitive).
 */
export function normalizeUri(uri: string): string {
  const raw = uri.trim();
  if (!raw) {
    return raw;
  }

  try {
    const parsed = URI.parse(raw);
    const authority = parsed.authority.toLowerCase();
    const path = parsed.path
      .split('/')
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      })
      .join('/');
    const query = parsed.query ? `?${parsed.query}` : '';
    const fragment = parsed.fragment ? `#${parsed.fragment}` : '';

    if (parsed.scheme) {
      const authorityPart = authority || parsed.scheme.toLowerCase() === 'file' ? `//${authority}` : '';
      return `${parsed.scheme.toLowerCase()}:${authorityPart}${path}${query}${fragment}`.toLowerCase();
    }
  } catch {
    // Fallback conservador para URIs parciales o paths sueltos usados en tests.
  }

  return raw.replace(/%20/gi, ' ').replace(/\\/g, '/').toLowerCase();
}
