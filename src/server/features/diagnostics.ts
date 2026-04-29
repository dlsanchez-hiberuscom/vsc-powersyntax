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
import { normalizeUri } from '../system/uriUtils';
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

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || LINE_COMMENT_PATTERN.test(line)) {
      continue;
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
      stack.push({ kind: 'prototypes', line: i, text: raw });
      continue;
    }

    if (PROTOTYPES_START_PATTERN.test(line)) {
      stack.push({ kind: 'prototypes', line: i, text: raw });
      continue;
    }

    if (VARIABLES_START_PATTERN.test(line)) {
      stack.push({ kind: 'variables', line: i, text: raw });
      continue;
    }

    if (FORWARD_START_PATTERN.test(line) && !FORWARD_PROTOTYPES_START_PATTERN.test(line)) {
      stack.push({ kind: 'forward', line: i, text: raw });
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
      // Solo IF multi-línea (termina en THEN al final de línea, no IF inline)
      if (IF_BLOCK_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'if', line: i, text: raw });
        continue;
      }

      if (FOR_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'for', line: i, text: raw });
        continue;
      }

      if (DO_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'do', line: i, text: raw });
        continue;
      }

      if (CHOOSE_CASE_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'choose-case', line: i, text: raw });
        continue;
      }

      if (TRY_OPEN_PATTERN.test(line)) {
        stack.push({ kind: 'try', line: i, text: raw });
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
 * - SD1: Variables no declaradas dentro de funciones/eventos.
 * - SD2: Llamadas a funciones/eventos inexistentes en la jerarquía.
 * - SD3: Tipos base inexistentes en `type ... from ...`.
 * - SD4: Variables locales no usadas.
 * - SD5: Variables de instancia privadas no usadas.
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
  const currentUri = normalizeUri(document.uri);

  // Encontrar el tipo principal del archivo
  const mainType = semanticFacts.find(f => f.kind === EntityKind.Type);
  const mainTypeName = mainType?.name;

  // Obtener todos los miembros de la jerarquía si hay tipo principal
  const hierarchyMembers = mainTypeName
    ? inheritanceGraph.getMembers(mainTypeName)
    : [];
  const hierarchyMemberNames = new Set(hierarchyMembers.map(m => m.name.toLowerCase()));

  // Obtener todas las variables de instancia del archivo (variables con containerName)
  const instanceVars = semanticFacts.filter(
    f => f.kind === EntityKind.Variable && f.containerName
  );
  const instanceVarNames = new Set(instanceVars.map(v => v.name.toLowerCase()));

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

  // --- SD1 + SD2: Validación dentro de scopes Function/Event ---
  for (const rootScope of scopes) {
    visitScopes(rootScope, lines, sections, diagnostics, kb, systemCatalog,
      instanceVarNames, hierarchyMemberNames, localCallables, currentUri);
  }

  // --- SD4: Variables locales no usadas ---
  for (const rootScope of scopes) {
    checkUnusedLocals(rootScope, lines, diagnostics);
  }

  // --- SD5: Variables de instancia privadas no usadas ---
  checkUnusedPrivateInstanceVars(semanticFacts, lines, sections, diagnostics);

  return diagnostics;
}

/**
 * Recorre recursivamente los scopes buscando violaciones SD1/SD2.
 */
function visitScopes(
  scope: import('../knowledge/types').Scope,
  lines: string[],
  sections: import('../model/types').SectionRange[],
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  instanceVarNames: Set<string>,
  hierarchyMemberNames: Set<string>,
  localCallables: Set<string>,
  currentUri: string
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    // Recoger los nombres conocidos en este scope
    const localSymbolNames = new Set(scope.symbols.map(s => s.name.toLowerCase()));

    for (let i = scope.startLine + 1; i <= scope.endLine; i++) {
      const raw = lines[i];
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed || LINE_COMMENT_PATTERN.test(trimmed)) continue;

      // Saltar secciones declarativas
      const enclosingSection = findEnclosingSection(i, sections);
      if (enclosingSection) continue;

      // Saltar líneas que son end/close de bloque, keywords puras, etc.
      if (END_GENERIC_PATTERN.test(trimmed) || ELSE_CASE_PATTERN.test(trimmed)) continue;

      // SD2: Detectar llamadas a funciones: identifier(
      const callRegex = new RegExp(`\\b(?:(this|super)\\.)?(${PB_IDENTIFIER_SOURCE})\\s*\\(`, 'gi');
      let callMatch;
      while ((callMatch = callRegex.exec(trimmed)) !== null) {
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
    visitScopes(child, lines, sections, diagnostics, kb, systemCatalog,
      instanceVarNames, hierarchyMemberNames, localCallables, currentUri);
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
        const lineLower = lines[i]?.toLowerCase() || '';
        // Búsqueda por word boundary para evitar coincidencias parciales
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
      && f.signature?.toLowerCase().includes('private')
  );

  for (const pv of privateVars) {
    const nameLower = pv.name.toLowerCase();
    let used = false;

    // Buscar el nombre en líneas fuera de secciones variables
    for (let i = 0; i < lines.length; i++) {
      if (i === pv.line) continue; // Saltar la declaración
      const enclosing = findEnclosingSection(i, sections);
      if (enclosing?.kind === 'variables') continue; // Saltar secciones de variables

      const lineLower = lines[i]?.toLowerCase() || '';
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
