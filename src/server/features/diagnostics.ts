import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  type Connection
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  DIAGNOSTIC_CODES,
  getDiagnosticCode,
  withDiagnosticCode,
} from '../../shared/diagnosticCodes';
import { DIAGNOSTIC_SOURCE } from '../../shared/types';
import {
  buildDiagnosticMessageViewModels,
  formatDiagnosticMessageViewModels,
} from '../presentation/diagnosticPresentation';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { runExtraDiagnostics } from './diagnosticsExtra';
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
import {
  resolveQualifierType,
  type ResolvedTargetInfo,
} from '../knowledge/resolution/semanticQueryService';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { type SemanticQueryResult } from '../knowledge/resolution/semanticQueryResult';
import { EntityKind, ScopeKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';
import { buildHierarchyInspection } from './hierarchyInspection';
import { getQueryConsumerPolicy } from './queryScopePolicy';
import { getDocumentLineText } from '../utils/documentLineText';
import { buildCodeOnlyLines } from '../utils/comments';
import {
  extractDataObjectLiteral,
  isDataWindowOwnerType,
  resolveCatalogOwnerTypes,
  resolveDataWindowDefinitionTargets,
  resolveDataWindowRetrieveArguments,
  type DataWindowRetrieveArgument,
} from './dataWindowBindingModel';
import { buildDataWindowModel } from './dataWindowModel';
import { inspectPowerScriptDataWindowProperty } from './dataWindowPropertyPaths';
import {
  buildDiagnosticsSnapshot,
  type DiagnosticsSnapshot,
  type DiagnosticsSnapshotInputEntry,
} from './diagnosticsSnapshot';
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
  CATCH_PATTERN,
  FINALLY_PATTERN,
  END_GENERIC_PATTERN,
  ELSE_CASE_PATTERN,
  LINE_COMMENT_PATTERN
} from '../parsing/grammar';
import type { LogicalStatement } from '../parsing/statementSplitter';
import { execMemoized } from './regexMemoizer';
import { findObsoleteCalls } from './obsoleteDetector';
import {
  matchesEnumeratedPropertyContext,
  resolveExpectedEnumTypeForCallArgumentAtPosition,
} from './enumeratedContext';
import { localize } from '../nls';


export function publishDiagnostics(
  connection: Connection,
  document: TextDocument,
  kb?: KnowledgeBase,
  systemCatalog?: SystemCatalog,
  inheritanceGraph?: InheritanceGraph,
  workspaceState?: WorkspaceState,
  mode: 'syntactic' | 'full' = 'full'
): void {
  const merged = buildDiagnosticsForDocument(document, mode, kb, systemCatalog, inheritanceGraph);
  
  if (mode === 'full') {
    recordDiagnosticsSummary(document, merged, workspaceState);
  }

  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: merged
  });
}

const MAX_DIAGNOSTICS_PER_FILE = 500;

export function buildDiagnosticsForDocument(
  document: TextDocument,
  mode: 'syntactic' | 'full' = 'full',
  kb?: KnowledgeBase,
  systemCatalog?: SystemCatalog,
  inheritanceGraph?: InheritanceGraph
): Diagnostic[] {
  const structural = validateStructure(document);
  const obsolete = findObsoleteCalls(document.getText());
  
  if (mode === 'syntactic') {
    const all = applySeverityOverrides([...structural, ...obsolete]);
    const presented = formatDiagnosticMessageViewModels(buildDiagnosticMessageViewModels(all));
    return dedupAndCap(presented, MAX_DIAGNOSTICS_PER_FILE);
  }

  const semantic = (kb && systemCatalog && inheritanceGraph)
    ? validateSemantics(document, kb, systemCatalog, inheritanceGraph)
    : [];
  const extra = runExtraDiagnostics(document);
  const all = applySeverityOverrides([...structural, ...semantic, ...extra, ...obsolete]);
  const presented = formatDiagnosticMessageViewModels(buildDiagnosticMessageViewModels(all));
  return dedupAndCap(presented, MAX_DIAGNOSTICS_PER_FILE);
}

/**
 * Spec 116/B232: overrides de severidad por `diagnostic.code`, con fallback
 * al sufijo legacy en `source` (`PowerScript:SDxx`). El cliente puede definir el
 * env-var `PB_SEVERITY_OVERRIDES="SD11=hint,SD2=info"` para ajustar la
 * gravedad sin recompilar el servidor.
 */
const severityMap = new Map<string, DiagnosticSeverity>();
(() => {
  const raw = process.env.PB_SEVERITY_OVERRIDES;

  if (!raw) return;
  for (const part of raw.split(',')) {
    const [code, level] = part.split('=').map(s => s.trim());
    if (!code || !level) continue;
    const sev = parseSeverity(level);
    if (sev != null) severityMap.set(code.toLowerCase(), sev);
  }
})();

type DataObjectBindingState = 'missing' | 'ambiguous' | 'dynamic';

const DATAOBJECT_ASSIGN_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*DataObject\\s*=\\s*([^;]+)`,
  'gi'
);

function parseSeverity(level: string): DiagnosticSeverity | null {
  switch (level.toLowerCase()) {
    case 'error': return DiagnosticSeverity.Error;
    case 'warning':
    case 'warn': return DiagnosticSeverity.Warning;
    case 'info':
    case 'information': return DiagnosticSeverity.Information;
    case 'hint': return DiagnosticSeverity.Hint;
    default: return null;
  }
}

function applySeverityOverrides(diags: Diagnostic[]): Diagnostic[] {
  if (severityMap.size === 0) return diags;
  return diags.map(d => {
    const code = getDiagnosticCode(d)?.toLowerCase();
    if (!code) {
      return d;
    }
    const override = severityMap.get(code);
    return override != null ? { ...d, severity: override } : d;
  });
}

/**
 * Spec 117: contadores agregados de diagnósticos por URI. Sirven para
 * exponer un resumen vía custom command sin necesidad de re-publicar.
 */
const diagnosticsSummary = new Map<string, {
  diagnostics: readonly Diagnostic[];
  projectKey?: string;
  projectLabel?: string;
  objectKey?: string;
  objectLabel?: string;
  documentVersion?: number;
  snapshotVersion?: number;
  snapshotIdentity?: string;
}>();

function fallbackObjectLabel(uri: string): string {
  const normalized = uri.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const fileName = normalized.slice(normalized.lastIndexOf('/') + 1);
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName || uri;
}

function resolvePrimaryObject(snapshot: SemanticDocumentSnapshot, uri: string): { key: string; label: string } {
  const primary = snapshot.containerModel.typeBlocks.find((block) => !block.container)
    ?? snapshot.containerModel.typeBlocks[0];
  const label = primary?.name ?? fallbackObjectLabel(uri);
  return {
    key: label.toLowerCase(),
    label,
  };
}

function buildDiagnosticsSummaryEntry(
  document: TextDocument,
  merged: Diagnostic[],
  workspaceState?: WorkspaceState
): DiagnosticsSnapshotInputEntry {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const projectContext = workspaceState?.getProjectContextForFile(document.uri);
  const objectRef = resolvePrimaryObject(snapshot, document.uri);

  return {
    diagnostics: merged,
    projectKey: projectContext?.projectUri ?? '__workspace__',
    projectLabel: projectContext?.name ?? 'workspace',
    objectKey: objectRef.key,
    objectLabel: objectRef.label,
    documentVersion: document.version,
    snapshotVersion: snapshot.version,
    snapshotIdentity: snapshot.identity,
    sourceOrigin: workspaceState?.getSourceOrigin?.(document.uri),
  };
}

function recordDiagnosticsSummary(
  document: TextDocument,
  merged: Diagnostic[],
  workspaceState?: WorkspaceState
): void {
  if (merged.length === 0) {
    diagnosticsSummary.delete(document.uri);
    return;
  }

  diagnosticsSummary.set(document.uri, buildDiagnosticsSummaryEntry(document, merged, workspaceState));
}

export function clearDiagnosticsSummary(uri?: string): void {
  if (uri) {
    diagnosticsSummary.delete(uri);
    return;
  }

  diagnosticsSummary.clear();
}

export function getDiagnosticsSummary(uri?: string): DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null {
  if (uri) {
    const entry = diagnosticsSummary.get(uri);
    if (!entry) {
      return null;
    }

    return buildDiagnosticsSnapshot(new Map([[uri, entry]])).documents[0] ?? null;
  }

  return buildDiagnosticsSnapshot(diagnosticsSummary);
}

function dedupAndCap(diags: Diagnostic[], cap: number): Diagnostic[] {
  if (diags.length === 0) return diags;
  const seen = new Set<string>();
  const out: Diagnostic[] = [];
  for (const d of diags) {
    const key = `${d.range.start.line}:${d.range.start.character}:${d.severity ?? ''}:${d.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= cap) break;
  }
  return out;
}

export function validateStructure(document: TextDocument): Diagnostic[] {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const displayLines = snapshot.maskedText.lines;
  const lines = buildCodeOnlyLines(displayLines, snapshot.maskedText.masks);
  const sections = snapshot.containerModel.sections;
  const diagnostics: Diagnostic[] = [];
  const stack: Array<{ kind: BlockKind; line: number; text: string }> = [];

  // Acumulador para sentencias que usan continuación de línea (`&` al final).
  // Algunas construcciones (típicamente `IF ... THEN`) se escriben en varias
  // líneas y solo se cierran lógicamente al encontrar la última sin `&`.
  let contBuffer = '';
  let contStartLine = -1;
  let contStartText = '';

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const displayRaw = displayLines[i];
    const trimmedRaw = raw.trim();

    if (!trimmedRaw && contBuffer === '') {
      continue;
    }

    // Manejo de continuaciones: si la línea (ya sin comentarios) termina en `&`,
    // acumulamos y seguimos sin abrir/cerrar bloques todavía.
    if (trimmedRaw.endsWith('&')) {
      if (contStartLine < 0) {
        contStartLine = i;
        contStartText = displayRaw;
      }
      contBuffer += (contBuffer ? ' ' : '') + trimmedRaw.replace(/&\s*$/, '').trim();
      continue;
    }

    let logicalLineRaw: string;
    let logicalStartLine: number;
    let logicalStartText: string;
    if (contBuffer) {
      logicalLineRaw = (contBuffer + ' ' + trimmedRaw).trim();
      // Para diagnósticos preferimos señalar la primera línea de la sentencia.
      logicalStartLine = contStartLine;
      logicalStartText = contStartText;
      contBuffer = '';
      contStartLine = -1;
      contStartText = '';
    } else {
      logicalLineRaw = trimmedRaw;
      logicalStartLine = i;
      logicalStartText = displayRaw;
    }

    for (const segmentRaw of splitInlineStructureSegments(logicalLineRaw)) {
      const line = normalizeStructureLine(segmentRaw);
      if (!line) {
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
              Position.create(i, displayRaw.length)
            ),
            message: localize('closingBlockMismatch', "Se ha detectado un cierre de bloque '{0}' sin una apertura previa compatible.", closeKind),
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

      if (CATCH_PATTERN.test(line) || FINALLY_PATTERN.test(line)) {
        const top = stack[stack.length - 1];
        if (!top || top.kind !== 'try') {
          const clause = CATCH_PATTERN.test(line) ? 'catch' : 'finally';
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(
              Position.create(logicalStartLine, 0),
              Position.create(logicalStartLine, logicalStartText.length)
            ),
            message: localize('clauseInTryOnly', "La cláusula '{0}' solo puede utilizarse dentro de un bloque 'try'.", clause),
            source: DIAGNOSTIC_SOURCE
          });
        }
        continue;
      }

      if (ELSE_CASE_PATTERN.test(line)) {
        const top = stack[stack.length - 1];
        if (!top || (top.kind !== 'if' && top.kind !== 'choose-case')) {
          const match = line.match(ELSE_CASE_PATTERN);
          const clause = match ? match[1] : 'else';
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(
              Position.create(logicalStartLine, 0),
              Position.create(logicalStartLine, logicalStartText.length)
            ),
            message: localize('clauseInIfOrChooseOnly', "La cláusula '{0}' solo puede utilizarse dentro de un bloque 'if' o 'choose case'.", clause),
            source: DIAGNOSTIC_SOURCE
          });
        }
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

      const enclosingSection = findEnclosingSection(logicalStartLine, sections);

      if (enclosingSection?.kind === 'prototypes') {
        continue;
      }

      if (enclosingSection?.kind === 'variables') {
        continue;
      }

      if (isTypeDefinitionHeader(segmentRaw)) {
        stack.push({ kind: 'type', line: logicalStartLine, text: logicalStartText });
        continue;
      }

      if (!enclosingSection) {
        const fn = matchFunctionImplementationHeader(segmentRaw);
        if (fn) {
          stack.push({ kind: fn.kind, line: logicalStartLine, text: logicalStartText });
          continue;
        }

        const ev =
          matchEventImplementationHeader(segmentRaw) ?? matchOnImplementationHeader(segmentRaw);

        if (ev) {
          stack.push({ kind: 'event', line: logicalStartLine, text: logicalStartText });
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
  }

  for (const open of stack) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: Range.create(
        Position.create(open.line, 0),
        Position.create(open.line, open.text.length)
      ),
      message: localize('blockNotClosed', "El bloque '{0}' se encuentra abierto pero no ha sido cerrado correctamente.", open.kind),
      source: DIAGNOSTIC_SOURCE
    });
  }

  return diagnostics;
}

function splitInlineStructureSegments(line: string): string[] {
  return line
    .split(';')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function normalizeStructureLine(line: string): string {
  return line.trim().toLowerCase().replace(/\s+/g, ' ');
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
  const snapshot = getDocumentAnalysis(document).snapshot;
  const lines = snapshot.maskedText.lines;
  const codeOnlyLines = buildCodeOnlyLines(lines, snapshot.maskedText.masks);
  const sections = snapshot.containerModel.sections;
  const semanticFacts = snapshot.symbols;
  const scopes = snapshot.scopes;
  const diagnostics: Diagnostic[] = [];

  // Encontrar el tipo principal del archivo
  const mainType = semanticFacts.find(f => f.kind === EntityKind.Type);

  // --- SD3: Tipos base inexistentes ---
  for (const fact of semanticFacts) {
    if (fact.kind === EntityKind.Type && fact.baseTypeName) {
      const baseLower = fact.baseTypeName.toLowerCase();
      if (!PB_BUILTIN_TYPES.has(baseLower) && !kb.findDefinitionReadonly(baseLower) && !systemCatalog.isKnownOwnerType(baseLower)) {
        diagnostics.push(withDiagnosticCode({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(
            Position.create(fact.line, fact.character),
            Position.create(fact.line, fact.character + fact.name.length)
          ),
          message: localize('missingBaseType', "El tipo base '{0}' no se encuentra en el workspace ni en el catálogo del lenguaje.", fact.baseTypeName),
          source: DIAGNOSTIC_SOURCE
        }, DIAGNOSTIC_CODES.sd3MissingBaseType));
      }
    }
  }

  // --- SD2: Validación dentro de scopes Function/Event ---
  for (const rootScope of scopes) {
    visitScopes(snapshot, rootScope, document.uri, codeOnlyLines, sections, diagnostics, kb, systemCatalog, inheritanceGraph, mainType);
  }

  // --- SD4: Variables locales no usadas ---
  for (const rootScope of scopes) {
    checkUnusedLocals(rootScope, lines, diagnostics);
  }

  // --- SD5: Variables de instancia privadas no usadas ---
  checkUnusedPrivateInstanceVars(semanticFacts, lines, sections, diagnostics);

  // --- Dependencias nativas externas sin implementación interna ---
  checkExternalDependencies(semanticFacts, diagnostics);

  // --- B289: dependencias de expresiones DataWindow dentro del .srd ---
  checkDataWindowExpressionDiagnostics(document, diagnostics);

  // --- Binding transaccional/DataObject para DataStore y DataWindow ---
  if (mainType) {
    for (const rootScope of scopes) {
      checkDataObjectBindings(rootScope, document.uri, snapshot, mainType, diagnostics, kb, inheritanceGraph);
      checkDataWindowPropertyPathDiagnostics(rootScope, document, snapshot, diagnostics, kb);
      checkTransactionBindings(rootScope, document.uri, snapshot, mainType, diagnostics, kb, systemCatalog, inheritanceGraph);
      checkEnumeratedValueContextDiagnostics(rootScope, document, snapshot, mainType, diagnostics, kb, systemCatalog, inheritanceGraph);
    }
    checkLifecycleWarnings(mainType, semanticFacts, diagnostics, kb, inheritanceGraph, systemCatalog);
  }

  // --- SD6: Shadowing (Spec 027 / B035) ---
  for (const rootScope of scopes) {
    checkShadowing(rootScope, semanticFacts, diagnostics);
  }

  // --- SD8: Declaración duplicada en el mismo scope (Spec 078) ---
  for (const rootScope of scopes) {
    checkDuplicateDeclarations(rootScope, diagnostics);
  }

  // --- SD9: `return` fuera de función/evento (Spec 079) ---
  // --- SD10: `exit`/`continue` fuera de bucle (Spec 080) ---
  checkOrphanedFlowKeywords(snapshot, diagnostics, codeOnlyLines);

  return diagnostics;
}

function checkExternalDependencies(
  semanticFacts: import('../knowledge/types').Fact[],
  diagnostics: Diagnostic[]
): void {
  for (const fact of semanticFacts) {
    if (!fact.isExternal) {
      continue;
    }

    if (fact.kind !== EntityKind.Function && fact.kind !== EntityKind.Subroutine) {
      continue;
    }

    const isRpcFunction = fact.externalCallableKind === 'rpcfunc';
    const message = isRpcFunction
      ? localize('rpcfuncMissingImplementation', "La declaración RPCFUNC '{0}' apunta a un stored procedure DBMS{1} y no tiene implementación interna navegable.", fact.name, fact.externalAlias ? ` (alias '${fact.externalAlias}')` : '')
      : localize('externalMissingImplementation', "La declaración externa '{0}' apunta a la dependencia nativa '{1}' y no tiene implementación interna navegable.", fact.name, fact.externalLibraryName ?? 'unknown');

    diagnostics.push(withDiagnosticCode({
      severity: DiagnosticSeverity.Information,
      range: Range.create(
        Position.create(fact.line, fact.character),
        Position.create(fact.line, fact.character + fact.name.length)
      ),
      message,
      source: DIAGNOSTIC_SOURCE,
      data: {
        kind: 'native-dependency',
        dependencyKind: fact.externalCallableKind === 'rpcfunc' ? 'rpcfunc' : (fact.externalDependencyKind ?? 'unknown'),
        library: fact.externalLibraryName,
        alias: fact.externalAlias,
        externalCallableKind: fact.externalCallableKind ?? 'library'
      }
    }, DIAGNOSTIC_CODES.nativeDependency));
  }
}

function checkDataWindowExpressionDiagnostics(
  document: TextDocument,
  diagnostics: Diagnostic[],
): void {
  const model = buildDataWindowModel(document);
  if (!model) {
    return;
  }

  if (model.tableColumns.length === 0 && model.controls.length === 0) {
    return;
  }

  for (const expression of model.expressions) {
    for (const dependency of expression.dependencies) {
      if (dependency.kind !== 'unresolved') {
        continue;
      }

      diagnostics.push(withDiagnosticCode({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(
          Position.create(expression.selectionRange.start.line, expression.selectionRange.start.character),
          Position.create(expression.selectionRange.end.line, expression.selectionRange.end.character),
        ),
        message: localize('dataWindowExpressionUnresolved', "La expresión DataWindow '{0}' referencia '{1}' y no es resoluble de forma segura como columna o control del .srd.", expression.name, dependency.name),
        source: DIAGNOSTIC_SOURCE,
        data: {
          kind: 'datawindow-expression-dependency',
          confidence: 'medium',
          expression: expression.name,
          owner: expression.ownerName ?? expression.controlType,
          property: expression.propertyName,
          dependency: dependency.name,
        }
      }, DIAGNOSTIC_CODES.dataWindowExpressionDependencyUnresolved));
    }
  }
}

function checkLifecycleWarnings(
  mainType: import('../knowledge/types').Fact,
  semanticFacts: import('../knowledge/types').Fact[],
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph,
  systemCatalog: SystemCatalog
): void {
  const inspection = buildHierarchyInspection(mainType.name, inheritanceGraph, kb, systemCatalog);
  const focusType = mainType.name.toLowerCase();

  for (const phase of inspection.lifecycle) {
    if (phase.warnings.length === 0) {
      continue;
    }

    const eventFact = semanticFacts.find((fact) =>
      fact.kind === EntityKind.Event
      && fact.name.toLowerCase() === phase.phase
      && (fact.ownerName ?? fact.containerName)?.toLowerCase() === focusType
    );
    if (!eventFact) {
      continue;
    }

    for (const warningCode of phase.warnings) {
      diagnostics.push(buildLifecycleDiagnostic(eventFact, mainType.name, phase.phase, warningCode));
    }
  }
}

function buildLifecycleDiagnostic(
  eventFact: import('../knowledge/types').Fact,
  focusType: string,
  phase: 'create' | 'destroy',
  warningCode: string
): Diagnostic {
  const hook = phase === 'create' ? 'constructor' : 'destructor';

  let message = localize('lifecycleSuspicious', "El lifecycle '{0}' del objeto '{1}' tiene wiring sospechoso.", phase, focusType);
  if (warningCode === `missing-super-${phase}`) {
    message = localize('lifecycleMissingSuper', "El lifecycle '{0}' del objeto '{1}' no llama a super::{0} pese a tener ancestro directo.", phase, focusType);
  } else if (warningCode === `missing-trigger-${hook}`) {
    message = localize('lifecycleMissingTrigger', "El lifecycle '{0}' del objeto '{1}' declara el hook '{2}' pero no lo dispara con TriggerEvent(this, \"{2}\").", phase, focusType, hook);
  } else if (warningCode === `unresolved-${hook}`) {
    message = localize('lifecycleUnresolvedHook', "El lifecycle '{0}' del objeto '{1}' dispara el hook '{2}' pero no existe un event resoluble para ese hook.", phase, focusType, hook);
  }

  return withDiagnosticCode({
    severity: DiagnosticSeverity.Warning,
    range: Range.create(
      Position.create(eventFact.line, eventFact.character),
      Position.create(eventFact.line, eventFact.character + eventFact.name.length)
    ),
    message,
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'lifecycle-warning',
      code: warningCode,
      phase,
      focusType
    }
  }, warningCode);
}

type TransactionBindingState = 'known' | 'unknown' | 'dynamic';

function getDataObjectBindingDiagnosticCode(state: DataObjectBindingState): string {
  switch (state) {
    case 'missing':
      return DIAGNOSTIC_CODES.dataObjectNotFound;
    case 'ambiguous':
      return DIAGNOSTIC_CODES.dataObjectAmbiguous;
    case 'dynamic':
      return DIAGNOSTIC_CODES.dataObjectDynamic;
  }
}

function getTransactionBindingDiagnosticCode(
  state: Exclude<TransactionBindingState, 'known'> | 'missing'
): string {
  switch (state) {
    case 'missing':
      return DIAGNOSTIC_CODES.transactionBindingMissing;
    case 'unknown':
      return DIAGNOSTIC_CODES.transactionBindingUnknown;
    case 'dynamic':
      return DIAGNOSTIC_CODES.transactionBindingDynamic;
  }
}

interface TransactionBinding {
  state: TransactionBindingState;
  line: number;
  method: 'SetTransObject' | 'SetTrans';
  argument: string;
}

interface RetrieveArgumentBinding {
  dataObject: string;
  retrieveArguments: DataWindowRetrieveArgument[];
}

const SIMPLE_TRANSACTION_ARG_REGEX = new RegExp(`^${PB_IDENTIFIER_SOURCE}$`, 'i');
const TRANSACTION_BIND_CALL_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*(SetTransObject|SetTrans)\\s*\\(([^)]*)\\)`,
  'gi'
);
const TRANSACTION_OPERATION_CALL_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*(Retrieve|Update)\\s*\\(`,
  'gi'
);
const ENUMERATED_PROPERTY_ASSIGN_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*(${PB_IDENTIFIER_SOURCE})\\s*=\\s*(${PB_IDENTIFIER_SOURCE}!)`,
  'gi'
);
const ENUMERATED_VALUE_TOKEN_REGEX = new RegExp(`(${PB_IDENTIFIER_SOURCE}!)`, 'gi');

function checkTransactionBindings(
  scope: import('../knowledge/types').Scope,
  currentUri: string,
  snapshot: SemanticDocumentSnapshot,
  mainType: import('../knowledge/types').Fact,
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  inheritanceGraph: InheritanceGraph
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    const bindings = new Map<string, TransactionBinding>();
    const retrieveBindings = new Map<string, RetrieveArgumentBinding>();
    const statements = getLogicalStatementsForScope(snapshot, scope);

    for (const statement of statements) {
      const raw = statement.text;
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const line = statement.startLine;

      const dataObjectMatches = execMemoized(snapshot, DATAOBJECT_ASSIGN_REGEX, raw);
      for (const dataObjectMatch of dataObjectMatches) {
        const targetName = dataObjectMatch[1];
        const expression = dataObjectMatch[2].trim();
        const targetType = resolveQualifierType(targetName, currentUri, kb, line, mainType);

        if (!targetType || !isDataWindowOwnerType(targetType, inheritanceGraph)) {
          continue;
        }

        const bindingKey = targetName.toLowerCase();
        const literal = extractDataObjectLiteral(expression);
        if (!literal) {
          retrieveBindings.delete(bindingKey);
          continue;
        }

        const targets = resolveDataWindowDefinitionTargets(literal, kb);
        if (targets.length !== 1 || !kb.hasDocumentSnapshot(targets[0].uri)) {
          retrieveBindings.delete(bindingKey);
          continue;
        }

        retrieveBindings.set(bindingKey, {
          dataObject: literal,
          retrieveArguments: resolveDataWindowRetrieveArguments(literal, kb)
        });
      }

      const bindMatches = execMemoized(snapshot, TRANSACTION_BIND_CALL_REGEX, raw);
      for (const bindMatch of bindMatches) {
        const targetName = bindMatch[1];
        const methodName = bindMatch[2] as TransactionBinding['method'];
        const argument = bindMatch[3].trim();
        const targetType = resolveQualifierType(targetName, currentUri, kb, line, mainType);
        const ownerTypes = resolveCatalogOwnerTypes(targetType, inheritanceGraph);

        if (ownerTypes.length === 0 || !systemCatalog.resolveDataWindowFunctionForOwner(methodName, ownerTypes)) {
          continue;
        }

        bindings.set(targetName.toLowerCase(), classifyTransactionBinding(argument, currentUri, line, mainType, kb, inheritanceGraph));
      }

      const opMatches = execMemoized(snapshot, TRANSACTION_OPERATION_CALL_REGEX, raw);
      for (const operationMatch of opMatches) {
        const targetName = operationMatch[1];
        const operationName = operationMatch[2] as 'Retrieve' | 'Update';
        const targetType = resolveQualifierType(targetName, currentUri, kb, line, mainType);
        const ownerTypes = resolveCatalogOwnerTypes(targetType, inheritanceGraph);

        if (ownerTypes.length === 0 || !systemCatalog.resolveDataWindowFunctionForOwner(operationName, ownerTypes)) {
          continue;
        }

        const binding = bindings.get(targetName.toLowerCase());
        const col = findStatementAnchorColumn(statement, operationName);

        if (!binding) {
          diagnostics.push(buildTransactionDiagnostic(line, col, operationName, targetName, 'missing'));
        } else if (binding.state !== 'known') {
          diagnostics.push(buildTransactionDiagnostic(line, col, operationName, targetName, binding.state, binding));
        }

        if (operationName !== 'Retrieve') {
          continue;
        }

        const retrieveBinding = retrieveBindings.get(targetName.toLowerCase());
        if (!retrieveBinding) {
          continue;
        }

        const openParenCol = raw.indexOf('(', operationMatch.index);
        const actualArgumentCount = extractInvocationArgumentCount(raw, openParenCol);
        if (actualArgumentCount == null || actualArgumentCount === retrieveBinding.retrieveArguments.length) {
          continue;
        }

        diagnostics.push(
          buildRetrieveArgumentDiagnostic(
            line,
            col,
            targetName,
            retrieveBinding.dataObject,
            retrieveBinding.retrieveArguments,
            actualArgumentCount
          )
        );
      }
    }
  }

  for (const child of scope.children) {
    checkTransactionBindings(child, currentUri, snapshot, mainType, diagnostics, kb, systemCatalog, inheritanceGraph);
  }
}

function checkDataObjectBindings(
  scope: import('../knowledge/types').Scope,
  currentUri: string,
  snapshot: SemanticDocumentSnapshot,
  mainType: import('../knowledge/types').Fact,
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    const statements = getLogicalStatementsForScope(snapshot, scope);

    for (const statement of statements) {
      const raw = statement.text;
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const line = statement.startLine;

      const assignMatches = execMemoized(snapshot, DATAOBJECT_ASSIGN_REGEX, raw);
      for (const assignMatch of assignMatches) {
        const targetName = assignMatch[1];
        const expression = assignMatch[2].trim();
        const targetType = resolveQualifierType(targetName, currentUri, kb, line, mainType);

        if (!targetType || !isDataWindowOwnerType(targetType, inheritanceGraph)) {
          continue;
        }

        const expressionCol = findStatementAnchorColumn(statement, 'DataObject');
        const literal = extractDataObjectLiteral(expression);

        if (literal === undefined) {
          diagnostics.push(buildDataObjectBindingDiagnostic(line, expressionCol, targetName, 'dynamic', { expression }));
          continue;
        }

        if (!literal) {
          continue;
        }

        const targets = resolveDataWindowDefinitionTargets(literal, kb);
        if (targets.length === 1) {
          continue;
        }

        diagnostics.push(
          buildDataObjectBindingDiagnostic(
            line,
            expressionCol,
            targetName,
            targets.length === 0 ? 'missing' : 'ambiguous',
            { literal, targetCount: targets.length }
          )
        );
      }
    }
  }

  for (const child of scope.children) {
    checkDataObjectBindings(child, currentUri, snapshot, mainType, diagnostics, kb, inheritanceGraph);
  }
}

function checkDataWindowPropertyPathDiagnostics(
  scope: import('../knowledge/types').Scope,
  document: TextDocument,
  snapshot: SemanticDocumentSnapshot,
  diagnostics: Diagnostic[],
  kb: KnowledgeBase
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    const statements = getLogicalStatementsForScope(snapshot, scope);

    for (const statement of statements) {
      for (let line = statement.startLine; line <= statement.endLine; line++) {
        const inspection = inspectFirstDataWindowPropertyOnLine(document, line, kb);
        if (!inspection || inspection.resolved) {
          continue;
        }

        if (!shouldDiagnoseDataWindowPropertyPath(inspection.invocation.path, inspection.invocation.mode)) {
          continue;
        }

        diagnostics.push(buildDataWindowPropertyPathDiagnostic(
          line,
          inspection.invocation.pathRange.start.character,
          inspection.invocation.targetName,
          inspection.invocation.mode,
          inspection.invocation.path,
        ));
      }
    }
  }

  for (const child of scope.children) {
    checkDataWindowPropertyPathDiagnostics(child, document, snapshot, diagnostics, kb);
  }
}

function checkEnumeratedValueContextDiagnostics(
  scope: import('../knowledge/types').Scope,
  document: TextDocument,
  snapshot: SemanticDocumentSnapshot,
  mainType: import('../knowledge/types').Fact,
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  inheritanceGraph: InheritanceGraph,
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    const statements = getLogicalStatementsForScope(snapshot, scope);

    for (const statement of statements) {
      for (let lineOffset = 0; lineOffset < statement.rawLines.length; lineOffset++) {
        const rawLine = statement.rawLines[lineOffset];
        const line = statement.startLine + lineOffset;
        if (!rawLine || rawLine.trim().length === 0) {
          continue;
        }

        const propMatches = execMemoized(snapshot, ENUMERATED_PROPERTY_ASSIGN_REGEX, rawLine);
        for (const propertyMatch of propMatches) {
          const qualifier = propertyMatch[1];
          const propertyName = propertyMatch[2];
          const enumValueName = propertyMatch[3];
          const ownerType = resolveQualifierType(qualifier, document.uri, kb, line, mainType);
          const ownerTypes = resolveCatalogOwnerTypes(ownerType, inheritanceGraph);
          const expectedEnumType = systemCatalog.resolveEnumeratedType(propertyName);
          const actualEnumValue = systemCatalog.resolveEnumeratedValue(enumValueName);

          if (ownerTypes.length === 0 || !expectedEnumType || !actualEnumValue) {
            continue;
          }

          if (
            actualEnumValue.enumValueOf?.toLowerCase() === expectedEnumType.name.toLowerCase()
            && matchesEnumeratedPropertyContext(actualEnumValue, propertyName, ownerTypes)
          ) {
            continue;
          }

          const startChar = propertyMatch.index + propertyMatch[0].lastIndexOf(enumValueName);
          diagnostics.push(buildEnumeratedValueContextDiagnostic(
            line,
            startChar,
            enumValueName,
            expectedEnumType.name,
            actualEnumValue.enumValueOf,
            'property-assignment',
            `${qualifier}.${propertyName}`,
          ));
        }

        const valMatches = execMemoized(snapshot, ENUMERATED_VALUE_TOKEN_REGEX, rawLine);
        for (const valueMatch of valMatches) {
          const enumValueName = valueMatch[1];
          const actualEnumValue = systemCatalog.resolveEnumeratedValue(enumValueName);
          if (!actualEnumValue) {
            continue;
          }

          const tokenEnd = valueMatch.index + enumValueName.length;
          const expectedEnumType = resolveExpectedEnumTypeForCallArgumentAtPosition(
            document,
            Position.create(line, tokenEnd),
            kb,
            systemCatalog,
            inheritanceGraph,
          );
          if (!expectedEnumType) {
            continue;
          }

          if (systemCatalog.resolveEnumeratedValueForType(enumValueName, expectedEnumType)) {
            continue;
          }

          diagnostics.push(buildEnumeratedValueContextDiagnostic(
            line,
            valueMatch.index,
            enumValueName,
            expectedEnumType,
            actualEnumValue.enumValueOf,
            'call-argument',
          ));
        }
      }
    }
  }

  for (const child of scope.children) {
    checkEnumeratedValueContextDiagnostics(child, document, snapshot, mainType, diagnostics, kb, systemCatalog, inheritanceGraph);
  }
}

function buildEnumeratedValueContextDiagnostic(
  line: number,
  col: number,
  enumValueName: string,
  expectedEnumType: string,
  actualEnumType: string | undefined,
  context: 'property-assignment' | 'call-argument',
  target?: string,
): Diagnostic {
  const actualTypeSuffix = actualEnumType ? localize('actualTypeSuffix', " de tipo '{0}'", actualEnumType) : '';
  const message = context === 'property-assignment'
    ? localize('enumValueNotApplicable', "El valor enumerado '{0}'{1} no aplica a '{2}'; se esperaba un valor compatible con '{3}'.", enumValueName, actualTypeSuffix, target ?? 'la asignación', expectedEnumType)
    : localize('enumValueMismatch', "El valor enumerado '{0}'{1} no coincide con el tipo esperado '{2}' en esta llamada.", enumValueName, actualTypeSuffix, expectedEnumType);

  return withDiagnosticCode({
    severity: DiagnosticSeverity.Warning,
    range: Range.create(
      Position.create(line, Math.max(0, col)),
      Position.create(line, Math.max(0, col) + enumValueName.length)
    ),
    message,
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'enumerated-value-context',
      context,
      expectedEnumType,
      actualEnumType,
      value: enumValueName,
      target,
      confidence: 'high',
    }
  }, DIAGNOSTIC_CODES.enumValueContextMismatch);
}

function inspectFirstDataWindowPropertyOnLine(
  document: TextDocument,
  line: number,
  kb: KnowledgeBase,
): ReturnType<typeof inspectPowerScriptDataWindowProperty> {
  const lineText = getDocumentLineText(document, line);
  
  if (!/\b(?:object|describe|modify|getchild)\b|\.datawindow\./i.test(lineText)) {
    return null;
  }

  const candidateRegex = /[a-zA-Z_]\w*/gi;
  let match;
  while ((match = candidateRegex.exec(lineText)) !== null) {
    const inspection = inspectPowerScriptDataWindowProperty(document, Position.create(line, match.index), kb);
    if (inspection) {
      return inspection;
    }
  }
  
  return null;
}

function shouldDiagnoseDataWindowPropertyPath(
  path: string,
  mode: 'describe' | 'modify' | 'object' | 'getchild',
): boolean {
  const normalized = path.trim().toLowerCase();
  if (!normalized || normalized.endsWith('.')) {
    return false;
  }

  if (mode === 'getchild') {
    return true;
  }

  return normalized.endsWith('datawindow.table.select')
    || normalized.endsWith('datawindow.dataobject')
    || normalized.endsWith('dddw.name');
}

function buildDataWindowPropertyPathDiagnostic(
  line: number,
  col: number,
  targetName: string,
  mode: 'describe' | 'modify' | 'object' | 'getchild',
  path: string,
): Diagnostic {
  return withDiagnosticCode({
    severity: DiagnosticSeverity.Warning,
    range: Range.create(
      Position.create(line, Math.max(0, col)),
      Position.create(line, Math.max(0, col) + Math.max(1, path.length))
    ),
    message: localize('dataWindowPathUnresolved', "La ruta DataWindow '{0}' no es resoluble de forma segura para '{1}'.", path, targetName),
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'datawindow-property-path',
      confidence: 'medium',
      target: targetName,
      mode,
      path,
    }
  }, DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved);
}


function buildDataObjectBindingDiagnostic(
  line: number,
  col: number,
  targetName: string,
  state: DataObjectBindingState,
  options: {
    literal?: string;
    expression?: string;
    targetCount?: number;
  }
): Diagnostic {
  const startChar = col >= 0 ? col : 0;
  const highlight = state === 'dynamic' ? 'DataObject' : options.literal ?? 'DataObject';
  const range = Range.create(
    Position.create(line, startChar),
    Position.create(line, startChar + highlight.length)
  );

  if (state === 'dynamic') {
    return withDiagnosticCode({
      severity: DiagnosticSeverity.Hint,
      range,
      message: localize('dynamicDataObjectAssignment', "La asignación dinámica de DataObject en '{0}' impide una navegación fiable hacia un .srd.", targetName),
      source: DIAGNOSTIC_SOURCE,
      data: {
        kind: 'dataobject-binding',
        state,
        confidence: 'low',
        target: targetName,
        expression: options.expression
      }
    }, getDataObjectBindingDiagnosticCode(state));
  }

  return withDiagnosticCode({
    severity: state === 'missing' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Information,
    range,
    message: state === 'missing'
      ? localize('dataObjectLiteralNotFound', "El DataObject literal '{0}' asignado a '{1}' no se encuentra como .srd indexado en el workspace.", options.literal ?? 'unknown', targetName)
      : localize('dataObjectLiteralAmbiguous', "El DataObject literal '{0}' asignado a '{1}' no tiene un target único en el workspace; se degrada la confidence semántica.", options.literal ?? 'unknown', targetName),
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'dataobject-binding',
      state,
      confidence: 'medium',
      target: targetName,
      dataObject: options.literal,
      targetCount: options.targetCount
    }
  }, getDataObjectBindingDiagnosticCode(state));
}

function extractInvocationArgumentCount(
  statementText: string,
  openParenCol: number
): number | null {
  if (openParenCol < 0) {
    return null;
  }

  let text = '';
  let depth = 0;

  for (let col = openParenCol + 1; col < statementText.length; col++) {
    const char = statementText[col];
    if (char === '(') {
      depth++;
      text += char;
      continue;
    }

    if (char === ')') {
      if (depth === 0) {
        return countInvocationArguments(text);
      }

      depth--;
      text += char;
      continue;
    }

    text += char;
  }

  return null;
}

function getLogicalStatementsForScope(
  snapshot: SemanticDocumentSnapshot,
  scope: import('../knowledge/types').Scope
): LogicalStatement[] {
  return snapshot.logicalStatements.filter((statement) =>
    statement.endLine >= scope.startLine + 1 && statement.startLine <= scope.endLine
  );
}

function findStatementAnchorColumn(statement: LogicalStatement, token: string): number {
  const loweredToken = token.toLowerCase();
  for (const rawLine of statement.rawLines) {
    const index = rawLine.toLowerCase().indexOf(loweredToken);
    if (index >= 0) {
      return index;
    }
  }

  return 0;
}

function countInvocationArguments(text: string): number {
  if (text.trim().length === 0) {
    return 0;
  }

  let depth = 0;
  let count = 1;
  for (const char of text) {
    if (char === '(') {
      depth++;
      continue;
    }

    if (char === ')') {
      if (depth > 0) {
        depth--;
      }
      continue;
    }

    if (char === ',' && depth === 0) {
      count++;
    }
  }

  return count;
}

function buildRetrieveArgumentDiagnostic(
  line: number,
  col: number,
  targetName: string,
  dataObject: string,
  expectedArguments: readonly DataWindowRetrieveArgument[],
  actualArgumentCount: number
): Diagnostic {
  const range = Range.create(
    Position.create(line, Math.max(0, col)),
    Position.create(line, Math.max(0, col) + 'Retrieve'.length)
  );
  const expectedArgumentCount = expectedArguments.length;
  const expectedArgumentWord = expectedArgumentCount === 1 ? localize('argumentSingular', 'argumento') : localize('argumentPlural', 'argumentos');

  return withDiagnosticCode({
    severity: DiagnosticSeverity.Warning,
    range,
    message: localize('retrieveArityMismatch', "La llamada '{0}.Retrieve(...)' enlazada al DataObject '{1}' espera {2} {3} de retrieve y recibió {4}.", targetName, dataObject, expectedArgumentCount, expectedArgumentWord, actualArgumentCount),
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'dataobject-retrieve-args',
      confidence: 'high',
      target: targetName,
      dataObject,
      expectedArgumentCount,
      actualArgumentCount,
      expectedArguments: expectedArguments.map((argument) => argument.label)
    }
  }, DIAGNOSTIC_CODES.retrieveArityMismatch);
}

function classifyTransactionBinding(
  argument: string,
  currentUri: string,
  line: number,
  mainType: import('../knowledge/types').Fact,
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph
): TransactionBinding {
  if (!argument) {
    return { state: 'unknown', line, method: 'SetTransObject', argument };
  }

  if (SIMPLE_TRANSACTION_ARG_REGEX.test(argument)) {
    const qualifierType = resolveQualifierType(argument, currentUri, kb, line, mainType);
    if (qualifierType) {
      const ownerTypes = resolveCatalogOwnerTypes(qualifierType, inheritanceGraph);
      if (ownerTypes.includes('transaction')) {
        return { state: 'known', line, method: 'SetTransObject', argument };
      }
    }

    return { state: 'unknown', line, method: 'SetTransObject', argument };
  }

  return { state: 'dynamic', line, method: 'SetTransObject', argument };
}

function buildTransactionDiagnostic(
  line: number,
  col: number,
  operationName: 'Retrieve' | 'Update',
  targetName: string,
  state: Exclude<TransactionBindingState, 'known'> | 'missing',
  binding?: TransactionBinding
): Diagnostic {
  const startChar = col >= 0 ? col : 0;
  const range = Range.create(
    Position.create(line, startChar),
    Position.create(line, startChar + operationName.length)
  );

  if (state === 'dynamic') {
    return withDiagnosticCode({
      severity: DiagnosticSeverity.Hint,
      range,
      message: localize('dynamicTransactionBinding', "La operación '{0}.{1}()' usa un transaction object dinámico ('{2}'); se degrada la confidence semántica.", targetName, operationName, binding?.argument ?? 'unknown'),
      source: DIAGNOSTIC_SOURCE,
      data: {
        kind: 'transaction-binding',
        state,
        confidence: 'low',
        operation: operationName,
        target: targetName,
        argument: binding?.argument
      }
    }, getTransactionBindingDiagnosticCode(state));
  }

  return withDiagnosticCode({
    severity: DiagnosticSeverity.Warning,
    range,
    message: state === 'missing'
      ? localize('transactionBindingMissing', "La operación '{0}.{1}()' no está asociada a un transaction object conocido mediante SetTransObject/SetTrans o SQLCA.", targetName, operationName)
      : localize('transactionBindingUnresolved', "La operación '{0}.{1}()' referencia un transaction object no resuelto ('{2}').", targetName, operationName, binding?.argument ?? 'unknown'),
    source: DIAGNOSTIC_SOURCE,
    data: {
      kind: 'transaction-binding',
      state,
      confidence: 'low',
      operation: operationName,
      target: targetName,
      argument: binding?.argument
    }
  }, getTransactionBindingDiagnosticCode(state));
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
  snapshot: import('../analysis/semanticSnapshot').SemanticDocumentSnapshot,
  scope: import('../knowledge/types').Scope,
  currentUri: string,
  strippedLines: string[],
  sections: import('../model/types').SectionRange[],
  diagnostics: Diagnostic[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  inheritanceGraph: InheritanceGraph,
  mainType?: import('../knowledge/types').Fact,
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
      // Spec 081: en lugar de un `end\s+` genérico (que podía silenciar
      // accidentalmente cualquier construcción cuyo trim empiece por "end "),
      // comprobamos sólo los cierres reales conocidos.
      if (
        END_FUNCTION_PATTERN.test(trimmed) ||
        END_SUBROUTINE_PATTERN.test(trimmed) ||
        END_EVENT_PATTERN.test(trimmed) ||
        END_ON_PATTERN.test(trimmed) ||
        END_TYPE_PATTERN.test(trimmed) ||
        END_IF_PATTERN.test(trimmed) ||
        END_CHOOSE_PATTERN.test(trimmed) ||
        END_TRY_PATTERN.test(trimmed) ||
        ELSE_CASE_PATTERN.test(trimmed)
      ) continue;

      // SD2: Detectar llamadas a funciones: identifier(
      const callMatches = execMemoized(snapshot, SD2_CALL_REGEX, trimmed);
      for (const callMatch of callMatches) {
        const qualifier = callMatch[1]; // this | super | undefined
        const funcName = callMatch[2];
        const funcLower = funcName.toLowerCase();

        if (PB_KEYWORDS.has(funcLower)) continue;
        if (PB_BUILTIN_TYPES.has(funcLower)) continue; // create type()

        // Si la llamada tiene un qualifier distinto de this/super, no validar aquí
        // Por ejemplo: dw_1.Retrieve() o obj.func()
        const matchStart = callMatch.index;
        const stringBefore = trimmed.substring(0, matchStart);
        if (stringBefore.endsWith('.') && !qualifier) {
          const qualifiedTarget = extractQualifiedCallTargetName(stringBefore);
          const qualifiedTargetType = qualifiedTarget && mainType
            ? resolveQualifierType(qualifiedTarget, currentUri, kb, i, mainType)
            : undefined;

          if (
            qualifiedTarget
            && qualifiedTargetType
            && isDataWindowOwnerType(qualifiedTargetType, inheritanceGraph)
            && isDataWindowBehavioralCatalogSymbol(systemCatalog, funcName)
            && !systemCatalog.resolveDataWindowFunctionForOwner(funcName, resolveCatalogOwnerTypes(qualifiedTargetType, inheritanceGraph))
          ) {
            const col = raw.indexOf(funcName, raw.length - raw.trimStart().length);
            diagnostics.push(withDiagnosticCode({
              severity: DiagnosticSeverity.Warning,
              range: Range.create(
                Position.create(i, col >= 0 ? col : 0),
                Position.create(i, (col >= 0 ? col : 0) + funcName.length)
              ),
              message: localize('functionNotApplicable', "La función '{0}' no aplica al tipo '{1}' resuelto para '{2}'.", funcName, qualifiedTargetType, qualifiedTarget),
              source: DIAGNOSTIC_SOURCE,
              data: buildOwnerMismatchDiagnosticData(qualifiedTarget, qualifiedTargetType)
            }, DIAGNOSTIC_CODES.sd2UnresolvedCallable));
          }

          continue;
        }

        if (systemCatalog.findSystemSymbol(funcName).length > 0) continue;

        const facade = createSemanticQueryFacade({ kb, graph: inheritanceGraph, systemCatalog });
        const result = facade.resolveTarget(
          { uri: currentUri, lineCount: strippedLines.length, getText: () => '' } as any,
          Position.create(i, raw.indexOf(funcName)),
          {
            traceLabel: 'diagnostics:sd2',
            consumer: 'diagnostics-unresolved-callable'
          }
        );
        if (result.target || (result.alternatives?.ambiguousTargets?.length ?? 0) > 0) continue;

        const col = raw.indexOf(funcName, raw.length - raw.trimStart().length);
        diagnostics.push(withDiagnosticCode({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(
            Position.create(i, col >= 0 ? col : 0),
            Position.create(i, (col >= 0 ? col : 0) + funcName.length)
          ),
          message: `La función '${funcName}' no se encuentra en la jerarquía del objeto ni en el catálogo del lenguaje.`,
          source: DIAGNOSTIC_SOURCE,
          data: {
            reasonCodes: result.reasons,
            confidence: result.confidence.level
          }
        }, DIAGNOSTIC_CODES.sd2UnresolvedCallable));
      }
    }
  }

  // Recorrer scopes hijos
  for (const child of scope.children) {
      visitScopes(snapshot, child, currentUri, strippedLines, sections, diagnostics, kb, systemCatalog, inheritanceGraph, mainType);
  }
}

function buildResolutionDiagnosticData(resolution: ResolvedTargetInfo): Record<string, unknown> {
  return {
    kind: 'semantic-evidence',
    confidence: resolution.confidence,
    reasonCodes: resolution.reasonCodes,
    evidenceKinds: resolution.evidence.map((entry) => entry.kind),
    targetCount: resolution.targets.length,
    candidateCount: resolution.candidatePool.length,
    hasAmbiguity: resolution.evidence.some((entry) => entry.kind === 'distance-ambiguity')
  };
}

function buildOwnerMismatchDiagnosticData(qualifier: string, ownerType: string): Record<string, unknown> {
  return {
    kind: 'semantic-evidence',
    confidence: 'high',
    reasonCodes: ['owner-mismatch'],
    evidenceKinds: ['owner-mismatch'],
    targetCount: 0,
    candidateCount: 0,
    hasAmbiguity: false,
    qualifier,
    ownerType,
  };
}

function extractQualifiedCallTargetName(stringBefore: string): string | undefined {
  const match = /([A-Za-z_][\w$#%]*)\s*\.\s*$/.exec(stringBefore);
  return match?.[1];
}

function isDataWindowBehavioralCatalogSymbol(systemCatalog: SystemCatalog, funcName: string): boolean {
  return systemCatalog.findSystemSymbol(funcName).some((symbol) => symbol.domain === 'datawindow-functions');
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
        diagnostics.push(withDiagnosticCode({
          severity: DiagnosticSeverity.Hint,
          range: Range.create(
            Position.create(sym.line, sym.character),
            Position.create(sym.line, sym.character + sym.name.length)
          ),
          message: `La variable local '${sym.name}' está declarada pero no se usa.`,
          source: DIAGNOSTIC_SOURCE,
          tags: [1] // DiagnosticTag.Unnecessary
        }, DIAGNOSTIC_CODES.sd4UnusedLocal));
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
      diagnostics.push(withDiagnosticCode({
        severity: DiagnosticSeverity.Hint,
        range: Range.create(
          Position.create(pv.line, pv.character),
          Position.create(pv.line, pv.character + pv.name.length)
        ),
        message: `La variable de instancia privada '${pv.name}' no se usa en ningún método o evento del archivo.`,
        source: DIAGNOSTIC_SOURCE,
        tags: [1] // DiagnosticTag.Unnecessary
      }, DIAGNOSTIC_CODES.sd5UnusedPrivateInstance));
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
        diagnostics.push(withDiagnosticCode({
          severity: DiagnosticSeverity.Information,
          range: Range.create(
            Position.create(sym.line, sym.character),
            Position.create(sym.line, sym.character + sym.name.length)
          ),
          message: `La variable local '${sym.name}' oculta una variable de ámbito '${winner.scope}'.`,
          source: DIAGNOSTIC_SOURCE
        }, DIAGNOSTIC_CODES.sd6Shadowing));
      }
    }
    for (const child of s.children) visit(child);
  }
}

// ---------------------------------------------------------------------------
// SD8 — Declaración duplicada en el mismo scope (Spec 078)
// ---------------------------------------------------------------------------

/**
 * Reporta cuando dos símbolos locales del mismo scope tienen el mismo nombre
 * (case-insensitive). PowerScript no admite declarar dos veces la misma
 * variable en un único bloque y el compilador lo rechaza; aquí lo señalamos
 * como Warning para no bloquear edición en curso.
 */
function checkDuplicateDeclarations(
  scope: import('../knowledge/types').Scope,
  diagnostics: Diagnostic[]
): void {
  if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
    const seen = new Map<string, import('../knowledge/types').Entity>();
    for (const sym of scope.symbols) {
      const key = sym.name.toLowerCase();
      const prev = seen.get(key);
      if (prev && prev.line !== sym.line) {
        diagnostics.push(withDiagnosticCode({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(
            Position.create(sym.line, sym.character),
            Position.create(sym.line, sym.character + sym.name.length)
          ),
          message: `La variable '${sym.name}' ya está declarada en este ámbito (línea ${prev.line + 1}).`,
          source: DIAGNOSTIC_SOURCE
        }, DIAGNOSTIC_CODES.sd8DuplicateDeclaration));
      } else {
        seen.set(key, sym);
      }
    }
  }
  for (const child of scope.children) checkDuplicateDeclarations(child, diagnostics);
}

// ---------------------------------------------------------------------------
// SD9 / SD10 — flujo de control orphaned (Spec 079 / 080)
// ---------------------------------------------------------------------------

/**
 * Detecta:
 *  - SD9: `return` que aparece fuera de cualquier `function`/`subroutine`/`event`/`on`.
 *  - SD10: `exit` o `continue` fuera de un bucle (`for ... next` o `do ... loop`).
 *
 * Trabaja sobre el documento completo usando `controlBlocks` y los `scopes`
 * ya disponibles en el `DocumentAnalysis`.
 */
function checkOrphanedFlowKeywords(
  snapshot: SemanticDocumentSnapshot,
  diagnostics: Diagnostic[],
  strippedLines: string[] = snapshot.maskedText.lines
): void {
  const scopes = snapshot.scopes;
  const controlBlocks = snapshot.controlBlocks;
  const sections = snapshot.containerModel.sections;

  const isInsideCallable = (line: number): boolean => {
    const visit = (s: import('../knowledge/types').Scope): boolean => {
      if (line >= s.startLine && line <= s.endLine) {
        if (s.kind === ScopeKind.Function || s.kind === ScopeKind.Event) return true;
        for (const c of s.children) if (visit(c)) return true;
      }
      return false;
    };
    for (const r of scopes) if (visit(r)) return true;
    return false;
  };

  const isInsideLoop = (line: number): boolean => {
    for (const cb of controlBlocks) {
      if ((cb.kind === 'for' || cb.kind === 'do') && line >= cb.startLine && line <= cb.endLine) {
        return true;
      }
    }
    return false;
  };

  const RE_RETURN = /^\s*return\b/i;
  const RE_EXIT_OR_CONTINUE = /^\s*(exit|continue)\b/i;

  for (let i = 0; i < strippedLines.length; i++) {
    const line = strippedLines[i];
    if (!line) continue;
    // Saltar secciones declarativas
    const sec = findEnclosingSection(i, sections);
    if (sec) continue;

    if (RE_RETURN.test(line) && !isInsideCallable(i)) {
      diagnostics.push(withDiagnosticCode({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(Position.create(i, 0), Position.create(i, line.length)),
        message: `La sentencia 'return' aparece fuera de una función o evento.`,
        source: DIAGNOSTIC_SOURCE
      }, DIAGNOSTIC_CODES.sd9OrphanReturn));
      continue;
    }
    const m = RE_EXIT_OR_CONTINUE.exec(line);
    if (m && !isInsideLoop(i)) {
      diagnostics.push(withDiagnosticCode({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(Position.create(i, 0), Position.create(i, line.length)),
        message: `La sentencia '${m[1].toLowerCase()}' aparece fuera de un bucle 'for' o 'do'.`,
        source: DIAGNOSTIC_SOURCE
      }, DIAGNOSTIC_CODES.sd10OrphanLoopControl));
    }
  }
}
