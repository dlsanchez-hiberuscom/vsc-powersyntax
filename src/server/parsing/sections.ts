import {
  DocumentSymbol,
  SymbolKind
} from 'vscode-languageserver/node';

import { SectionRange } from '../model/types';
import {
  matchEventPrototype,
  matchFunctionPrototype,
  matchTypeDefinition,
  matchVariableDeclaration
} from './matchers';
import {
  createSymbol,
  eventSelectionStart,
  findBlockEnd,
  firstNonWhitespace
} from '../utils/helpers';

export function findSections(lines: string[]): SectionRange[] {
  const sections: SectionRange[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      /^\s*forward\s+prototypes\b/i.test(line) ||
      /^\s*prototypes\b/i.test(line)
    ) {
      const endLine = findBlockEnd(lines, i, [/^\s*end\s+prototypes\b/i]);
      sections.push({
        kind: 'prototypes',
        startLine: i,
        endLine
      });
      i = endLine;
      continue;
    }

    if (/^\s*(?:global\s+variables|type\s+variables|variables)\b/i.test(line)) {
      const endLine = findBlockEnd(lines, i, [/^\s*end\s+variables\b/i]);
      sections.push({
        kind: 'variables',
        startLine: i,
        endLine
      });
      i = endLine;
      continue;
    }

    if (
      /^\s*forward\b/i.test(line) &&
      !/^\s*forward\s+prototypes\b/i.test(line)
    ) {
      const endLine = findBlockEnd(lines, i, [/^\s*end\s+forward\b/i]);
      sections.push({
        kind: 'forward',
        startLine: i,
        endLine
      });
      i = endLine;
      continue;
    }
  }

  return sections;
}

export function createSectionSymbol(
  lines: string[],
  section: SectionRange
): DocumentSymbol {
  const title =
    section.kind === 'forward'
      ? 'forward'
      : section.kind === 'prototypes'
        ? 'prototypes'
        : 'variables';

  const symbol = createSymbol(
    title,
    SymbolKind.Namespace,
    section.startLine,
    firstNonWhitespace(lines[section.startLine]),
    section.endLine,
    lines[section.endLine]?.length ?? 0,
    'section'
  );

  symbol.children = extractSectionChildren(lines, section);
  return symbol;
}

export function extractSectionChildren(
  lines: string[],
  section: SectionRange
): DocumentSymbol[] {
  const children: DocumentSymbol[] = [];

  for (let i = section.startLine + 1; i < section.endLine; i++) {
    const line = lines[i];

    if (section.kind === 'variables') {
      const varDecl = matchVariableDeclaration(line);
      if (varDecl) {
        children.push(
          createSymbol(
            varDecl.name,
            SymbolKind.Variable,
            i,
            line.indexOf(varDecl.name),
            i,
            line.length,
            `${varDecl.type}${varDecl.modifiers ? ` (${varDecl.modifiers})` : ''}`
          )
        );
      }
      continue;
    }

    if (section.kind === 'prototypes') {
      const fn = matchFunctionPrototype(line);
      if (fn) {
        children.push(
          createSymbol(
            fn.name,
            SymbolKind.Function,
            i,
            line.indexOf(fn.name),
            i,
            line.length,
            fn.kind === 'function'
              ? `declaration-only · function : ${fn.returnType}`
              : 'declaration-only · subroutine'
          )
        );
        continue;
      }

      const ev = matchEventPrototype(line);
      if (ev) {
        const start = eventSelectionStart(line, ev.name);
        children.push(
          createSymbol(
            ev.name,
            SymbolKind.Event,
            i,
            start,
            i,
            line.length,
            `declaration-only · ${ev.detail}`
          )
        );
        continue;
      }
    }

    if (section.kind === 'forward') {
      const ty = matchTypeDefinition(line);
      if (ty) {
        children.push(
          createSymbol(
            ty.name,
            SymbolKind.Class,
            i,
            line.indexOf(ty.name),
            i,
            line.length,
            ty.container
              ? `declaration-only · type from ${ty.ancestor} within ${ty.container}`
              : `declaration-only · type from ${ty.ancestor}`
          )
        );
      }
    }
  }

  children.sort((a, b) => a.range.start.line - b.range.start.line);
  return children;
}

export function findEnclosingSection(
  line: number,
  sections: SectionRange[]
): SectionRange | undefined {
  return sections.find(
    (section) => line > section.startLine && line < section.endLine
  );
}