import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind, ScopeKind, type Fact, type Scope } from '../knowledge/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import type { LogicalStatement } from '../parsing/statementSplitter';
import {
  buildDataWindowModelFromSnapshot,
  type DataWindowRetrieveArgument,
} from './dataWindowModel';

const DATAOBJECT_ASSIGN_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*DataObject\\s*=\\s*([^;]+)`,
  'gi'
);
const DATAOBJECT_LITERAL_REGEX = /^("|')(.*?)\1$/;

export const DATAWINDOW_BIND_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);

export type { DataWindowRetrieveArgument } from './dataWindowModel';

export interface DataWindowBindingSummary {
  targetName: string;
  line: number;
  dataObject?: string | null;
  state: 'resolved' | 'missing' | 'ambiguous' | 'dynamic';
  targetUri?: string;
  retrieveArguments: DataWindowRetrieveArgument[];
}

export function extractDataObjectLiteral(expression: string): string | null | undefined {
  const match = DATAOBJECT_LITERAL_REGEX.exec(expression);
  if (!match) {
    return undefined;
  }

  const literal = match[2].trim();
  return literal.length > 0 ? literal : null;
}

export function findNearestDataObjectLiteralBinding(
  document: TextDocument,
  targetName: string,
  line: number
): string | null | undefined {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const callableScope = findCallableScopeAtLine(snapshot.scopes, line);
  const startLine = callableScope ? callableScope.startLine + 1 : 0;
  const targetId = targetName.toLowerCase();
  const statements = getLogicalStatementsInRange(snapshot, startLine, line - 1);

  for (let index = statements.length - 1; index >= 0; index--) {
    const raw = statements[index].text;
    DATAOBJECT_ASSIGN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATAOBJECT_ASSIGN_REGEX.exec(raw)) !== null) {
      if (match[1].toLowerCase() !== targetId) {
        continue;
      }

      return extractDataObjectLiteral(match[2].trim());
    }
  }

  return undefined;
}

export function resolveDataWindowDefinitionTargets(
  dataObjectName: string,
  kb: KnowledgeBase
): Fact[] {
  const normalizedName = dataObjectName.toLowerCase();
  return kb.findAllDefinitions(dataObjectName).filter((entity) =>
    entity.kind === EntityKind.Type
    && (
      (entity.baseTypeName ?? '').toLowerCase() === 'datawindow'
      || (entity.fileObjectName ?? '').toLowerCase() === normalizedName
      || entity.uri.toLowerCase().endsWith('.srd')
    )
  );
}

export function resolveDataWindowRetrieveArguments(
  dataObjectName: string,
  kb: KnowledgeBase
): DataWindowRetrieveArgument[] {
  const targets = resolveDataWindowDefinitionTargets(dataObjectName, kb);
  if (targets.length !== 1) {
    return [];
  }

  return extractDataWindowRetrieveArguments(kb.getDocumentSnapshot(targets[0].uri));
}

export function extractDataWindowRetrieveArguments(
  snapshot: SemanticDocumentSnapshot | null
): DataWindowRetrieveArgument[] {
  return buildDataWindowModelFromSnapshot(snapshot)?.retrieveArguments ?? [];
}

export function collectDataObjectBindings(
  snapshot: SemanticDocumentSnapshot,
  kb: KnowledgeBase,
  startLine = 0,
  endLine = snapshot.maskedText.lines.length - 1
): DataWindowBindingSummary[] {
  if (!snapshot || snapshot.maskedText.lines.length === 0) {
    return [];
  }

  const bindings: DataWindowBindingSummary[] = [];
  const effectiveStart = Math.max(0, startLine);
  const effectiveEnd = Math.min(snapshot.maskedText.lines.length - 1, endLine);
  const statements = getLogicalStatementsInRange(snapshot, effectiveStart, effectiveEnd);

  for (const statement of statements) {
    const raw = statement.text;
    if (!raw) {
      continue;
    }

    DATAOBJECT_ASSIGN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATAOBJECT_ASSIGN_REGEX.exec(raw)) !== null) {
      const targetName = match[1];
      const expression = match[2].trim();
      const literal = extractDataObjectLiteral(expression);
      const line = statement.startLine;

      if (literal === undefined) {
        bindings.push({
          targetName,
          line,
          state: 'dynamic',
          retrieveArguments: []
        });
        continue;
      }

      if (literal === null) {
        bindings.push({
          targetName,
          line,
          dataObject: literal,
          state: 'missing',
          retrieveArguments: []
        });
        continue;
      }

      const targets = resolveDataWindowDefinitionTargets(literal, kb);
      const state = targets.length === 0
        ? 'missing'
        : targets.length === 1
          ? 'resolved'
          : 'ambiguous';
      bindings.push({
        targetName,
        line,
        dataObject: literal,
        state,
        ...(targets.length === 1 ? { targetUri: targets[0].uri } : {}),
        retrieveArguments: state === 'resolved' ? resolveDataWindowRetrieveArguments(literal, kb) : []
      });
    }
  }

  return bindings;
}

function getLogicalStatementsInRange(
  snapshot: SemanticDocumentSnapshot,
  startLine: number,
  endLine: number
): LogicalStatement[] {
  if (endLine < startLine) {
    return [];
  }

  return snapshot.logicalStatements.filter((statement) =>
    statement.endLine >= startLine && statement.startLine <= endLine
  );
}

function findCallableScopeAtLine(scopes: readonly Scope[], line: number): Scope | null {
  const visit = (entries: readonly Scope[], currentCallable: Scope | null): Scope | null => {
    for (const scope of entries) {
      if (line < scope.startLine || line > scope.endLine) {
        continue;
      }

      const nextCallable = scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event
        ? scope
        : currentCallable;
      const nested = visit(scope.children, nextCallable);
      return nested ?? nextCallable;
    }

    return currentCallable;
  };

  return visit(scopes, null);
}

