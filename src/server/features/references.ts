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
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { resolveTargetEntityDetailed } from '../knowledge/resolution/semanticQueryService';
import { buildSymbolKey } from '../knowledge/symbolKey';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { EntityKind } from '../knowledge/types';
import { maskDocument } from '../parsing/codeMasking';
import { hasBlockingDynamicStringReference } from './dynamicStringReferences';
import { resolveDocumentQueryTargets, type DocumentQueryContext } from './queryContext';
import { getEventApiInvocationContext, getInvocationContext } from '../utils/invocationContext';
import { findPowerBuilderIdentifierSpan, hasPowerBuilderIdentifierBoundaries } from '../utils/pbIdentifier';

export interface ReferenceSource {
  uri: string;
  content: string;
  lines?: string[];
  maskedLines?: string[];
}

function getSourceLines(source: ReferenceSource): string[] {
  return source.lines ?? source.content.split(/\r?\n/);
}

function getMaskedLines(source: ReferenceSource): string[] {
  return source.maskedLines ?? maskDocument(source.content, { nested: true }).split(/\r?\n/);
}

function extractStringLiterals(line: string): Array<{ value: string; start: number; end: number }> {
  const literals: Array<{ value: string; start: number; end: number }> = [];
  let quote: '"' | '\'' | null = null;
  let start = -1;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (!quote && char === '/' && next === '/') {
      break;
    }

    if (!quote && (char === '"' || char === '\'')) {
      quote = char;
      start = index;
      continue;
    }

    if (quote && char === quote) {
      literals.push({ value: line.slice(start + 1, index), start, end: index });
      quote = null;
      start = -1;
    }
  }

  return literals;
}

function getWordAt(document: TextDocument, position: Position): string | null {
  const text = document.getText();
  const offset = document.offsetAt(position);
  return findPowerBuilderIdentifierSpan(text, offset)?.word ?? null;
}

function buildResolvedFamilyKeys(targets: ReadonlyArray<Parameters<typeof buildSymbolKey>[0]>): Set<string> {
  const keys = new Set<string>();
  for (const target of targets) {
    keys.add(buildSymbolKey(target));
  }
  return keys;
}

function matchesResolvedFamily(
  lines: string[],
  uri: string,
  line: number,
  character: number,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  targetKeys: ReadonlySet<string>
): boolean {
  if (targetKeys.size === 0) {
    return true;
  }

  const context = getEventApiInvocationContext(lines, Position.create(line, character))
    ?? getInvocationContext(lines, Position.create(line, character));
  if (!context) {
    return false;
  }

  const resolved = resolveTargetEntityDetailed(context, uri, kb, graph, { line });
  return resolved.targets.some((target) => targetKeys.has(buildSymbolKey(target)));
}

export function provideReferences(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  sources: Iterable<ReferenceSource>,
  options: { includeDeclaration?: boolean } = { includeDeclaration: true },
  hotContext?: HotContextCache,
  queryContext?: DocumentQueryContext
): Location[] {
  const resolved = queryContext?.resolvedTargets ?? resolveDocumentQueryTargets(document, position, kb, graph, hotContext, 'references');
  const word = queryContext?.context?.identifier ?? resolved?.context.identifier ?? getWordAt(document, position);
  if (!word) return [];
  const wordLower = word.toLowerCase();
  const result: Location[] = [];
  const defs = resolved?.targets.length ? resolved.targets : kb.findAllDefinitions(wordLower);
  const targetKeys = buildResolvedFamilyKeys(defs);
  const allowEventLiteralReferences = defs.some((def) => def.kind === EntityKind.Event);
  const hasExternalDependencyTargets = defs.some((def) => def.isExternal);
  const blockingDynamicHit = allowEventLiteralReferences ? false : hasBlockingDynamicStringReference(word, sources);

  // 1. Definiciones desde la KB
  if (options.includeDeclaration !== false) {
    for (const e of defs) {
      result.push(
        Location.create(e.uri, {
          start: Position.create(e.line, e.character),
          end: Position.create(e.line, e.character + e.name.length)
        })
      );
    }

    if (blockingDynamicHit) {
      return dedupeLocations(result);
    }

    if (hasExternalDependencyTargets) {
      return dedupeLocations(result);
    }
  }

  // 2. Ocurrencias textuales en sources
  const re = new RegExp(escapeRegExp(word), 'gi');
  for (const src of sources) {
    const lines = getSourceLines(src);
    const maskedLines = getMaskedLines(src);
    for (let i = 0; i < lines.length; i++) {
      const scan = maskedLines[i] ?? '';
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(scan)) !== null) {
        if (!hasPowerBuilderIdentifierBoundaries(scan, m.index, m.index + m[0].length)) {
          continue;
        }
        if (!matchesResolvedFamily(lines, src.uri, i, m.index, kb, graph, targetKeys)) {
          continue;
        }
        const start = Position.create(i, m.index);
        const end = Position.create(i, m.index + m[0].length);
        result.push(Location.create(src.uri, Range.create(start, end)));
      }

      if (!allowEventLiteralReferences) {
        continue;
      }

      for (const literal of extractStringLiterals(lines[i] ?? '')) {
        if (literal.value.toLowerCase() !== wordLower) {
          continue;
        }

        const literalStart = literal.start + 1;
        if (!matchesResolvedFamily(lines, src.uri, i, literalStart, kb, graph, targetKeys)) {
          continue;
        }

        const start = Position.create(i, literalStart);
        const end = Position.create(i, literalStart + literal.value.length);
        result.push(Location.create(src.uri, Range.create(start, end)));
      }
    }
  }

  // Deduplicar por uri+line+char
  return dedupeLocations(result);
}

function dedupeLocations(result: Location[]): Location[] {
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
export const _internals = { getWordAt };
