import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  type Connection
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DIAGNOSTIC_SOURCE } from '../../shared/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { BlockKind } from '../model/types';
import { findEnclosingSection } from '../parsing/sections';
import {
  isTypeDefinitionHeader,
  matchEventImplementationHeader,
  matchFunctionImplementationHeader,
  matchOnImplementationHeader
} from '../parsing/matchers';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { EntityKind, ScopeKind } from '../knowledge/types';
import {
  PB_KEYWORDS,
  PB_BUILTIN_TYPES,
  PB_IDENTIFIER_SOURCE,
  FORWARD_PROTOTYPES_START_PATTERN,
  PROTOTYPES_START_PATTERN,
  VARIABLES_START_PATTERN,
  FORWARD_START_PATTERN,
  END_FORWARD_PATTERN,
  END_PROTOTYPES_PATTERN,
  END_VARIABLES_PATTERN,
  END_TYPE_PATTERN,
  END_FUNCTION_PATTERN,
  END_SUBROUTINE_PATTERN,
  END_EVENT_PATTERN,
  END_ON_PATTERN,
  IF_BLOCK_OPEN_PATTERN,
  FOR_OPEN_PATTERN,
  DO_OPEN_PATTERN,
  CHOOSE_CASE_OPEN_PATTERN,
  TRY_OPEN_PATTERN,
  END_IF_PATTERN,
  NEXT_PATTERN,
  LOOP_PATTERN,
  END_CHOOSE_PATTERN,
  END_TRY_PATTERN,
  END_GENERIC_PATTERN,
  ELSE_CASE_PATTERN,
  LINE_COMMENT_PATTERN
} from '../parsing/grammar';


export function publishDiagnostics(
  connection: Connection,
  document: TextDocument,
  kb?: KnowledgeBase,
  systemCatalog?: SystemCatalog,
  inheritanceGraph?: InheritanceGraph
): void {
  const structural = validateStructure(document);
  const semantic = (kb && systemCatalog && inheritanceGraph)
    ? validateSemantics(document, kb, systemCatalog, inheritanceGraph)
    : [];
  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [...structural, ...semantic]
  });
}

export function validateStructure(document: TextDocument): Diagnostic[] {
  const analysis = getDocumentAnalysis(document);
  const { lines, sections } = analysis;
  const diagnostics: Diagnostic[] = [];
  const stack: Array<{ kind: BlockKind; line: number; text: string }> = [];

  // Acumulador para sentencias que usan continuación de línea (`&` al final).
  // Algunas construcciones (típicamente `IF ... THEN`) se escriben en varias
  // líneas y solo se cierran lógicamente al encontrar la última sin `&`.
  let contBuffer = '';
  let contStartLine = -1;
  let contStartText = '';

  for (let i = 0; i < lines.length; i++) {
    const raw = analysis.strippedLines[i];
    const trimmedRaw = raw.trim();

    if (!trimmedRaw && contBuffer === '') {
      continue;
    }

    // Manejo de continuaciones: si la línea (ya sin comentarios) termina en `&`,
    // acumulamos y seguimos sin abrir/cerrar bloques todavía.
    if (trimmedRaw.endsWith('&')) {
      if (contStartLine < 0) {
        contStartLine = i;
        contStartText = raw;
      }
      contBuffer += (contBuffer ? ' ' : '') + trimmedRaw.replace(/&\s*$/, '').trim();
      continue;
    }

    let line: string;
    let logicalStartLine: number;
    let logicalStartText: string;
    if (contBuffer) {
      line = (contBuffer + ' ' + trimmedRaw).trim().toLowerCase().replace(/\s+/g, ' ');
      // Para diagnósticos preferimos señalar la primera línea de la sentencia.
      logicalStartLine = contStartLine;
      logicalStartText = contStartText;
      contBuffer = '';
      contStartLine = -1;
      contStartText = '';
    } else {
      line = trimmedRaw;
      logicalStartLine = i;
      logicalStartText = raw;
    }

    const closeKind = matchClosingBlock(line);
    if (closeKind) {
      const top = stack[stack.length - 1];

      if (!top || top.kind !== closeKind) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: Range.create(
            Position.create(i, 0),
            Position.create(i, raw.length)
          ),
          message: `Se ha detectado un cierre de bloque '${closeKind}' sin una apertura previa compatible.`,
          source: DIAGNOSTIC_SOURCE
        });
      } else {
        stack.pop();
      }

      continue;
    }

    if (FORWARD_PROTOTYPES_START_PATTERN.test(line)) {
      stack.push({ kind: 'prototypes', line: logicalStartLine, text: logicalStartText });
      continue;
    }

    if (PROTOTYPES_START_PATTERN.test(line)) {
      stack.push({ kind: 'prototypes', line: logicalStartLine, text: logicalStartText });
      continue;
    }

    if (VARIABLES_START_PATTERN.test(line)) {
      stack.push({ kind: 'variables', line: logicalStartLine, text: logicalStartText });
      continue;
    }

    if (FORWARD_START_PATTERN.test(line) && !FORWARD_PROTOTYPES_START_PATTERN.test(line)) {
      stack.push({ kind: 'forward', line: logicalStartLine, text: logicalStartText });
      continue;
    }

    const enclosingSection = findEnclosingSection(i, sections);

    if (enclosingSection?.kind === 'prototypes') {
      continue;
    }

    if (enclosingSection?.kind === 'variables') {
      continue;
    }

    if (isTypeDefinitionHeader(raw)) {
      stack.push({ kind: 'type', line: i, text: raw });
      continue;
    }

    if (!enclosingSection) {
      const fn = matchFunctionImplementationHeader(raw);
      if (fn) {
        stack.push({ kind: fn.kind, line: i, text: raw });
        continue;
      }

      const ev =
        matchEventImplementationHeader(raw) ?? matchOnImplementationHeader(raw);

      if (ev) {
        stack.push({ kind: 'event', line: i, text: raw });
        continue;
      }

      // --- Bloques ejecutables (portado de plugin_old pbLanguageGrammar.ts) ---
      // IF multi-línea: termina en THEN al final de la línea lógica.
      // Soporta continuaciones `&` (por ejemplo `if a > 0 and & ... b < 10 then`).
      if (IF_BLOCK_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'if', line: logicalStartLine, text: logicalStartText });
        continue;
      }

      if (FOR_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'for', line: logicalStartLine, text: logicalStartText });
        continue;
      }

      if (DO_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'do', line: logicalStartLine, text: logicalStartText });
        continue;
      }

      if (CHOOSE_CASE_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'choose-case', line: logicalStartLine, text: logicalStartText });
        continue;
      }

      if (TRY_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'try', line: logicalStartLine, text: logicalStartText });
        continue;
      }
    }
  }

  for (const open of stack) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: Range.create(
        Position.create(open.line, 0),
        Position.create(open.line, open.text.length)
      ),
      message: `El bloque '${open.kind}' se encuentra abierto pero no ha sido cerrado correctamente.`,
      source: DIAGNOSTIC_SOURCE
    });
  }

  return diagnostics;
}

function matchClosingBlock(line: string): BlockKind | null {
  // --- Bloques estructurales ---
  if (END_FORWARD_PATTERN.test(line)) return 'forward';
  if (END_PROTOTYPES_PATTERN.test(line)) return 'prototypes';
  if (END_VARIABLES_PATTERN.test(line)) return 'variables';
  if (END_TYPE_PATTERN.test(line)) return 'type';
  if (END_FUNCTION_PATTERN.test(line)) return 'function';
  if (END_SUBROUTINE_PATTERN.test(line)) return 'subroutine';
  if (END_EVENT_PATTERN.test(line) || END_ON_PATTERN.test(line)) return 'event';
  // --- Bloques ejecutables (portado de plugin_old pbLanguageGrammar.ts) ---
  if (END_IF_PATTERN.test(line)) return 'if';
  if (NEXT_PATTERN.test(line)) return 'for';
  if (LOOP_PATTERN.test(line)) return 'do';
  if (END_CHOOSE_PATTERN.test(line)) return 'choose-case';
  if (END_TRY_PATTERN.test(line)) return 'try';
  return null;
}

// ---------------------------------------------------------------------------
// Diagnósticos Semánticos (SD1–SD5)
// ---------------------------------------------------------------------------

/**
 * Valida semánticamente un documento PowerBuilder.
 * Reglas implementadas:
 * - SD2: Llamadas a funciones/eventos inexistentes en la jerarquía.
 * - SD3: Tipos base inexistentes en `type ... from ...`.
 * - SD4: Variables locales no usadas.
 * - SD5: Variables de instancia privadas no usadas.
 *
 * SD1 (variables no declaradas dentro de funciones/eventos) está fuera del
 * alcance hasta disponer de resolución fuerte (Fase 7A) y no se emite aquí
 * para evitar falsos positivos.
 */
export function validateSemantics(
  document: TextDocument,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  inheritanceGraph: InheritanceGraph
): Diagnostic[] {
  const analysis = getDocumentAnalysis(document);
  const { lines, sections, semanticFacts, scopes } = analysis;
  const diagnostics: Diagnostic[] = [];

  // Encontrar el tipo principal del archivo
  const mainType = semanticFacts.find(f => f.kind === EntityKind.Type);
  const mainTypeName = mainType?.name;

  // Obtener todos los miembros de la jerarquía si hay tipo principal
  const hierarchyMembers = mainTypeName
    ? inheritanceGraph.getMembers(mainTypeName)
    : [];
  const hierarchyMemberNames = new Set(hierarchyMembers.map(m => m.name.toLowerCase()));

  // Obtener todos los nombres de funciones/eventos/subroutines del archivo
  const localCallables = new Set(
    semanticFacts
      .filter(f => f.kind === EntityKind.Function || f.kind === EntityKind.Subroutine || f.kind === EntityKind.Event)
      .map(f => f.name.toLowerCase())
  );

  // --- SD3: Tipos base inexistentes ---
  for (const fact of semanticFacts) {
    if (fact.kind === EntityKind.Type && fact.baseTypeName) {
      const baseLower = fact.baseTypeName.toLowerCase();
      if (!PB_BUILTIN_TYPES.has(baseLower) && !kb.findDefinition(baseLower)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(
            Position.create(fact.line, fact.character),
            Position.create(fact.line, fact.character + fact.name.length)
          ),
          message: `El tipo base '${fact.baseTypeName}' no se encuentra en el workspace ni en el catálogo del lenguaje.`,
          source: DIAGNOSTIC_SOURCE
        });
      }
    }
  }

  // --- SD2: Validación dentro de scopes Function/Event ---
  for (const rootScope of scopes) {
    visitScopes(rootScope, analysis.strippedLines, sections, diagnostics, kb, systemCatalog,
      hierarchyMemberNames, localCallables);
  }

  // --- SD4: Variables locales no usadas ---
  for (const rootScope of scopes) {
    checkUnusedLocals(rootScope, lines, diagnostics);
  }

  // --- SD5: Variables de instancia privadas no usadas ---
  checkUnusedPrivateInstanceVars(semanticFacts, lines, sections, diagnostics);

  // --- SD6: Shadowing (Spec 027 / B035) ---
  for (const rootScope of scopes) {
    checkShadowing(rootScope, semanticFacts, diagnostics);
  }

  return diagnostics;
}

/**
 * Recorre recursivamente los scopes Function/Event buscando llamadas a funciones
 * desconocidas (SD2). Los nombres locales del scope, miembros heredados y
 * callables del archivo se pasan precalculados para evitar costes repetidos.
 */
// Regex precompilada (antes se construía una nueva por cada línea visitada,
// con coste cuadrático en archivos grandes).
const SD2_CALL_REGEX = new RegExp(
  `\\b(?:(this|super)\\.)?(${PB_IDENTIFIER_SOURCE})\\s*\\(`,
  'gi'
);

function visitScopes(
  scope: import('../knowledge/types').Scope,
  strippedLines: string[],
  sections: import('../model/types').SectionRange[],
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  hierarchyMemberNames: Set<string>,
  localCallables: Set<string>
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    for (let i = scope.startLine + 1; i <= scope.endLine; i++) {
      const raw = strippedLines[i];
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;

      // Saltar secciones declarativas
      const enclosingSection = findEnclosingSection(i, sections);
      if (enclosingSection) continue;

      // Saltar líneas que son end/close de bloque, keywords puras, etc.
      if (END_GENERIC_PATTERN.test(trimmed) || ELSE_CASE_PATTERN.test(trimmed)) continue;

      // SD2: Detectar llamadas a funciones: identifier(
      SD2_CALL_REGEX.lastIndex = 0;
      let callMatch: RegExpExecArray | null;
      while ((callMatch = SD2_CALL_REGEX.exec(trimmed)) !== null) {
        const qualifier = callMatch[1]; // this | super | undefined
        const funcName = callMatch[2];
        const funcLower = funcName.toLowerCase();

        if (PB_KEYWORDS.has(funcLower)) continue;
        if (PB_BUILTIN_TYPES.has(funcLower)) continue; // create type()
        if (localCallables.has(funcLower)) continue;
        if (hierarchyMemberNames.has(funcLower)) continue;
        if (systemCatalog.findSystemSymbol(funcName).length > 0) continue;
        if (kb.findDefinition(funcName)) continue;

        // Si la llamada tiene un qualifier distinto de this/super, no validar aquí
        // Por ejemplo: dw_1.Retrieve() o obj.func()
        const matchStart = callMatch.index;
        const stringBefore = trimmed.substring(0, matchStart);
        if (stringBefore.endsWith('.') && !qualifier) continue;

        const col = raw.indexOf(funcName, raw.length - raw.trimStart().length);
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(
            Position.create(i, col >= 0 ? col : 0),
            Position.create(i, (col >= 0 ? col : 0) + funcName.length)
          ),
          message: `La función '${funcName}' no se encuentra en la jerarquía del objeto ni en el catálogo del lenguaje.`,
          source: DIAGNOSTIC_SOURCE
        });
      }
    }
  }

  // Recorrer scopes hijos
  for (const child of scope.children) {
    visitScopes(child, strippedLines, sections, diagnostics, kb, systemCatalog,
      hierarchyMemberNames, localCallables);
  }
}

/**
 * SD4: Detecta variables locales declaradas pero no usadas en el cuerpo del scope.
 * Excluye parámetros de función/evento (son contractuales).
 */
function checkUnusedLocals(
  scope: import('../knowledge/types').Scope,
  lines: string[],
  diagnostics: Diagnostic[]
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    for (const sym of scope.symbols) {
      // Excluir parámetros: están en la línea de declaración del scope (startLine)
      if (sym.line === scope.startLine) continue;

      const nameLower = sym.name.toLowerCase();
      let used = false;

      // Buscar si el nombre aparece en alguna línea del scope que NO sea su declaración
      for (let i = scope.startLine; i <= scope.endLine; i++) {
        if (i === sym.line) continue; // Saltar la línea de declaración
        const rawLine = lines[i] || '';
        const cleaned = stripCommentsAndStrings(rawLine).toLowerCase();
        // Búsqueda por word boundary para evitar coincidencias parciales
        const wordRegex = new RegExp(`\\b${escapeRegExp(nameLower)}\\b`, 'i');
        if (wordRegex.test(cleaned)) {
          used = true;
          break;
        }
      }

      if (!used) {
        diagnostics.push({
          severity: DiagnosticSeverity.Hint,
          range: Range.create(
            Position.create(sym.line, sym.character),
            Position.create(sym.line, sym.character + sym.name.length)
          ),
          message: `La variable local '${sym.name}' está declarada pero no se usa.`,
          source: DIAGNOSTIC_SOURCE,
          tags: [1] // DiagnosticTag.Unnecessary
        });
      }
    }
  }

  for (const child of scope.children) {
    checkUnusedLocals(child, lines, diagnostics);
  }
}

/**
 * SD5: Detecta variables de instancia privadas que no se referencian en ningún
 * método o evento del archivo.
 */
function checkUnusedPrivateInstanceVars(
  semanticFacts: import('../knowledge/types').Fact[],
  lines: string[],
  sections: import('../model/types').SectionRange[],
  diagnostics: Diagnostic[]
): void {
  const privateVars = semanticFacts.filter(
    f => f.kind === EntityKind.Variable
      && f.containerName
      && f.access === 'private'
  );

  for (const pv of privateVars) {
    const nameLower = pv.name.toLowerCase();
    let used = false;

    // Buscar el nombre en líneas fuera de secciones variables
    for (let i = 0; i < lines.length; i++) {
      if (i === pv.line) continue; // Saltar la declaración
      const enclosing = findEnclosingSection(i, sections);
      if (enclosing?.kind === 'variables') continue; // Saltar secciones de variables

      const lineLower = stripCommentsAndStrings(lines[i] || '').toLowerCase();
      const wordRegex = new RegExp(`\\b${escapeRegExp(nameLower)}\\b`, 'i');
      if (wordRegex.test(lineLower)) {
        used = true;
        break;
      }
    }

    if (!used) {
      diagnostics.push({
        severity: DiagnosticSeverity.Hint,
        range: Range.create(
          Position.create(pv.line, pv.character),
          Position.create(pv.line, pv.character + pv.name.length)
        ),
        message: `La variable de instancia privada '${pv.name}' no se usa en ningún método o evento del archivo.`,
        source: DIAGNOSTIC_SOURCE,
        tags: [1] // DiagnosticTag.Unnecessary
      });
    }
  }
}

/**
 * Escapa caracteres especiales para usar en RegExp.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Elimina comentarios `//` y reemplaza el contenido de cadenas `'...'`/`"..."`
 * por espacios del mismo largo, preservando posiciones para razonamiento sobre
 * uso real de identificadores. (Spec 026 / B034)
 */
export function stripCommentsAndStrings(line: string): string {
  const out: string[] = [];
  let i = 0;
  let inStr: '"' | "'" | null = null;
  while (i < line.length) {
    const c = line[i];
    if (inStr) {
      if (c === inStr) {
        out.push(c);
        inStr = null;
      } else {
        out.push(' ');
      }
      i++;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') {
      // Resto de la línea es comentario
      while (i < line.length) { out.push(' '); i++; }
      break;
    }
    if (c === '"' || c === "'") {
      out.push(c);
      inStr = c;
      i++;
      continue;
    }
    out.push(c);
    i++;
  }
  return out.join('');
}

/**
 * SD6: Detecta shadowing entre variables locales y variables globales/shared/instance
 * con el mismo nombre. Aplica el orden real de lookup (local → shared → global → instance).
 * (Spec 027 / B035)
 */
export function checkShadowing(
  scope: import('../knowledge/types').Scope,
  semanticFacts: import('../knowledge/types').Fact[],
  diagnostics: Diagnostic[]
): void {
  // Indexar facts por nombre y por scope. Solo Variables.
  const byName = new Map<string, import('../knowledge/types').Fact[]>();
  for (const f of semanticFacts) {
    if (f.kind !== EntityKind.Variable) continue;
    if (f.scope !== 'Global' && f.scope !== 'Compartida' && f.scope !== 'Instancia') continue;
    const key = f.name.toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(f);
    byName.set(key, list);
  }

  visit(scope);

  function visit(s: import('../knowledge/types').Scope): void {
    if (s.kind === ScopeKind.Function || s.kind === ScopeKind.Event) {
      for (const sym of s.symbols) {
        if (sym.line === s.startLine) continue; // parámetro
        const collisions = byName.get(sym.name.toLowerCase());
        if (!collisions || collisions.length === 0) continue;
        const winner = collisions[0];
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: Range.create(
            Position.create(sym.line, sym.character),
            Position.create(sym.line, sym.character + sym.name.length)
          ),
          message: `La variable local '${sym.name}' oculta una variable de ámbito '${winner.scope}'.`,
          source: DIAGNOSTIC_SOURCE
        });
      }
    }
    for (const child of s.children) visit(child);
  }
}
