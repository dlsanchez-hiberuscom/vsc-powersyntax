import type { ReferenceSource } from './references';

export type DynamicStringReferenceClassification = 'safe-literal' | 'probable' | 'dynamic' | 'unknown';

export interface DynamicStringReferenceHit {
  uri: string;
  line: number;
  classification: DynamicStringReferenceClassification;
  api?: string;
  literal: string;
}

const DYNAMIC_API_RE = /\b(postevent|triggerevent|tabpostevent|tabtriggerevent|describe|modify|evaluate|evaluatejavascriptasync|evaluatejavascriptsync|open|sendrequest|setrequestheader)\s*\(/i;
const DYNAMIC_SQL_RE = /\b(execute\s+immediate|prepare|declare)\b/i;
const DATAOBJECT_ASSIGN_RE = /\bdataobject\s*=/i;

function extractStringLiterals(line: string): Array<{ value: string; start: number; end: number }> {
  const literals: Array<{ value: string; start: number; end: number }> = [];
  let quote: '"' | '\'' | null = null;
  let start = -1;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (!quote && char === '/' && next === '/') {
      break;
    }

    if (!quote && (char === '"' || char === '\'')) {
      quote = char;
      start = index;
      continue;
    }

    if (quote && char === quote) {
      literals.push({ value: line.slice(start + 1, index), start, end: index });
      quote = null;
      start = -1;
    }
  }

  return literals;
}

function includesIdentifier(literal: string, identifier: string): boolean {
  return new RegExp(`\\b${identifier.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i').test(literal);
}

function classifyLiteral(line: string, literal: { value: string; start: number; end: number }): { classification: DynamicStringReferenceClassification; api?: string } {
  const apiMatch = DYNAMIC_API_RE.exec(line);
  if (apiMatch) {
    const hasConcatenation = /[+&]/.test(line.slice(0, literal.start)) || /[+&]/.test(line.slice(literal.end + 1));
    return {
      classification: hasConcatenation ? 'probable' : 'dynamic',
      api: apiMatch[1]?.toLowerCase()
    };
  }

  if (DYNAMIC_SQL_RE.test(line)) {
    return { classification: 'dynamic', api: 'dynamic-sql' };
  }

  if (DATAOBJECT_ASSIGN_RE.test(line)) {
    return { classification: 'dynamic', api: 'dataobject' };
  }

  if (/[$][.]|\[[^\]]+\]/.test(literal.value)) {
    return { classification: 'probable', api: 'json-path' };
  }

  if (/[+&]/.test(line.slice(0, literal.start)) || /[+&]/.test(line.slice(literal.end + 1))) {
    return { classification: 'unknown' };
  }

  return { classification: 'safe-literal' };
}

export function detectDynamicStringReferences(
  identifier: string,
  sources: Iterable<ReferenceSource>
): DynamicStringReferenceHit[] {
  const hits: DynamicStringReferenceHit[] = [];

  for (const source of sources) {
    const lines = source.lines ?? source.content.split(/\r?\n/);
    for (let line = 0; line < lines.length; line++) {
      for (const literal of extractStringLiterals(lines[line] ?? '')) {
        if (!includesIdentifier(literal.value, identifier)) {
          continue;
        }

        const classification = classifyLiteral(lines[line] ?? '', literal);
        hits.push({
          uri: source.uri,
          line,
          literal: literal.value,
          classification: classification.classification,
          ...(classification.api ? { api: classification.api } : {})
        });
      }
    }
  }

  return hits;
}

export function hasBlockingDynamicStringReference(identifier: string, sources: Iterable<ReferenceSource>): DynamicStringReferenceHit | null {
  return detectDynamicStringReferences(identifier, sources).find((hit) => hit.classification !== 'safe-literal') ?? null;
}