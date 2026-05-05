/**
 * SQL embedded regions (Spec 041 / B090).
 *
 * Detecta regiones de SQL embebido en PowerScript. Heurística:
 * una línea que comienza por un statement SQL embebido conocido
 * abre la región; el `;` final la cierra.
 *
 * @module parsing/sqlRegions
 */

import { maskDocument } from './codeMasking';

export interface SqlRegion {
  startLine: number;
  endLine: number;
  keyword:
    | 'SELECT'
    | 'UPDATE'
    | 'INSERT'
    | 'DELETE'
    | 'EXECUTE'
    | 'CONNECT'
    | 'DECLARE'
    | 'FETCH'
    | 'OPEN'
    | 'CLOSE'
    | 'PREPARE'
    | 'COMMIT'
    | 'ROLLBACK';
}

const RE_START = /^\s*(SELECT|UPDATE|INSERT|DELETE|EXECUTE|CONNECT|DECLARE|FETCH|OPEN|CLOSE|PREPARE|COMMIT|ROLLBACK)\b(?!\s*\()/i;

export function findSqlRegions(content: string): SqlRegion[] {
  const masked = maskDocument(content).split(/\r?\n/);
  const regions: SqlRegion[] = [];
  for (let i = 0; i < masked.length; i++) {
    const m = RE_START.exec(masked[i]);
    if (!m) continue;
    const keyword = m[1].toUpperCase() as SqlRegion['keyword'];
    let end = i;
    for (let j = i; j < masked.length; j++) {
      if (masked[j].includes(';')) { end = j; break; }
      end = j;
    }
    regions.push({ startLine: i, endLine: end, keyword });
    i = end;
  }
  return regions;
}
