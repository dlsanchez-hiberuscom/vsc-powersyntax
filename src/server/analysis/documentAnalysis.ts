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
import {
  END_FUNCTION_PATTERN,
  END_SUBROUTINE_PATTERN,
  END_EVENT_PATTERN,
  END_ON_PATTERN,
  END_TYPE_PATTERN
} from '../parsing/grammar';
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

/**
 * Extrae los argumentos formales (parámetros) de una cabecera de función/evento
 * y los registra como símbolos del scope correspondiente con `scope: 'Argumento'`.
 *
 * Heurística simple: separa por comas, ignora modificadores (`readonly`, `ref`,
 * `value`) y toma el primer token como tipo y el último como nombre.
 */
function pushScopeArguments(
  line: string,
  rawLine: string,
  lineIndex: number,
  uri: string,
  scope: Scope
): void {
  const argMatch = line.match(/\((.*?)\)/);
  if (!argMatch || argMatch[1].trim() === '') {
    return;
  }

  for (const rawArg of argMatch[1].split(',')) {
    const parts = rawArg.trim().split(/\s+/);
    if (parts.length < 2) continue;

    let type = parts[0];
    const name = parts[parts.length - 1];
    if (['readonly', 'ref', 'value'].includes(type.toLowerCase()) && parts.length >= 3) {
      type = parts[1];
    }

    scope.symbols.push({
      id: name.toLowerCase(),
      name,
      kind: EntityKind.Variable,
      uri,
      line: lineIndex,
      character: rawLine.indexOf(name),
      datatype: type,
      containerName: scope.id,
      scope: 'Argumento'
    });
  }
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
      // Cierre real de un scope de implementación (función, subrutina, evento o `on`).
      // IMPORTANTE: NO usar END_GENERIC_PATTERN aquí, porque haría que `end if`,
      // `end choose`, `end try`, etc. cierren erróneamente la función/evento actual,
      // perdiendo todas las variables y referencias que aparezcan después del primer
      // bloque de control dentro del cuerpo.
      if (
        currentFuncScope &&
        (
          END_FUNCTION_PATTERN.test(line) ||
          END_SUBROUTINE_PATTERN.test(line) ||
          END_EVENT_PATTERN.test(line) ||
          END_ON_PATTERN.test(line)
        )
      ) {
        currentFuncScope.endLine = i;
        currentFuncScope = undefined;
        continue;
      }

      // Cierre del bloque `type ... end type` (contenedor de objeto en SR*).
      if (currentTypeScope && END_TYPE_PATTERN.test(line)) {
        currentTypeScope.endLine = i;
        // No reseteamos `currentContainerName` ni `currentTypeScope` aquí porque en
        // los archivos SR* las funciones/eventos del tipo principal pueden
        // implementarse fuera del bloque `type ... end type` (a nivel raíz). El
        // contenedor sigue siendo válido para el resto del archivo.
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

        pushScopeArguments(line, rawLine, i, uri, currentFuncScope);
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

        pushScopeArguments(line, rawLine, i, uri, currentFuncScope);
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

          // Soporte para declaraciones múltiples: `Integer li_a, li_b, li_c`.
          // Después del primer nombre, capturamos identificadores adicionales
          // separados por comas hasta el final de la declaración o `=`/`//`.
          for (const extra of extractAdditionalNames(rawLine, localVar.name)) {
            currentFuncScope.symbols.push({
              id: extra.name.toLowerCase(),
              name: extra.name,
              kind: EntityKind.Variable,
              uri: uri,
              line: i,
              character: extra.character,
              datatype: localVar.type,
              containerName: currentFuncScope.id,
              scope: 'Local'
            });
          }
        }
      } else if (currentTypeScope) {
        // We are inside a type block but outside a function, it's likely an instance variable
        const instVar = matchVariableDeclaration(line);
        if (instVar) {
          const access: 'private' | 'protected' | 'public' =
            instVar.modifiers?.toLowerCase().includes('private') ? 'private' :
            instVar.modifiers?.toLowerCase().includes('protected') ? 'protected' : 'public';

          facts.push({
            name: instVar.name,
            kind: 'variable',
            containerName: currentTypeScope.id,
            detail: `${instVar.type}${instVar.modifiers ? ` (${instVar.modifiers})` : ''}`,
            datatype: instVar.type,
            scope: 'Instancia',
            access,
            line: i,
            startCharacter: rawLine.indexOf(instVar.name),
            endCharacter: rawLine.indexOf(instVar.name) + instVar.name.length
          });

          // Variables de instancia múltiples: `private integer ii_a, ii_b`.
          for (const extra of extractAdditionalNames(rawLine, instVar.name)) {
            facts.push({
              name: extra.name,
              kind: 'variable',
              containerName: currentTypeScope.id,
              detail: `${instVar.type}${instVar.modifiers ? ` (${instVar.modifiers})` : ''}`,
              datatype: instVar.type,
              scope: 'Instancia',
              access,
              line: i,
              startCharacter: extra.character,
              endCharacter: extra.character + extra.name.length
            });
          }
        }
      }
    }
  }

  return { facts, scopes };
}

/**
 * Dado el `rawLine` original y el nombre de la primera variable detectada,
 * extrae los identificadores adicionales declarados con la misma sentencia
 * (formato `tipo n1, n2, n3`). Se detiene en `=`, `;`, `//` o en cualquier
 * carácter no esperado para minimizar falsos positivos con expresiones
 * inicializadoras complejas.
 */
function extractAdditionalNames(
  rawLine: string,
  firstName: string
): Array<{ name: string; character: number }> {
  const out: Array<{ name: string; character: number }> = [];
  const firstIdx = rawLine.indexOf(firstName);
  if (firstIdx < 0) return out;

  let cursor = firstIdx + firstName.length;
  // Si tras el primer nombre viene `=` o `[` (array init) ya no son
  // declaraciones múltiples sin tipo nuevo: abortamos para no equivocarnos.
  const tail = rawLine.slice(cursor);
  if (/^\s*[=\[]/.test(tail)) return out;

  const NAME_RE = /\s*,\s*([a-zA-Z_$#%][\w$#%\-]*)(?:\s*\{\s*\d+\s*\})?/g;
  NAME_RE.lastIndex = cursor;
  let m: RegExpExecArray | null;
  while ((m = NAME_RE.exec(rawLine)) !== null) {
    const name = m[1];
    const start = m.index + m[0].indexOf(name);
    out.push({ name, character: start });
    cursor = NAME_RE.lastIndex;
    // Si tras este nombre viene `=` (inicializador), seguimos buscando comas
    // pero solo si el `=` está balanceado. Para mantenerlo seguro, paramos.
    const after = rawLine.slice(cursor);
    if (/^\s*=/.test(after)) break;
    if (/^\s*(\/\/|;|$)/.test(after)) break;
  }
  return out;
}
