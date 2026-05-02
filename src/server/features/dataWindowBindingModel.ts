import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind, ScopeKind, type Fact, type Scope } from '../knowledge/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';

const DATAOBJECT_ASSIGN_REGEX = new RegExp(
  `\\b(${PB_IDENTIFIER_SOURCE})\\s*\\.\\s*DataObject\\s*=\\s*([^;]+)`,
  'gi'
);
const DATAOBJECT_LITERAL_REGEX = /^("|')(.*?)\1$/;

export const DATAWINDOW_BIND_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);

export interface DataWindowRetrieveArgument {
  name: string;
  type: string;
  label: string;
}

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

  for (let currentLine = line - 1; currentLine >= startLine; currentLine--) {
    const raw = snapshot.maskedText.lines[currentLine];
    if (!raw) {
      continue;
    }

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
  if (!snapshot) {
    return [];
  }

  const normalizedText = snapshot.maskedText.lines.join('\n').replace(/~"/g, '"');
  const byArgumentsClause = extractArgumentsClause(normalizedText);
  if (byArgumentsClause.length > 0) {
    return byArgumentsClause;
  }

  return extractArgEntries(normalizedText);
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

  for (let line = effectiveStart; line <= effectiveEnd; line++) {
    const raw = snapshot.maskedText.lines[line];
    if (!raw) {
      continue;
    }

    DATAOBJECT_ASSIGN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATAOBJECT_ASSIGN_REGEX.exec(raw)) !== null) {
      const targetName = match[1];
      const expression = match[2].trim();
      const literal = extractDataObjectLiteral(expression);

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

function extractArgumentsClause(text: string): DataWindowRetrieveArgument[] {
  const match = /\barguments\s*=\s*\(/i.exec(text);
  if (!match) {
    return [];
  }

  const openParen = text.indexOf('(', match.index);
  if (openParen < 0) {
    return [];
  }

  const clause = extractBalancedParenthesesContent(text, openParen);
  return clause ? parseArgumentsClause(clause) : [];
}

function extractBalancedParenthesesContent(text: string, openParen: number): string | null {
  let depth = 0;
  for (let i = openParen; i < text.length; i++) {
    const char = text[i];
    if (char === '(') {
      depth++;
      continue;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        return text.slice(openParen + 1, i);
      }
    }
  }

  return null;
}

function parseArgumentsClause(clause: string): DataWindowRetrieveArgument[] {
  const args: DataWindowRetrieveArgument[] = [];
  const pattern = /\(\s*"([^"]+)"\s*,\s*([A-Za-z_][\w$#%]*)\s*\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clause)) !== null) {
    const name = match[1].trim();
    const type = match[2].trim();
    if (!name || !type) {
      continue;
    }

    args.push({
      name,
      type,
      label: `${type} ${name}`
    });
  }

  return args;
}

function extractArgEntries(text: string): DataWindowRetrieveArgument[] {
  const args: DataWindowRetrieveArgument[] = [];
  const seen = new Set<string>();
  const pattern = /ARG\s*\(([^)]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const body = match[1];
    const nameMatch = /NAME\s*=\s*"([^"]+)"/i.exec(body);
    const typeMatch = /TYPE\s*=\s*([A-Za-z_][\w$#%]*)/i.exec(body);
    const name = nameMatch?.[1]?.trim();
    const type = typeMatch?.[1]?.trim();
    if (!name || !type) {
      continue;
    }

    const key = `${name.toLowerCase()}:${type.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    args.push({
      name,
      type,
      label: `${type} ${name}`
    });
  }

  return args;
}