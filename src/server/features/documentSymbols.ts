import { DocumentSymbol, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { createSectionSymbol, findEnclosingSection } from '../parsing/sections';
import {
  createSymbol
} from '../utils/helpers';
import { EntityKind, Scope, ScopeKind } from '../knowledge/types';

export function extractDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  return extractDocumentSymbolsFromSnapshot(getDocumentAnalysis(document).snapshot);
}

export function extractDocumentSymbolsFromSnapshot(
  snapshot: SemanticDocumentSnapshot
): DocumentSymbol[] {
  const lines = snapshot.maskedText.lines;
  const sections = snapshot.containerModel.sections;
  const symbols: DocumentSymbol[] = [];

  for (const section of sections) {
    symbols.push(createSectionSymbol(lines, section));
  }

  const callableScopes = flattenCallableScopes(snapshot.scopes);
  const typeSymbolsMap = new Map<string, DocumentSymbol>();
  for (const typeBlock of [...snapshot.containerModel.typeBlocks].sort(byStartLine)) {
    const enclosingSection = findEnclosingSection(typeBlock.startLine, sections);
    if (enclosingSection?.kind === 'forward') {
      continue;
    }

    const typeFact = findTypeFact(snapshot, typeBlock.name, typeBlock.startLine);
    const symbol = createSymbol(
      typeBlock.name,
      SymbolKind.Class,
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
      fact.kind === EntityKind.Event ? SymbolKind.Event : SymbolKind.Function,
      fact.line,
      fact.character,
      endLine,
      lines[endLine]?.length ?? fact.character + fact.name.length,
      fact.signature
    );

    attachToContainer(symbols, typeSymbolsMap, fact.containerName, symbol);
  }

  sortSymbols(symbols);
  return symbols;
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

function attachToContainer(
  roots: DocumentSymbol[],
  typeSymbolsMap: Map<string, DocumentSymbol>,
  containerName: string | undefined,
  symbol: DocumentSymbol
): void {
  const parent = containerName ? typeSymbolsMap.get(containerName.toLowerCase()) : undefined;
  if (parent) {
    parent.children!.push(symbol);
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

function sortSymbols(symbols: DocumentSymbol[]): void {
  symbols.sort((left, right) => left.range.start.line - right.range.start.line);
  for (const symbol of symbols) {
    if (symbol.children && symbol.children.length > 0) {
      sortSymbols(symbol.children);
    }
  }
}
