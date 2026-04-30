/**
 * Find references (Spec 025 / B023).
 *
 * Implementación pragmática inicial:
 *   1. Obtiene el identificador bajo el cursor.
 *   2. Devuelve las definiciones de la KB cuyo nombre coincida (case-insensitive).
 *   3. Añade ocurrencias textuales con `\b<id>\b` en los `sources` provistos.
 *
 * No filtra por visibility/herencia: prioridad cero falsos negativos.
 *
 * @module features/references
 */

import { Location, Position, Range } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';

export interface ReferenceSource {
  uri: string;
  content: string;
}

const IDENT_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

function getWordAt(document: TextDocument, position: Position): string | null {
  const text = document.getText();
  const offset = document.offsetAt(position);
  // Buscar inicio de palabra
  let start = offset;
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start--;
  let end = offset;
  while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) end++;
  if (start === end) return null;
  const word = text.slice(start, end);
  if (!/^[A-Za-z_]/.test(word)) return null;
  return word;
}

export function provideReferences(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  sources: Iterable<ReferenceSource>,
  options: { includeDeclaration?: boolean } = { includeDeclaration: true }
): Location[] {
  const word = getWordAt(document, position);
  if (!word) return [];
  const wordLower = word.toLowerCase();
  const result: Location[] = [];

  // 1. Definiciones desde la KB
  if (options.includeDeclaration !== false) {
    const defs = kb.findAllDefinitions(wordLower);
    for (const e of defs) {
      result.push(
        Location.create(e.uri, {
          start: Position.create(e.line, e.character),
          end: Position.create(e.line, e.character + e.name.length)
        })
      );
    }
  }

  // 2. Ocurrencias textuales en sources
  const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
  for (const src of sources) {
    const lines = src.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Saltar comentarios de línea simples (`//`).
      const commentIdx = line.indexOf('//');
      const scan = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(scan)) !== null) {
        const start = Position.create(i, m.index);
        const end = Position.create(i, m.index + m[0].length);
        result.push(Location.create(src.uri, Range.create(start, end)));
      }
    }
  }

  // Deduplicar por uri+line+char
  const seen = new Set<string>();
  return result.filter((loc) => {
    const key = `${loc.uri}#${loc.range.start.line}:${loc.range.start.character}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Re-export helper para tests si fuera necesario.
export const _internals = { getWordAt, IDENT_RE };
