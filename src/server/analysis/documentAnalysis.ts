import { TextDocument } from 'vscode-languageserver-textdocument';

import { SymbolFact, SectionRange } from '../model/types';
import { findEnclosingSection, findSections } from '../parsing/sections';
import {
  matchEventImplementationHeader,
  matchEventPrototype,
  matchFunctionImplementationHeader,
  matchFunctionPrototype,
  matchOnImplementationHeader,
  matchTypeDefinition,
  matchVariableDeclaration
} from '../parsing/matchers';
import { eventSelectionStart, firstNonWhitespace } from '../utils/helpers';

export interface DocumentAnalysis {
  uri: string;
  version: number;
  lines: string[];
  sections: SectionRange[];
  facts: SymbolFact[];
}

export function analyzeDocument(document: TextDocument): DocumentAnalysis {
  const lines = document.getText().split(/\r?\n/);
  const sections = findSections(lines);
  const facts = collectFacts(lines, sections);

  return {
    uri: document.uri,
    version: document.version,
    lines,
    sections,
    facts
  };
}

function collectFacts(lines: string[], sections: SectionRange[]): SymbolFact[] {
  const facts: SymbolFact[] = [];

  for (const section of sections) {
    const sectionName =
      section.kind === 'forward'
        ? 'forward'
        : section.kind === 'prototypes'
        ? 'prototypes'
        : 'variables';

    facts.push({
      name: sectionName,
      kind: 'section',
      detail: 'section',
      line: section.startLine,
      startCharacter: firstNonWhitespace(lines[section.startLine]),
      endCharacter: lines[section.startLine].length
    });

    for (let i = section.startLine + 1; i < section.endLine; i++) {
      const line = lines[i];

      if (section.kind === 'variables') {
        const variable = matchVariableDeclaration(line);
        if (variable) {
          facts.push({
            name: variable.name,
            kind: 'variable',
            detail: `${variable.type}${variable.modifiers ? ` (${variable.modifiers})` : ''}`,
            line: i,
            startCharacter: line.indexOf(variable.name),
            endCharacter: line.indexOf(variable.name) + variable.name.length
          });
        }
        continue;
      }

      if (section.kind === 'prototypes') {
        const fn = matchFunctionPrototype(line);
        if (fn) {
          facts.push({
            name: fn.name,
            kind: fn.kind,
            declarationOnly: true,
            detail:
              fn.kind === 'function'
                ? `function : ${fn.returnType}`
                : 'subroutine',
            line: i,
            startCharacter: line.indexOf(fn.name),
            endCharacter: line.indexOf(fn.name) + fn.name.length
          });
          continue;
        }

        const ev = matchEventPrototype(line);
        if (ev) {
          const start = eventSelectionStart(line, ev.name);
          facts.push({
            name: ev.name,
            kind: 'event',
            declarationOnly: true,
            detail: ev.detail,
            line: i,
            startCharacter: start,
            endCharacter: start + ev.name.length
          });
          continue;
        }
      }

      if (section.kind === 'forward') {
        const ty = matchTypeDefinition(line);
        if (ty) {
          facts.push({
            name: ty.name,
            kind: 'type',
            declarationOnly: true,
            detail: ty.container
              ? `type from ${ty.ancestor} within ${ty.container}`
              : `type from ${ty.ancestor}`,
            line: i,
            startCharacter: line.indexOf(ty.name),
            endCharacter: line.indexOf(ty.name) + ty.name.length
          });
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const enclosingSection = findEnclosingSection(i, sections);

    if (
      enclosingSection?.kind === 'prototypes' ||
      enclosingSection?.kind === 'variables'
    ) {
      continue;
    }

    const typeMatch = matchTypeDefinition(line);
    if (typeMatch) {
      facts.push({
        name: typeMatch.name,
        kind: 'type',
        declarationOnly: enclosingSection?.kind === 'forward',
        detail: typeMatch.container
          ? `type from ${typeMatch.ancestor} within ${typeMatch.container}`
          : `type from ${typeMatch.ancestor}`,
        line: i,
        startCharacter: line.indexOf(typeMatch.name),
        endCharacter: line.indexOf(typeMatch.name) + typeMatch.name.length
      });
      continue;
    }

    if (!enclosingSection) {
      const fn = matchFunctionImplementationHeader(line);
      if (fn) {
        facts.push({
          name: fn.name,
          kind: fn.kind,
          declarationOnly: false,
          detail:
            fn.kind === 'function'
              ? `function : ${fn.returnType}`
              : 'subroutine',
          line: i,
          startCharacter: line.indexOf(fn.name),
          endCharacter: line.indexOf(fn.name) + fn.name.length
        });
        continue;
      }

      const ev =
        matchEventImplementationHeader(line) ?? matchOnImplementationHeader(line);

      if (ev) {
        const start = eventSelectionStart(line, ev.name);
        facts.push({
          name: ev.name,
          kind: 'event',
          declarationOnly: false,
          detail: ev.detail,
          line: i,
          startCharacter: start,
          endCharacter: start + ev.name.length
        });
      }
    }
  }

  return facts;
}
