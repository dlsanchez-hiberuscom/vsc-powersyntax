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

    const name = /\bname\s*=\s*([A-Za-z_][\w$#%]*)/i.exec(body)?.[1]?.trim();
    const type = /\btype\s*=\s*([^\s)]+)/i.exec(body)?.[1]?.trim();
    if (name && type) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        columns.push({
          name,
          type,
          ...( /\bdbname\s*=\s*"([^"]+)"/i.exec(body)?.[1]?.trim()
            ? { dbName: /\bdbname\s*=\s*"([^"]+)"/i.exec(body)?.[1]?.trim() }
            : {}),
          ...( /\bupdate\s*=\s*(yes|no)/i.exec(body)?.[1]
            ? { update: /\bupdate\s*=\s*(yes|no)/i.exec(body)?.[1].toLowerCase() === 'yes' }
            : {}),
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