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
import { END_GENERIC_PATTERN } from '../parsing/grammar';
import { stripCommentsSmart } from '../utils/comments';

import { Fact, EntityKind, Scope, ScopeKind } from '../knowledge/types';


export interface DocumentAnalysis {
  uri: string;
  version: number;
  lines: string[];
  strippedLines: string[];
  masks: Uint8Array[];
  sections: SectionRange[];
  facts: SymbolFact[];
  semanticFacts: Fact[];
  scopes: Scope[];
}

export function analyzeDocument(document: TextDocument): DocumentAnalysis {
  const lines = document.getText().split(/\r?\n/);
  const { lines: strippedLines, masks } = stripCommentsSmart(lines);
  const sections = findSections(lines);
  const { facts, scopes } = collectFactsAndScopes(lines, strippedLines, sections, document.uri);
  const semanticFacts = mapToSemanticFacts(facts, document.uri);

  return {
    uri: document.uri,
    version: document.version,
    lines,
    strippedLines,
    masks,
    sections,
    facts,
    semanticFacts,
    scopes
  };
}

function extractParameters(line: string): { label: string, documentation?: string }[] | undefined {
  const argMatch = line.match(/\((.*?)\)/);
  if (!argMatch || argMatch[1].trim() === '') {
    return undefined;
  }
  const args = argMatch[1].split(',');
  const parameters: { label: string }[] = [];
  for (const arg of args) {
    const trimmed = arg.trim();
    if (trimmed.length > 0) {
      parameters.push({ label: trimmed });
    }
  }
  return parameters.length > 0 ? parameters : undefined;
}

function mapToSemanticFacts(facts: SymbolFact[], uri: string): Fact[] {
  const factMap = new Map<string, Fact>();

  for (const f of facts) {
    if (f.kind === 'section') continue;

    let entityKind: EntityKind;
    switch (f.kind) {
      case 'function': entityKind = EntityKind.Function; break;
      case 'subroutine': entityKind = EntityKind.Subroutine; break;
      case 'event': entityKind = EntityKind.Event; break;
      case 'variable': entityKind = EntityKind.Variable; break;
      case 'type': entityKind = EntityKind.Type; break;
      default: continue;
    }

    const id = f.name.toLowerCase();
    const existing = factMap.get(id);

    // Si ya tenemos este símbolo como implementación, no lo sobreescribimos con un prototipo
    if (existing && f.declarationOnly) continue;

    factMap.set(id, {
      id,
      name: f.name,
      kind: entityKind,
      uri: uri,
      line: f.line,
      character: f.startCharacter,
      signature: f.detail,
      containerName: f.containerName,
      baseTypeName: f.baseTypeName,
      datatype: f.datatype,
      parameters: f.parameters,
      scope: f.scope,
      access: f.access
    });
  }

  return Array.from(factMap.values());
}

function collectFactsAndScopes(lines: string[], strippedLines: string[], sections: SectionRange[], uri: string): { facts: SymbolFact[], scopes: Scope[] } {
  const facts: SymbolFact[] = [];
  const scopes: Scope[] = [];

  let globalScope: Scope = {
    id: 'global',
    kind: ScopeKind.Global,
    uri,
    startLine: 0,
    endLine: lines.length - 1,
    children: [],
    symbols: []
  };
  scopes.push(globalScope);

  let currentTypeScope: Scope | undefined;
  let currentFuncScope: Scope | undefined;

  for (const section of sections) {
    const sectionName = section.kind === 'forward' ? 'forward' : section.kind === 'prototypes' ? 'prototypes' : 'variables';

    facts.push({
      name: sectionName,
      kind: 'section',
      detail: 'section',
      line: section.startLine,
      startCharacter: firstNonWhitespace(lines[section.startLine]),
      endCharacter: lines[section.startLine].length
    });

    for (let i = section.startLine + 1; i < section.endLine; i++) {
      const line = strippedLines[i];
      const rawLine = lines[i];

      if (section.kind === 'variables') {
        const header = lines[section.startLine].toLowerCase();
        let scope: 'Global' | 'Compartida' | 'Instancia' = 'Instancia';
        if (header.includes('global')) scope = 'Global';
        else if (header.includes('shared')) scope = 'Compartida';

        const variable = matchVariableDeclaration(line);
        if (variable) {
          facts.push({
            name: variable.name,
            kind: 'variable',
            detail: `${variable.type}${variable.modifiers ? ` (${variable.modifiers})` : ''}`,
            datatype: variable.type,
            scope: scope,
            access: variable.modifiers?.toLowerCase().includes('private') ? 'private' : 
                    variable.modifiers?.toLowerCase().includes('protected') ? 'protected' : 'public',
            line: i,
            startCharacter: rawLine.indexOf(variable.name),
            endCharacter: rawLine.indexOf(variable.name) + variable.name.length
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
            detail: fn.kind === 'function' ? `function : ${fn.returnType}` : 'subroutine',
            parameters: extractParameters(line),
            line: i,
            startCharacter: rawLine.indexOf(fn.name),
            endCharacter: rawLine.indexOf(fn.name) + fn.name.length
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
            parameters: extractParameters(line),
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
            baseTypeName: ty.ancestor,
            detail: ty.container ? `type from ${ty.ancestor} within ${ty.container}` : `type from ${ty.ancestor}`,
            line: i,
            startCharacter: rawLine.indexOf(ty.name),
            endCharacter: rawLine.indexOf(ty.name) + ty.name.length
          });
        }
      }
    }
  }

  let currentContainerName: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = strippedLines[i];
    const rawLine = lines[i];
    const enclosingSection = findEnclosingSection(i, sections);

    if (enclosingSection?.kind === 'prototypes' || enclosingSection?.kind === 'variables') {
      continue;
    }

    const typeMatch = matchTypeDefinition(line);
    if (typeMatch) {
      if (enclosingSection?.kind !== 'forward') {
        currentContainerName = typeMatch.name;
        
        currentTypeScope = {
          id: typeMatch.name,
          kind: ScopeKind.Type,
          uri,
          startLine: i,
          endLine: lines.length - 1, // Will be refined later if there are multiple types (rare)
          parent: globalScope,
          children: [],
          symbols: []
        };
        globalScope.children.push(currentTypeScope);
      }
      facts.push({
        name: typeMatch.name,
        kind: 'type',
        declarationOnly: enclosingSection?.kind === 'forward',
        containerName: typeMatch.container,
        baseTypeName: typeMatch.ancestor,
        detail: typeMatch.container ? `type from ${typeMatch.ancestor} within ${typeMatch.container}` : `type from ${typeMatch.ancestor}`,
        line: i,
        startCharacter: rawLine.indexOf(typeMatch.name),
        endCharacter: rawLine.indexOf(typeMatch.name) + typeMatch.name.length
      });
      continue;
    }

    if (!enclosingSection) {
      // Check for end of function/event
      if (END_GENERIC_PATTERN.test(line)) {
        if (currentFuncScope) {
          currentFuncScope.endLine = i;
          currentFuncScope = undefined;
        }
        continue;
      }

      const fn = matchFunctionImplementationHeader(line);
      if (fn) {
        if (currentFuncScope) currentFuncScope.endLine = i - 1; // Previous one didn't close properly

        const parentScope = currentTypeScope || globalScope;
        currentFuncScope = {
          id: `${currentContainerName ? currentContainerName + '.' : ''}${fn.name}`,
          kind: ScopeKind.Function,
          uri,
          startLine: i,
          endLine: lines.length - 1,
          parent: parentScope,
          children: [],
          symbols: []
        };
        parentScope.children.push(currentFuncScope);

        facts.push({
          name: fn.name,
          kind: fn.kind,
          declarationOnly: false,
          containerName: currentContainerName,
          detail: fn.kind === 'function' ? `function : ${fn.returnType}` : 'subroutine',
          parameters: extractParameters(line),
          line: i,
          startCharacter: rawLine.indexOf(fn.name),
          endCharacter: rawLine.indexOf(fn.name) + fn.name.length
        });

        // Add arguments to the scope (simplified extraction from prototype)
        // A full argument extraction would be better, but we can do a naive one
        const argMatch = line.match(/\((.*?)\)/);
        if (argMatch && argMatch[1].trim() !== '') {
          const args = argMatch[1].split(',');
          for (const arg of args) {
             const argParts = arg.trim().split(/\s+/);
             if (argParts.length >= 2) {
               let type = argParts[0];
               let name = argParts[argParts.length - 1];
               // Handle readonly, ref, etc.
               if (['readonly', 'ref', 'value'].includes(type.toLowerCase()) && argParts.length >= 3) {
                  type = argParts[1];
               }
               currentFuncScope.symbols.push({
                 id: name.toLowerCase(),
                 name: name,
                 kind: EntityKind.Variable,
                 uri: uri,
                 line: i,
                 character: rawLine.indexOf(name),
                 datatype: type,
                 containerName: currentFuncScope.id,
                 scope: 'Argumento'
               });
             }
          }
        }
        continue;
      }

      const ev = matchEventImplementationHeader(line) ?? matchOnImplementationHeader(line);
      if (ev) {
        if (currentFuncScope) currentFuncScope.endLine = i - 1;

        const parentScope = currentTypeScope || globalScope;
        currentFuncScope = {
          id: `${currentContainerName ? currentContainerName + '.' : ''}${ev.name}`,
          kind: ScopeKind.Event,
          uri,
          startLine: i,
          endLine: lines.length - 1,
          parent: parentScope,
          children: [],
          symbols: []
        };
        parentScope.children.push(currentFuncScope);

        const start = eventSelectionStart(line, ev.name);
        facts.push({
          name: ev.name,
          kind: 'event',
          declarationOnly: false,
          containerName: currentContainerName,
          detail: ev.detail,
          parameters: extractParameters(line),
          line: i,
          startCharacter: start,
          endCharacter: start + ev.name.length
        });

        // Add typical arguments for events (simplified)
        const argMatch = line.match(/\((.*?)\)/);
        if (argMatch && argMatch[1].trim() !== '') {
          const args = argMatch[1].split(',');
          for (const arg of args) {
            const argParts = arg.trim().split(/\s+/);
            if (argParts.length >= 2) {
              let type = argParts[0];
              let name = argParts[argParts.length - 1];
              if (['readonly', 'ref', 'value'].includes(type.toLowerCase()) && argParts.length >= 3) {
                type = argParts[1];
              }
              currentFuncScope.symbols.push({
                id: name.toLowerCase(),
                name: name,
                kind: EntityKind.Variable,
                uri: uri,
                line: i,
                character: rawLine.indexOf(name),
                datatype: type,
                containerName: currentFuncScope.id,
                scope: 'Argumento'
              });
            }
          }
        }
        continue;
      }

      // If we are inside a function/event, look for local variable declarations
      if (currentFuncScope) {
        const localVar = matchVariableDeclaration(line);
        if (localVar) {
          currentFuncScope.symbols.push({
            id: localVar.name.toLowerCase(),
            name: localVar.name,
            kind: EntityKind.Variable,
            uri: uri,
            line: i,
            character: rawLine.indexOf(localVar.name),
            datatype: localVar.type,
            containerName: currentFuncScope.id,
            scope: 'Local'
          });
        }
      } else if (currentTypeScope) {
        // We are inside a type block but outside a function, it's likely an instance variable
        const instVar = matchVariableDeclaration(line);
        if (instVar) {
          facts.push({
            name: instVar.name,
            kind: 'variable',
            containerName: currentTypeScope.id,
            detail: `${instVar.type}${instVar.modifiers ? ` (${instVar.modifiers})` : ''}`,
            datatype: instVar.type,
            scope: 'Instancia',
            access: instVar.modifiers?.toLowerCase().includes('private') ? 'private' : 
                    instVar.modifiers?.toLowerCase().includes('protected') ? 'protected' : 'public',
            line: i,
            startCharacter: rawLine.indexOf(instVar.name),
            endCharacter: rawLine.indexOf(instVar.name) + instVar.name.length
          });
        }
      }
    }
  }

  return { facts, scopes };
}
