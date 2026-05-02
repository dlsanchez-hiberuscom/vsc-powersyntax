import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { uriToFsPath } from './uriUtils';

export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  mtime: number;
  size: number;
}

export interface IFileSystem {
  /**
   * Obtiene información sobre un archivo o directorio.
   * Devuelve null si no existe.
   */
  stat(uri: string): Promise<FileStat | null>;

  /**
   * Lee el contenido de un directorio.
   * Devuelve una tupla con el nombre del archivo y sus estadísticas.
   */
  readDirectory(uri: string): Promise<[string, FileStat][]>;

  /**
   * Lee el contenido de un archivo en formato de texto.
   */
  readFile(uri: string): Promise<string>;

  /**
   * Crea un directorio y sus padres si no existen.
   */
  createDirectory(uri: string): Promise<void>;

  /**
   * Escribe un archivo de texto, creando su carpeta contenedora si hace falta.
   */
  writeFile(uri: string, content: string): Promise<void>;

  /**
   * Copia un archivo preservando su contenido binario.
   */
  copyFile(sourceUri: string, targetUri: string): Promise<void>;

  /**
   * Elimina un archivo o directorio si existe.
   */
  deletePath(uri: string): Promise<void>;
}

/**
 * Implementación de IFileSystem usando la API de Node.js
 */
export class NodeFileSystem implements IFileSystem {
  async stat(uri: string): Promise<FileStat | null> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) return null;

    try {
      const stats = await fs.stat(fsPath);
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: stats.mtimeMs,
        size: stats.size
      };
    } catch (e) {
      return null;
    }
  }

  async readDirectory(uri: string): Promise<[string, FileStat][]> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) return [];

    try {
      const entries = await fs.readdir(fsPath, { withFileTypes: true });
      return Promise.all(
        entries.map(async (entry) => {
          const entryUri = `${uri.replace(/\/$/, '')}/${encodeURIComponent(entry.name)}`;
          const stats = await this.stat(entryUri);
          
          if (!stats) {
            // Fallback si stat falla
            return [
              entry.name,
              {
                isFile: entry.isFile(),
                isDirectory: entry.isDirectory(),
                mtime: 0,
                size: 0
              }
            ] as [string, FileStat];
          }

          return [entry.name, stats] as [string, FileStat];
        })
      );
    } catch (e) {
      return [];
    }
  }

  async readFile(uri: string): Promise<string> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) throw new Error(`Invalid URI: ${uri}`);
    
    return fs.readFile(fsPath, 'utf8');
  }

  async createDirectory(uri: string): Promise<void> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) throw new Error(`Invalid URI: ${uri}`);

    await fs.mkdir(fsPath, { recursive: true });
  }

  async writeFile(uri: string, content: string): Promise<void> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) throw new Error(`Invalid URI: ${uri}`);

    await fs.mkdir(path.dirname(fsPath), { recursive: true });
    await fs.writeFile(fsPath, content, 'utf8');
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    const sourceFsPath = uriToFsPath(sourceUri);
    const targetFsPath = uriToFsPath(targetUri);
    if (!sourceFsPath) throw new Error(`Invalid URI: ${sourceUri}`);
    if (!targetFsPath) throw new Error(`Invalid URI: ${targetUri}`);

    await fs.mkdir(path.dirname(targetFsPath), { recursive: true });
    await fs.copyFile(sourceFsPath, targetFsPath);
  }

  async deletePath(uri: string): Promise<void> {
    const fsPath = uriToFsPath(uri);
    if (!fsPath) throw new Error(`Invalid URI: ${uri}`);

    await fs.rm(fsPath, { recursive: true, force: true });
  }
}
