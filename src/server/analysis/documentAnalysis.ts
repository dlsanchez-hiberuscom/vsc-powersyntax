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
import { classifyExternalLibrary, parseExternalFunction } from '../parsing/externalFunctions';
import { eventSelectionStart, firstNonWhitespace } from '../utils/helpers';
import {
  END_FUNCTION_PATTERN,
  END_SUBROUTINE_PATTERN,
  END_EVENT_PATTERN,
  END_ON_PATTERN,
  END_TYPE_PATTERN
} from '../parsing/grammar';
import { stripCommentsSmart } from '../utils/comments';
import { scanControlBlocks, type ControlBlockRange } from '../parsing/controlBlocks';
import { splitStatements, type LogicalStatement } from '../parsing/statementSplitter';
import {
  createSemanticSnapshot,
  type SemanticDocumentSnapshot
} from './semanticSnapshot';
import { inferSourceOrigin, type SourceOrigin } from '../../shared/sourceOrigin';
import { getBasename } from '../system/uriUtils';

import { Fact, EntityKind, Scope, ScopeKind } from '../knowledge/types';


export interface DocumentAnalysis {
  uri: string;
  version: number;
  /**
   * Hash determinista del texto del documento (FNV-1a 32-bit). Permite saltar
   * trabajo cuando el contenido no ha cambiado entre versiones LSP que sí
   * incrementan el version-counter por toques cosméticos.
   * Spec 074.
   */
  fingerprint: number;
  lines: string[];
  strippedLines: string[];
  masks: Uint8Array[];
  sections: SectionRange[];
  /**
   * Rangos de bloques de control (`if/for/do/choose/try`) detectados en el
   * cuerpo de funciones/eventos. Spec 063.
   */
  controlBlocks: ControlBlockRange[];
  /**
   * Rangos de bloques `type ... end type` (declarativos del contenedor SR*)
   * para resolver correctamente atribución a `containerName` cuando hay
   * varios `type ... within ...` (Spec 064).
   */
  typeBlocks: Array<{ name: string; container?: string; startLine: number; endLine: number }>;
  facts: SymbolFact[];
  semanticFacts: Fact[];
  scopes: Scope[];
  /**
   * Statements lógicos del documento (uniones de `&` y splits por `;`).
   * Calculados perezosamente bajo demanda. Spec 108.
   */
  logicalStatements: LogicalStatement[];
  /**
   * Unidad semántica canónica del documento.
   * Spec 133 / B151.
   */
  snapshot: SemanticDocumentSnapshot;
}

export interface StructuralDocumentAnalysis {
  uri: string;
  version: number;
  fingerprint: number;
  snapshot: SemanticDocumentSnapshot;
}

export interface DocumentAnalysisOptions {
  sourceOrigin?: SourceOrigin;
}

/** FNV-1a 32-bit. Determinista, sin dependencias y rápido para buffers de texto. */
function fingerprintOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Spec 071: identificadores estables para scopes Function/Event,
 * normalizados a `containerName.lowerName` (PowerScript es case-insensitive).
 * Permite igualar scopes sin importar la capitalización del archivo.
 */
function stableScopeId(container: string | undefined, name: string): string {
  const lname = name.toLowerCase();
  if (!container) return lname;
  return `${container.toLowerCase()}.${lname}`;
}

function resolveAnalysisSourceOrigin(uri: string, options?: DocumentAnalysisOptions): SourceOrigin {
  return options?.sourceOrigin ?? inferSourceOrigin(uri);
}

export function analyzeDocument(document: TextDocument, options?: DocumentAnalysisOptions): DocumentAnalysis {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  // Spec 087: BOM al principio del archivo. PowerBuilder genera SR* en
  // UTF-8 BOM y UTF-16; vscode-languageserver-textdocument ya entrega texto
  // decodificado, pero defendemos el caso (poco frecuente) de un BOM literal
  // residual en la primera línea para que no contamine el primer token.
  if (lines.length > 0 && lines[0].charCodeAt(0) === 0xfeff) {
    lines[0] = lines[0].slice(1);
  }
  const { lines: strippedLines, masks } = stripCommentsSmart(lines);
  const sections = findSections(lines);
  const typeBlocks = scanTypeBlocks(strippedLines);
  const { facts, scopes } = collectFactsAndScopes(
    lines,
    strippedLines,
    sections,
    typeBlocks,
    document.uri
  );
  const stubFacts = buildFileObjectStubFacts(document.uri, lines);
  const allFacts = stubFacts.length > 0 ? [...stubFacts, ...facts] : facts;
  const semanticFacts = mapToSemanticFacts(allFacts, document.uri, resolveAnalysisSourceOrigin(document.uri, options));

  // Bloques de control globales del documento (luego se filtran por scope cuando hace falta).
  const controlBlocks = scanControlBlocks(strippedLines, 0, strippedLines.length - 1);
  // Spec 108: statements lógicos (continuaciones `&` + splits por `;`).
  const logicalStatements = splitStatements(text);
  const fingerprint = fingerprintOf(text);
  const snapshot = createSemanticSnapshot({
    uri: document.uri,
    version: document.version,
    fingerprint,
    sections,
    typeBlocks,
    strippedLines,
    masks,
    semanticFacts,
    scopes,
    logicalStatements,
    controlBlocks
  });

  return {
    uri: document.uri,
    version: document.version,
    fingerprint,
    lines,
    strippedLines,
    masks,
    sections,
    controlBlocks,
    typeBlocks,
    facts: allFacts,
    semanticFacts,
    scopes,
    logicalStatements,
    snapshot
  };
}

export function analyzeDocumentStructural(document: TextDocument, options?: DocumentAnalysisOptions): StructuralDocumentAnalysis {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[0].charCodeAt(0) === 0xfeff) {
    lines[0] = lines[0].slice(1);
  }
  const { lines: strippedLines, masks } = stripCommentsSmart(lines);
  const sections = findSections(lines);
  const typeBlocks = scanTypeBlocks(strippedLines);
  const fingerprint = fingerprintOf(text);
  const stubFacts = buildFileObjectStubFacts(document.uri, lines);
  const semanticFacts = mapToSemanticFacts(stubFacts, document.uri, resolveAnalysisSourceOrigin(document.uri, options));

  return {
    uri: document.uri,
    version: document.version,
    fingerprint,
    snapshot: createSemanticSnapshot({
      uri: document.uri,
      version: document.version,
      fingerprint,
      sections,
      typeBlocks,
      strippedLines,
      masks,
      semanticFacts,
      scopes: [],
      logicalStatements: [],
      controlBlocks: [],
      pass: 'structural',
      readiness: 'structural-only'
    })
  };
}

function buildFileObjectStubFacts(uri: string, lines: string[]): SymbolFact[] {
  const objectName = inferDataWindowObjectName(uri);
  if (!objectName) {
    return [];
  }

  const firstLine = lines[0] ?? '';
  const startCharacter = findCaseInsensitive(firstLine, objectName);
  const selectionStart = startCharacter >= 0 ? startCharacter : 0;

  return [
    {
      name: objectName,
      kind: 'type',
      detail: 'type from datawindow',
      declarationScope: 'type',
      baseTypeName: 'datawindow',
      fileObjectName: objectName,
      line: 0,
      startCharacter: selectionStart,
      endCharacter: selectionStart + objectName.length
    }
  ];
}

function inferDataWindowObjectName(uri: string): string | undefined {
  const basename = getBasename(uri);
  if (!basename.toLowerCase().endsWith('.srd')) {
    return undefined;
  }

  return basename.slice(0, -4) || undefined;
}

function findCaseInsensitive(text: string, needle: string): number {
  return text.toLowerCase().indexOf(needle.toLowerCase());
}

/**
 * Detecta los rangos `type Name from Ancestor [within Container] ... end type`.
 * Es deliberadamente permisivo: si no encuentra `end type` cierra con EOF.
 * Spec 064.
 */
function scanTypeBlocks(
  strippedLines: string[]
): Array<{ name: string; container?: string; startLine: number; endLine: number }> {
  const out: Array<{ name: string; container?: string; startLine: number; endLine: number }> = [];
  const stack: Array<{ name: string; container?: string; startLine: number }> = [];
  for (let i = 0; i < strippedLines.length; i++) {
    const line = strippedLines[i];
    const match = matchTypeDefinition(line);
    if (match) {
      stack.push({ name: match.name, container: match.container, startLine: i });
      continue;
    }
    if (END_TYPE_PATTERN.test(line) && stack.length > 0) {
      const top = stack.pop()!;
      out.push({ name: top.name, container: top.container, startLine: top.startLine, endLine: i });
    }
  }
  while (stack.length > 0) {
    const top = stack.pop()!;
    out.push({
      name: top.name,
      container: top.container,
      startLine: top.startLine,
      endLine: strippedLines.length - 1
    });
  }
  return out;
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
 * Soporta:
 *   - múltiples modificadores PowerScript: `readonly`, `ref`, `value`,
 *   - sufijos de array en el nombre del parámetro: `string as_arr[]`,
 *   - tipos con tamaño: `string{40} as_fixed`,
 *   - el caso degenerado de un único token (lo descarta).
 */
function pushScopeArguments(
  line: string,
  rawLine: string,
  lineIndex: number,
  uri: string,
  scope: Scope,
  metadata?: {
    containerKind?: string;
    containerSignature?: string;
    fileObjectName?: string;
    ownerName?: string;
  }
): void {
  const argMatch = line.match(/\((.*?)\)/);
  if (!argMatch || argMatch[1].trim() === '') {
    return;
  }

  const PARAM_MODIFIERS = new Set(['readonly', 'ref', 'value']);

  for (const rawArg of argMatch[1].split(',')) {
    // Spec 067: soporte de valor por defecto en parámetros (`integer ai = 0`).
    // Se descarta la parte tras `=` para el análisis estructural.
    const noDefault = rawArg.split('=')[0];
    const parts = noDefault.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;

    // Saltar todos los modificadores iniciales (`readonly`, `ref`, `value`).
    let cursor = 0;
    while (cursor < parts.length - 1 && PARAM_MODIFIERS.has(parts[cursor].toLowerCase())) {
      cursor++;
    }
    if (cursor >= parts.length - 1) continue;

    const type = parts[cursor];
    // Limpiar sufijos de array (`as_arr[]`, `as_arr [ ]`) del nombre.
    const rawName = parts[parts.length - 1].replace(/\[[^\]]*\]\s*$/g, '');
    if (!rawName) continue;

    scope.symbols.push({
      id: rawName.toLowerCase(),
      name: rawName,
      kind: EntityKind.Variable,
      uri,
      line: lineIndex,
      character: rawLine.indexOf(rawName),
      datatype: type,
      containerName: scope.id,
      scope: 'Argumento',
      declarationScope: 'parameter',
      containerKind: metadata?.containerKind,
      containerSignature: metadata?.containerSignature,
      fileObjectName: metadata?.fileObjectName,
      ownerName: metadata?.ownerName
    });
  }
}

function mapToSemanticFacts(facts: SymbolFact[], uri: string, sourceOrigin: ReturnType<typeof inferSourceOrigin>): Fact[] {
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

    // Spec 072: clave compuesta por kind+container+name para no colisionar
    // entre tipos distintos en el mismo archivo, y para que la regla
    // "implementación gana sobre prototipo" se aplique a function/subroutine/event.
    const id = f.name.toLowerCase();
    const dedupKey = `${entityKind}|${(f.containerName ?? '').toLowerCase()}|${id}`;
    const existing = factMap.get(dedupKey);

    // Si ya tenemos una implementación para este (kind, container, name), no
    // dejamos que un prototipo posterior la sobreescriba.
    if (existing && f.declarationOnly && !existing.isPrototype) continue;

    const phase = f.declarationOnly
      ? 'prototype'
      : entityKind === EntityKind.Function || entityKind === EntityKind.Subroutine || entityKind === EntityKind.Event
        ? 'implementation'
        : 'declaration';
    const role = f.declarationOnly
      ? 'prototype'
      : entityKind === EntityKind.Function || entityKind === EntityKind.Subroutine || entityKind === EntityKind.Event
        ? 'implementation'
        : undefined;
    const implementationKind = f.isExternal
      ? 'external-function'
      : entityKind === EntityKind.Event && typeof f.detail === 'string' && f.detail.trim().toLowerCase().startsWith('on ')
        ? 'on-handler'
        : entityKind === EntityKind.Function
          ? 'function'
          : entityKind === EntityKind.Subroutine
            ? 'subroutine'
            : entityKind === EntityKind.Event
              ? 'event'
              : entityKind === EntityKind.Type
                ? 'type'
                : f.scope === 'Instancia'
                  ? 'instance-var'
                  : undefined;
    const ownerName = f.declarationScope === 'type'
      ? (f.containerName ?? f.fileObjectName ?? f.name)
      : (f.containerName ?? f.fileObjectName);

    factMap.set(dedupKey, {
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
      declarationScope: f.declarationScope,
      access: f.access,
      containerKind: f.containerKind,
      containerSignature: f.containerSignature,
      fileObjectName: f.fileObjectName,
      ownerName,
      parameterCount: f.parameters?.length,
      implementationKind,
      returnType: f.returnType,
      isExternal: f.isExternal,
      externalLibraryName: f.externalLibraryName,
      externalAlias: f.externalAlias,
      externalDependencyKind: f.externalDependencyKind,
      isPrototype: f.declarationOnly === true,
      lineage: {
        sourceKind: 'document',
        sourceOrigin,
        authority: 'derived',
        phase,
        ...(role ? { role } : {}),
        ...(f.baseTypeName ? { inheritedFrom: f.baseTypeName } : {}),
        confidence: 'direct'
      }
    });
  }

  return Array.from(factMap.values());
}

function collectFactsAndScopes(
  lines: string[],
  strippedLines: string[],
  sections: SectionRange[],
  typeBlocks: Array<{ name: string; container?: string; startLine: number; endLine: number }>,
  uri: string
): { facts: SymbolFact[], scopes: Scope[] } {
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
  const rootTypeBlocks = typeBlocks
    .filter((block) => !block.container)
    .sort((left, right) => left.startLine - right.startLine);
  const rootFileObjectName = rootTypeBlocks[0]?.name;
  let currentCallableKind: string | undefined;
  let currentCallableSignature: string | undefined;
  let currentCallableFileObjectName: string | undefined;
  let currentCallableOwnerName: string | undefined;

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
            containerName: rootFileObjectName,
            detail: `${variable.type}${variable.modifiers ? ` (${variable.modifiers})` : ''}`,
            datatype: variable.type,
            scope: scope,
            declarationScope: 'member',
            access: variable.modifiers?.toLowerCase().includes('private') ? 'private' : 
                    variable.modifiers?.toLowerCase().includes('protected') ? 'protected' : 'public',
            containerKind: rootFileObjectName ? 'type' : undefined,
            fileObjectName: rootFileObjectName,
            line: i,
            startCharacter: rawLine.indexOf(variable.name),
            endCharacter: rawLine.indexOf(variable.name) + variable.name.length
          });
        }
        continue;
      }

      if (section.kind === 'prototypes') {
        const external = parseExternalFunction(line);
        if (external) {
          facts.push({
            name: external.name,
            kind: external.kind,
            detail: rawLine.trim().replace(/;\s*$/, ''),
            containerName: rootFileObjectName,
            containerKind: rootFileObjectName ? 'type' : undefined,
            fileObjectName: rootFileObjectName,
            declarationScope: 'callable',
            parameters: extractParameters(line),
            returnType: external.returnType,
            isExternal: true,
            externalLibraryName: external.library,
            externalAlias: external.alias,
            externalDependencyKind: classifyExternalLibrary(external.library),
            line: i,
            startCharacter: rawLine.indexOf(external.name),
            endCharacter: rawLine.indexOf(external.name) + external.name.length
          });
          continue;
        }

        const fn = matchFunctionPrototype(line);
        if (fn) {
          facts.push({
            name: fn.name,
            kind: fn.kind,
            declarationOnly: true,
            detail: rawLine.trim().replace(/;\s*$/, ''),
            containerName: rootFileObjectName,
            containerKind: rootFileObjectName ? 'type' : undefined,
            fileObjectName: rootFileObjectName,
            declarationScope: 'callable',
            parameters: extractParameters(line),
            returnType: fn.returnType,
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
            detail: rawLine.trim().replace(/;\s*$/, ''),
            containerName: rootFileObjectName,
            containerKind: rootFileObjectName ? 'type' : undefined,
            fileObjectName: rootFileObjectName,
            declarationScope: 'callable',
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
            containerKind: ty.container ? 'type' : 'file-object',
            fileObjectName: ty.container ? rootFileObjectName : ty.name,
            declarationScope: 'type',
            line: i,
            startCharacter: rawLine.indexOf(ty.name),
            endCharacter: rawLine.indexOf(ty.name) + ty.name.length
          });
        }
      }
    }
  }

  let currentContainerName: string | undefined;

  /**
   * Spec 064: cuando un archivo declara varios `type X within Y` (típico en
   * .srw con sub-controles), el `currentContainerName` no es simplemente "el
   * último que vimos" sino "el más anidado que contiene esta línea". Si la
   * implementación está fuera de cualquier `type ... end type` se prefiere el
   * `global type` (sin container).
   */
  const containerAt = (line: number): string | undefined => {
    let best: { name: string; depth: number } | undefined;
    for (const tb of typeBlocks) {
      if (line < tb.startLine || line > tb.endLine) continue;
      const depth = tb.endLine - tb.startLine; // un span menor = más anidado
      if (!best || depth < best.depth) {
        best = { name: tb.name, depth };
      }
    }
    if (best) return best.name;
    // fuera de cualquier `type ... end type`: el primero "raíz" del archivo
    // (típicamente el global type) se mantiene como contenedor de las
    // implementaciones de funciones/eventos que aparecen al final del SR*.
    const rootCandidates = typeBlocks.filter((tb) => !tb.container);
    if (rootCandidates.length > 0) {
      // el de menor startLine es el global type
      let earliest = rootCandidates[0];
      for (const r of rootCandidates) if (r.startLine < earliest.startLine) earliest = r;
      if (line >= earliest.startLine) {
        return earliest.name;
      }
    }
    return undefined;
  };

  /**
   * Devuelve el `Scope` de un type por nombre, creándolo bajo `globalScope`
   * si no existe (p.ej. cuando una implementación aparece antes de que la
   * pasada lineal haya tocado el `type X within Y` correspondiente).
   * Spec 064.
   */
  const ensureTypeScope = (name: string | undefined): Scope | undefined => {
    if (!name) return undefined;
    const wanted = name.toLowerCase();
    const existing = globalScope.children.find(
      (c) => c.kind === ScopeKind.Type && c.id.toLowerCase() === wanted
    );
    const range = resolveTypeScopeRange(name);
    if (existing) return existing;
    const created: Scope = {
      id: name,
      kind: ScopeKind.Type,
      uri,
      startLine: range.startLine,
      endLine: range.endLine,
      parent: globalScope,
      children: [],
      symbols: []
    };
    globalScope.children.push(created);
    return created;
  };

  const resolveTypeScopeRange = (name: string): { startLine: number; endLine: number } => {
    const wanted = name.toLowerCase();
    const matches = typeBlocks.filter((block) => block.name.toLowerCase() === wanted);
    if (matches.length === 0) {
      return { startLine: 0, endLine: Math.max(0, lines.length - 1) };
    }

    let startLine = matches[0].startLine;
    let endLine = matches[0].endLine;
    for (let index = 1; index < matches.length; index++) {
      const match = matches[index];
      if (match.startLine < startLine) {
        startLine = match.startLine;
      }
      if (match.endLine > endLine) {
        endLine = match.endLine;
      }
    }

    return {
      startLine,
      endLine: Math.max(endLine, startLine)
    };
  };

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
        // Reutiliza/crea el scope del type (Spec 064): si ya fue creado por
        // `ensureTypeScope` antes de toparnos con esta línea, mantenemos la
        // misma instancia para que los hijos no queden huérfanos.
        currentTypeScope = ensureTypeScope(typeMatch.name);
        if (currentTypeScope) {
          const range = resolveTypeScopeRange(typeMatch.name);
          currentTypeScope.startLine = Math.min(currentTypeScope.startLine, range.startLine);
          currentTypeScope.endLine = Math.max(currentTypeScope.endLine, range.endLine);
        }
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
        currentCallableKind = undefined;
        currentCallableSignature = undefined;
        currentCallableFileObjectName = undefined;
        currentCallableOwnerName = undefined;
        continue;
      }

      // NOTA: deliberadamente NO cerramos `currentTypeScope` con `end type`.
      // En los archivos SR* (.srw, .sru, .srm, .srf, .srs) el bloque
      // `type ... end type` declara la firma del objeto principal, pero las
      // implementaciones de funciones y eventos del mismo objeto aparecen
      // **después** de `end type`, a nivel raíz. Si cerrásemos el scope del
      // tipo aquí, esos métodos quedarían fuera del árbol de scopes y
      // `getScopeAt(...)` no los encontraría.

      const fn = matchFunctionImplementationHeader(line);
      if (fn) {
        if (currentFuncScope) currentFuncScope.endLine = i - 1; // Previous one didn't close properly

        const containerName = containerAt(i);
        const callableSignature = rawLine.trim().replace(/;\s*$/, '');
        const fileObjectName = rootFileObjectName ?? containerName;
        currentContainerName = containerName;
        // Asegura que existe un Type-scope para `containerName` (puede ser
        // distinto del último encontrado linealmente cuando hay varios `within`).
        const parentScope = ensureTypeScope(containerName) ?? globalScope;
        // Extiende el endLine del Type-scope para englobar a esta
        // implementación (los métodos en SR* pueden aparecer después de
        // `end type` y aún así pertenecen al objeto principal).
        if (parentScope !== globalScope && parentScope.endLine < lines.length - 1) {
          parentScope.endLine = lines.length - 1;
        }
        currentFuncScope = {
          id: stableScopeId(containerName, fn.name),
          kind: ScopeKind.Function,
          uri,
          startLine: i,
          endLine: lines.length - 1,
          parent: parentScope,
          children: [],
          symbols: []
        };
        parentScope.children.push(currentFuncScope);
        currentCallableKind = fn.kind;
        currentCallableSignature = callableSignature;
        currentCallableFileObjectName = fileObjectName;
        currentCallableOwnerName = containerName;

        facts.push({
          name: fn.name,
          kind: fn.kind,
          declarationOnly: false,
          containerName,
          containerKind: containerName ? 'type' : undefined,
          detail: callableSignature,
          fileObjectName: fileObjectName,
          declarationScope: 'callable',
          parameters: extractParameters(line),
          returnType: fn.returnType,
          line: i,
          startCharacter: rawLine.indexOf(fn.name),
          endCharacter: rawLine.indexOf(fn.name) + fn.name.length
        });

        pushScopeArguments(line, rawLine, i, uri, currentFuncScope, {
          containerKind: fn.kind,
          containerSignature: callableSignature,
          fileObjectName,
          ownerName: containerName
        });
        continue;
      }

      const ev = matchEventImplementationHeader(line) ?? matchOnImplementationHeader(line);
      if (ev) {
        if (currentFuncScope) currentFuncScope.endLine = i - 1;

        const containerName = ev.ownerName ?? containerAt(i);
        const callableSignature = rawLine.trim().replace(/;\s*$/, '');
        const fileObjectName = rootFileObjectName ?? containerAt(i) ?? containerName;
        currentContainerName = containerName;
        const parentScope = ensureTypeScope(containerName) ?? globalScope;
        if (parentScope !== globalScope && parentScope.endLine < lines.length - 1) {
          parentScope.endLine = lines.length - 1;
        }
        currentFuncScope = {
          id: stableScopeId(containerName, ev.name),
          kind: ScopeKind.Event,
          uri,
          startLine: i,
          endLine: lines.length - 1,
          parent: parentScope,
          children: [],
          symbols: []
        };
        parentScope.children.push(currentFuncScope);
        currentCallableKind = 'event';
        currentCallableSignature = callableSignature;
        currentCallableFileObjectName = fileObjectName;
        currentCallableOwnerName = containerName;

        const start = eventSelectionStart(line, ev.name);
        facts.push({
          name: ev.name,
          kind: 'event',
          declarationOnly: false,
          containerName,
          containerKind: containerName ? 'type' : undefined,
          detail: callableSignature,
          fileObjectName: fileObjectName,
          declarationScope: 'callable',
          parameters: extractParameters(line),
          line: i,
          startCharacter: start,
          endCharacter: start + ev.name.length
        });

        pushScopeArguments(line, rawLine, i, uri, currentFuncScope, {
          containerKind: 'event',
          containerSignature: callableSignature,
          fileObjectName,
          ownerName: containerName
        });
        continue;
      }

      const external = parseExternalFunction(line);
      if (external) {
        const containerName = containerAt(i);
        facts.push({
          name: external.name,
          kind: external.kind,
          containerName,
          containerKind: containerName ? 'type' : undefined,
          detail: rawLine.trim().replace(/;\s*$/, ''),
          fileObjectName: rootFileObjectName ?? containerName,
          declarationScope: 'callable',
          parameters: extractParameters(line),
          returnType: external.returnType,
          isExternal: true,
          externalLibraryName: external.library,
          externalAlias: external.alias,
          externalDependencyKind: classifyExternalLibrary(external.library),
          line: i,
          startCharacter: rawLine.indexOf(external.name),
          endCharacter: rawLine.indexOf(external.name) + external.name.length
        });
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
            scope: 'Local',
            declarationScope: 'local',
            containerKind: currentCallableKind,
            containerSignature: currentCallableSignature,
            fileObjectName: currentCallableFileObjectName,
            ownerName: currentCallableOwnerName
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
              scope: 'Local',
              declarationScope: 'local',
              containerKind: currentCallableKind,
              containerSignature: currentCallableSignature,
              fileObjectName: currentCallableFileObjectName,
              ownerName: currentCallableOwnerName
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
            declarationScope: 'member',
            access,
            containerKind: 'type',
            fileObjectName: rootFileObjectName ?? currentTypeScope.id,
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
              declarationScope: 'member',
              access,
              containerKind: 'type',
              fileObjectName: rootFileObjectName ?? currentTypeScope.id,
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
