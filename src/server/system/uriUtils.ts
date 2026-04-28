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
  return uri.toLowerCase();
}
