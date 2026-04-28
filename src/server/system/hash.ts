import * as crypto from 'crypto';

/**
 * Calcula un hash rápido MD5 del contenido de un archivo para la caché.
 */
export function calculateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}
