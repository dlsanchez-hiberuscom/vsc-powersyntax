import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

import {
  extractDataWindowRetrieveArguments,
  type DataWindowRetrieveArgument,
} from './dataWindowBindingModel';

export interface DataWindowSafeModeColumn {
  name: string;
  type: string;
  dbName?: string;
  update?: boolean;
}

export interface DataWindowSafeModeSummary {
  retrieve?: string;
  retrieveArguments: DataWindowRetrieveArgument[];
  columns: DataWindowSafeModeColumn[];
  bands: string[];
}

export function summarizeDataWindowSafeMode(
  snapshot: SemanticDocumentSnapshot | null
): DataWindowSafeModeSummary | null {
  if (!snapshot) {
    return null;
  }

  const text = snapshot.maskedText.lines.join('\n').replace(/~"/g, '"');
  const retrieve = extractRetrieve(text);
  const columns = extractColumns(text);
  const bands = extractBands(text);
  const retrieveArguments = extractDataWindowRetrieveArguments(snapshot);

  if (!retrieve && columns.length === 0 && bands.length === 0 && retrieveArguments.length === 0) {
    return null;
  }

  return {
    ...(retrieve ? { retrieve } : {}),
    retrieveArguments,
    columns,
    bands,
  };
}

function extractRetrieve(text: string): string | undefined {
  const match = /\bretrieve\s*=\s*"([^"]*)"/i.exec(text);
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

function extractColumns(text: string): DataWindowSafeModeColumn[] {
  const columns: DataWindowSafeModeColumn[] = [];
  const seen = new Set<string>();
  const marker = 'column=(';
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const start = text.toLowerCase().indexOf(marker, searchIndex);
    if (start < 0) {
      break;
    }

    const body = extractBalancedParenthesesContent(text, start + 'column='.length);
    if (!body) {
      break;
    }

    const name = extractColumnAttribute(body, 'name');
    const type = extractColumnAttribute(body, 'type');
    const dbName = extractColumnAttribute(body, 'dbname');
    const update = extractColumnAttribute(body, 'update');
    if (name && type) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        columns.push({
          name,
          type,
          ...(dbName ? { dbName } : {}),
          ...(update ? { update: update.toLowerCase() === 'yes' } : {}),
        });
      }
    }

    searchIndex = start + marker.length + body.length + 1;
  }

  return columns;
}

function extractBands(text: string): string[] {
  const bands = new Set<string>();
  const pattern = /\b(header|summary|footer|detail)\s*\(/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    bands.add(match[1].toLowerCase());
  }

  return [...bands];
}

function extractBalancedParenthesesContent(text: string, openParen: number): string | null {
  if (text[openParen] !== '(') {
    return null;
  }

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

function extractColumnAttribute(body: string, attribute: string): string | undefined {
  const match = new RegExp(`\\b${attribute}\\s*=\\s*`, 'i').exec(body);
  if (!match) {
    return undefined;
  }

  let index = match.index + match[0].length;
  if (index >= body.length) {
    return undefined;
  }

  if (body[index] === '"') {
    index++;
    let end = index;
    while (end < body.length && body[end] !== '"') {
      end++;
    }
    const value = body.slice(index, end).trim();
    return value || undefined;
  }

  let depth = 0;
  let end = index;
  while (end < body.length) {
    const char = body[end];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth === 0) {
        break;
      }
      depth--;
    } else if (/\s/.test(char) && depth === 0) {
      break;
    }
    end++;
  }

  const value = body.slice(index, end).trim();
  return value || undefined;
}