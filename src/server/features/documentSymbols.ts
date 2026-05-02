import { DocumentSymbol, Position, Range, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { buildDataWindowLegacyDocumentSymbols } from './dataWindowLegacySafeMode';
import { createSectionSymbol, findEnclosingSection } from '../parsing/sections';
import {
  createSymbol
} from '../utils/helpers';
import {
  InternalDocumentSymbol,
  InternalDocumentSymbolKind,
} from '../model/types';
import { EntityKind, Scope, ScopeKind } from '../knowledge/types';

export interface DocumentSymbolReconciliationFinding {
  code:
    | 'type-block-missing-fact'
    | 'type-fact-missing-block'
    | 'type-block-orphan-container'
    | 'callable-fact-missing-scope'
    | 'callable-scope-missing-fact'
    | 'callable-fact-orphan-container'
    | 'callable-fact-outside-section';
  severity: 'warning' | 'error';
  message: string;
  subject?: string;
  detail?: string;
  line?: number;
}

export interface DocumentSymbolReconciliationCounts {
  sections: number;
  typeBlocks: number;
  typeFacts: number;
  callableFacts: number;
  callableScopes: number;
  outputRoots: number;
  outputSymbols: number;
}

export interface DocumentSymbolReconciliationReport {
  status: 'healthy' | 'warning' | 'error';
  summary: string;
  counts: DocumentSymbolReconciliationCounts;
  findings: DocumentSymbolReconciliationFinding[];
}

export interface ExtractDocumentSymbolsResult {
  symbols: DocumentSymbol[];
  reconciliation: DocumentSymbolReconciliationReport;
}

export function extractDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  return extractDocumentSymbolsWithReconciliation(document).symbols;
}

export function extractDocumentSymbolsWithReconciliation(document: TextDocument): ExtractDocumentSymbolsResult {
  if (document.uri.toLowerCase().endsWith('.srd')) {
    const symbols = buildDataWindowLegacyDocumentSymbols(document);
    return {
      symbols,
      reconciliation: {
        status: 'healthy',
        summary: 'DataWindow legacy safe mode sin reconciliación parser/snapshot adicional',
        counts: {
          sections: 0,
          typeBlocks: 0,
          typeFacts: 0,
          callableFacts: 0,
          callableScopes: 0,
          outputRoots: symbols.length,
          outputSymbols: countLspSymbols(symbols),
        },
        findings: [],
      },
    };
  }

  return extractDocumentSymbolsFromSnapshotWithReconciliation(getDocumentAnalysis(document).snapshot);
}

export function extractDocumentSymbolsFromSnapshot(
  snapshot: SemanticDocumentSnapshot
): DocumentSymbol[] {
  return extractDocumentSymbolsFromSnapshotWithReconciliation(snapshot).symbols;
}

export function extractDocumentSymbolsFromSnapshotWithReconciliation(
  snapshot: SemanticDocumentSnapshot
): ExtractDocumentSymbolsResult {
  const symbols = buildInternalDocumentSymbols(snapshot);
  sortSymbols(symbols);
  const lspSymbols = symbols.map(toLspDocumentSymbol);

  return {
    symbols: lspSymbols,
    reconciliation: buildDocumentSymbolReconciliation(snapshot, symbols),
  };
}

function buildInternalDocumentSymbols(
  snapshot: SemanticDocumentSnapshot
): InternalDocumentSymbol[] {
  const lines = snapshot.maskedText.lines;
  const sections = snapshot.containerModel.sections;
  const symbols: InternalDocumentSymbol[] = [];

  for (const section of sections) {
    symbols.push(createSectionSymbol(lines, section));
  }

  const callableScopes = flattenCallableScopes(snapshot.scopes);
  const typeSymbolsMap = new Map<string, InternalDocumentSymbol>();
  for (const typeBlock of [...snapshot.containerModel.typeBlocks].sort(byStartLine)) {
    const enclosingSection = findEnclosingSection(typeBlock.startLine, sections);
    if (enclosingSection?.kind === 'forward') {
      continue;
    }

    const typeFact = findTypeFact(snapshot, typeBlock.name, typeBlock.startLine);
    const symbol = createSymbol(
      typeBlock.name,
      InternalDocumentSymbolKind.Class,
      typeBlock.startLine,
      typeFact?.character ?? findNameStart(lines[typeBlock.startLine], typeBlock.name),
      typeBlock.endLine,
      lines[typeBlock.endLine]?.length ?? 0,
      buildTypeDetail(typeBlock, typeFact)
    );

    symbol.range.end.line = lines.length - 1;
    symbol.range.end.character = lines[lines.length - 1]?.length ?? 0;

    typeSymbolsMap.set(typeBlock.name.toLowerCase(), symbol);
    attachToContainer(symbols, typeSymbolsMap, typeBlock.container, symbol);
  }

  const callableFacts = snapshot.symbols
    .filter((fact) => !fact.isPrototype && isCallableKind(fact.kind))
    .sort((left, right) => left.line - right.line);

  for (const fact of callableFacts) {
    const scope = findCallableScope(callableScopes, fact.line, fact.kind);
    const endLine = scope?.endLine ?? fact.line;
    const symbol = createSymbol(
      fact.name,
      fact.kind === EntityKind.Event ? InternalDocumentSymbolKind.Event : InternalDocumentSymbolKind.Function,
      fact.line,
      fact.character,
      endLine,
      lines[endLine]?.length ?? fact.character + fact.name.length,
      fact.signature
    );

    attachToContainer(symbols, typeSymbolsMap, fact.containerName, symbol);
  }

  return symbols;
}

function buildDocumentSymbolReconciliation(
  snapshot: SemanticDocumentSnapshot,
  symbols: InternalDocumentSymbol[]
): DocumentSymbolReconciliationReport {
  const typeBlocks = [...snapshot.containerModel.typeBlocks];
  const sections = snapshot.containerModel.sections;
  const typeFacts = snapshot.symbols.filter((fact) => fact.kind === EntityKind.Type && !fact.isPrototype);
  const callableFacts = snapshot.symbols
    .filter((fact) => !fact.isPrototype && isCallableKind(fact.kind))
    .sort((left, right) => left.line - right.line);
  const callableScopes = flattenCallableScopes(snapshot.scopes);
  const findings: DocumentSymbolReconciliationFinding[] = [];

  const typeBlockKeys = new Set(typeBlocks.map((typeBlock) => typeBlockKey(typeBlock.name, typeBlock.startLine)));
  const typeBlockNames = new Set(typeBlocks.map((typeBlock) => typeBlock.name.toLowerCase()));
  const typeFactKeys = new Set(typeFacts.map((fact) => typeBlockKey(fact.name, fact.line)));
  const callableFactKeys = new Set(callableFacts.map((fact) => callableScopeKey(fact.line, scopeKindForFact(fact.kind))));
  const callableScopeKeys = new Set(callableScopes.map((scope) => callableScopeKey(scope.startLine, asCallableScopeKind(scope.kind))));

  for (const typeBlock of typeBlocks) {
    if (!typeFactKeys.has(typeBlockKey(typeBlock.name, typeBlock.startLine))) {
      findings.push({
        code: 'type-block-missing-fact',
        severity: 'warning',
        message: 'typeBlock sin fact semántico equivalente',
        subject: typeBlock.name,
        line: typeBlock.startLine,
      });
    }

    if (typeBlock.container && !typeBlockNames.has(typeBlock.container.toLowerCase())) {
      findings.push({
        code: 'type-block-orphan-container',
        severity: 'warning',
        message: 'typeBlock anidado apunta a un contenedor no presente en parser',
        subject: typeBlock.name,
        detail: typeBlock.container,
        line: typeBlock.startLine,
      });
    }
  }

  for (const fact of typeFacts) {
    if (!typeBlockKeys.has(typeBlockKey(fact.name, fact.line))) {
      findings.push({
        code: 'type-fact-missing-block',
        severity: 'warning',
        message: 'fact de tipo sin typeBlock equivalente en parser',
        subject: fact.name,
        line: fact.line,
      });
    }
  }

  for (const fact of callableFacts) {
    const scopeKind = scopeKindForFact(fact.kind);
    if (!callableScopeKeys.has(callableScopeKey(fact.line, scopeKind))) {
      findings.push({
        code: 'callable-fact-missing-scope',
        severity: 'warning',
        message: 'callable fact sin scope equivalente',
        subject: fact.name,
        line: fact.line,
      });
    }

    if (fact.containerName && !typeBlockNames.has(fact.containerName.toLowerCase())) {
      findings.push({
        code: 'callable-fact-orphan-container',
        severity: 'error',
        message: 'callable fact apunta a un contenedor ausente en parser/LSP',
        subject: fact.name,
        detail: fact.containerName,
        line: fact.line,
      });
    }

    if (!fact.containerName && !findEnclosingSection(fact.line, sections)) {
      findings.push({
        code: 'callable-fact-outside-section',
        severity: 'warning',
        message: 'callable top-level fuera de cualquier sección conocida',
        subject: fact.name,
        line: fact.line,
      });
    }
  }

  for (const scope of callableScopes) {
    if (!callableFactKeys.has(callableScopeKey(scope.startLine, asCallableScopeKind(scope.kind)))) {
      findings.push({
        code: 'callable-scope-missing-fact',
        severity: 'warning',
        message: 'scope callable sin fact semántico equivalente',
        subject: scope.id,
        line: scope.startLine,
      });
    }
  }

  const counts: DocumentSymbolReconciliationCounts = {
    sections: sections.length,
    typeBlocks: typeBlocks.length,
    typeFacts: typeFacts.length,
    callableFacts: callableFacts.length,
    callableScopes: callableScopes.length,
    outputRoots: symbols.length,
    outputSymbols: countInternalSymbols(symbols),
  };

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  const warningCount = findings.filter((finding) => finding.severity === 'warning').length;
  const status: DocumentSymbolReconciliationReport['status'] = errorCount > 0
    ? 'error'
    : warningCount > 0
      ? 'warning'
      : 'healthy';

  return {
    status,
    summary: findings.length === 0
      ? 'parser, symbol model y salida LSP reconciliados'
      : `${findings.length} inconsistencias parser/symbol/LSP (${warningCount} warning, ${errorCount} error)`,
    counts,
    findings,
  };
}

export function formatDocumentSymbolReconciliationReport(
  report: DocumentSymbolReconciliationReport
): string {
  if (report.findings.length === 0) {
    return `[documentSymbols/reconcile] ${report.summary}`;
  }

  const details = report.findings.slice(0, 4).map((finding) => {
    const line = typeof finding.line === 'number' ? `L${finding.line + 1}` : undefined;
    const subject = finding.subject ? `${finding.subject}` : undefined;
    const detail = finding.detail ? `(${finding.detail})` : undefined;
    return [finding.code, line, subject, detail].filter((part): part is string => Boolean(part)).join(' ');
  }).join(' | ');

  return `[documentSymbols/reconcile] ${report.status}: ${report.summary} | ${details}`;
}

function buildTypeDetail(
  typeBlock: SemanticDocumentSnapshot['containerModel']['typeBlocks'][number],
  typeFact: SemanticDocumentSnapshot['symbols'][number] | undefined
): string {
  if (typeFact?.signature) {
    return typeFact.signature;
  }

  const baseTypeName = typeFact?.baseTypeName ?? 'unknown';
  return typeBlock.container
    ? `type from ${baseTypeName} within ${typeBlock.container}`
    : `type from ${baseTypeName}`;
}

function findTypeFact(
  snapshot: SemanticDocumentSnapshot,
  typeName: string,
  startLine: number
): SemanticDocumentSnapshot['symbols'][number] | undefined {
  return snapshot.symbols.find(
    (fact) => fact.kind === EntityKind.Type
      && !fact.isPrototype
      && fact.line === startLine
      && fact.name.toLowerCase() === typeName.toLowerCase()
  );
}

function flattenCallableScopes(scopes: Scope[]): Scope[] {
  const out: Scope[] = [];
  const walk = (list: Scope[]) => {
    for (const scope of list) {
      if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
        out.push(scope);
      }
      if (scope.children.length > 0) {
        walk(scope.children);
      }
    }
  };

  walk(scopes);
  return out;
}

function findCallableScope(
  scopes: Scope[],
  line: number,
  kind: EntityKind
): Scope | undefined {
  const expectedKind = kind === EntityKind.Event ? ScopeKind.Event : ScopeKind.Function;
  return scopes.find((scope) => scope.startLine === line && scope.kind === expectedKind);
}

function findNameStart(line: string | undefined, name: string): number {
  if (!line) {
    return 0;
  }

  const index = line.toLowerCase().indexOf(name.toLowerCase());
  return index >= 0 ? index : 0;
}

function isCallableKind(kind: EntityKind): boolean {
  return kind === EntityKind.Function
    || kind === EntityKind.Subroutine
    || kind === EntityKind.Event;
}

function scopeKindForFact(kind: EntityKind): ScopeKind.Function | ScopeKind.Event {
  return kind === EntityKind.Event ? ScopeKind.Event : ScopeKind.Function;
}

function typeBlockKey(name: string, line: number): string {
  return `${name.toLowerCase()}@${line}`;
}

function callableScopeKey(line: number, kind: ScopeKind.Function | ScopeKind.Event): string {
  return `${kind}@${line}`;
}

function asCallableScopeKind(kind: ScopeKind): ScopeKind.Function | ScopeKind.Event {
  return kind === ScopeKind.Event ? ScopeKind.Event : ScopeKind.Function;
}

function attachToContainer(
  roots: InternalDocumentSymbol[],
  typeSymbolsMap: Map<string, InternalDocumentSymbol>,
  containerName: string | undefined,
  symbol: InternalDocumentSymbol
): void {
  const parent = containerName ? typeSymbolsMap.get(containerName.toLowerCase()) : undefined;
  if (parent) {
    parent.children.push(symbol);
    return;
  }

  roots.push(symbol);
}

function byStartLine(
  left: { startLine: number },
  right: { startLine: number }
): number {
  return left.startLine - right.startLine;
}

function sortSymbols(symbols: InternalDocumentSymbol[]): void {
  symbols.sort((left, right) => left.range.start.line - right.range.start.line);
  for (const symbol of symbols) {
    if (symbol.children && symbol.children.length > 0) {
      sortSymbols(symbol.children);
    }
  }
}

function countInternalSymbols(symbols: InternalDocumentSymbol[]): number {
  let total = 0;
  for (const symbol of symbols) {
    total += 1 + countInternalSymbols(symbol.children);
  }
  return total;
}

function countLspSymbols(symbols: DocumentSymbol[]): number {
  let total = 0;
  for (const symbol of symbols) {
    total += 1 + countLspSymbols(symbol.children ?? []);
  }
  return total;
}

function toLspDocumentSymbol(symbol: InternalDocumentSymbol): DocumentSymbol {
  return {
    name: symbol.name,
    kind: toLspSymbolKind(symbol.kind),
    detail: symbol.detail,
    range: Range.create(
      Position.create(symbol.range.start.line, symbol.range.start.character),
      Position.create(symbol.range.end.line, symbol.range.end.character),
    ),
    selectionRange: Range.create(
      Position.create(symbol.selectionRange.start.line, symbol.selectionRange.start.character),
      Position.create(symbol.selectionRange.end.line, symbol.selectionRange.end.character),
    ),
    children: symbol.children.map(toLspDocumentSymbol),
  };
}

function toLspSymbolKind(kind: InternalDocumentSymbolKind): SymbolKind {
  switch (kind) {
    case InternalDocumentSymbolKind.Namespace:
      return SymbolKind.Namespace;
    case InternalDocumentSymbolKind.Variable:
      return SymbolKind.Variable;
    case InternalDocumentSymbolKind.Function:
      return SymbolKind.Function;
    case InternalDocumentSymbolKind.Event:
      return SymbolKind.Event;
    case InternalDocumentSymbolKind.Class:
      return SymbolKind.Class;
    case InternalDocumentSymbolKind.Object:
      return SymbolKind.Object;
    case InternalDocumentSymbolKind.Field:
      return SymbolKind.Field;
    case InternalDocumentSymbolKind.String:
      return SymbolKind.String;
  }
}
