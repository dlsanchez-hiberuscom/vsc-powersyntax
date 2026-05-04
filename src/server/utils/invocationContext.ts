import type { TextPosition } from '../model/types';
import { findPowerBuilderIdentifierSpan } from './pbIdentifier';

const EVENT_API_METHOD_PREFIX_RE = /([a-zA-Z_$#%][\w$#%-]*)\s*\.\s*(tabtriggerevent|tabpostevent|triggerevent|postevent)\s*\(\s*$/i;
const EVENT_API_GLOBAL_PREFIX_RE = /\b(tabtriggerevent|tabpostevent|triggerevent|postevent)\s*\(\s*([a-zA-Z_$#%][\w$#%-]*)\s*,\s*$/i;

export type InvocationSeparator = '.' | '::';

export interface InvocationContext {
  /** El identificador bajo el cursor (e.g. 'of_init') */
  identifier: string;
  /** El cualificador antes del punto o doble punto (e.g. 'this', 'super', 'my_var') */
  qualifier?: string;
  /** Separador sintáctico entre qualifier e identifier (`.` o `::`). */
  separator?: InvocationSeparator;
  /** Número de argumentos observables en la llamada, si el contexto lo permite inferir. */
  argumentCount?: number;
  /** Tipos literales inferibles de argumentos simples; posiciones no inferibles usan `unknown`. */
  argumentTypes?: string[];
}

function splitTopLevelArguments(argumentText: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let quote: '"' | "'" | null = null;
  let start = 0;

  for (let index = 0; index < argumentText.length; index++) {
    const char = argumentText[index]!;
    if (!quote && (char === '"' || char === "'")) {
      quote = char;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '(') {
      depth++;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === ',' && depth === 0) {
      args.push(argumentText.slice(start, index).trim());
      start = index + 1;
    }
  }

  args.push(argumentText.slice(start).trim());
  return args;
}

function inferArgumentType(argumentText: string): string {
  const trimmed = argumentText.trim();
  if (!trimmed) {
    return 'unknown';
  }
  if (/^(['"]).*\1$/s.test(trimmed)) {
    return 'string';
  }
  if (/^[+-]?\d+$/.test(trimmed)) {
    return 'integer';
  }
  if (/^[+-]?\d+\.\d+$/.test(trimmed)) {
    return 'decimal';
  }
  if (/^(true|false)$/i.test(trimmed)) {
    return 'boolean';
  }
  if (/^sqlca$/i.test(trimmed)) {
    return 'transaction';
  }
  return 'unknown';
}

function inferArgumentDetails(lineText: string, identifierEnd: number): { argumentCount: number; argumentTypes: string[] } | undefined {
  let cursor = identifierEnd;
  while (cursor < lineText.length && /\s/.test(lineText[cursor]!)) {
    cursor++;
  }

  if (lineText[cursor] !== '(') {
    return undefined;
  }

  const argumentStart = cursor + 1;
  cursor++;
  let depth = 0;
  let commaCount = 0;
  let sawArgumentToken = false;
  let quote: '"' | "'" | null = null;

  for (; cursor < lineText.length; cursor++) {
    const char = lineText[cursor]!;
    const next = lineText[cursor + 1];

    if (!quote && char === '/' && next === '/') {
      break;
    }

    if (!quote && (char === '"' || char === "'")) {
      quote = char;
      sawArgumentToken = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '(') {
      depth++;
      sawArgumentToken = true;
      continue;
    }

    if (char === ')') {
      if (depth === 0) {
        if (!sawArgumentToken && commaCount === 0) {
          return undefined;
        }
        const argumentText = lineText.slice(argumentStart, cursor);
        const argumentCount = sawArgumentToken ? commaCount + 1 : 0;
        const argumentTypes = argumentCount > 0
          ? splitTopLevelArguments(argumentText).map(inferArgumentType)
          : [];
        return { argumentCount, argumentTypes };
      }
      depth--;
      continue;
    }

    if (char === ',' && depth === 0) {
      commaCount++;
      continue;
    }

    if (!/\s/.test(char)) {
      sawArgumentToken = true;
    }
  }

  if (sawArgumentToken || commaCount > 0) {
    const argumentText = lineText.slice(argumentStart);
    return {
      argumentCount: commaCount + 1,
      argumentTypes: splitTopLevelArguments(argumentText).map(inferArgumentType)
    };
  }

  return undefined;
}

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

export function getEventApiInvocationContext(lines: string[], position: TextPosition): InvocationContext | null {
  const { line, character } = position;

  if (line < 0 || line >= lines.length) {
    return null;
  }

  const lineText = lines[line] ?? '';
  const literal = extractStringLiterals(lineText).find(
    (entry) => character > entry.start && character <= entry.end
  );
  if (!literal || literal.value.trim().length === 0) {
    return null;
  }

  const prefix = lineText.slice(0, literal.start).trimEnd();
  const methodMatch = EVENT_API_METHOD_PREFIX_RE.exec(prefix);
  if (methodMatch) {
    return {
      identifier: literal.value,
      qualifier: methodMatch[1],
      separator: '.'
    };
  }

  const globalMatch = EVENT_API_GLOBAL_PREFIX_RE.exec(prefix);
  if (globalMatch) {
    return {
      identifier: literal.value,
      qualifier: globalMatch[2]
    };
  }

  return null;
}

export function getInvocationContext(lines: string[], position: TextPosition): InvocationContext | null {
  const { line, character } = position;

  if (line < 0 || line >= lines.length) return null;

  const lineText = lines[line];
  const identifierSpan = findPowerBuilderIdentifierSpan(lineText, character);
  if (!identifierSpan) return null;

  const identifier = identifierSpan.word;
  const start = identifierSpan.start;
  const argumentDetails = inferArgumentDetails(lineText, identifierSpan.end);

  // 2. Buscar cualificador hacia atrás
  let qStart = start - 1;
  
  // Ignorar espacios en blanco antes del identifier
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0) {
    return { identifier, ...(argumentDetails ?? {}) };
  }

  // Comprobar si hay un separador '.' o '::'
  let hasSeparator = false;
  let separator: InvocationSeparator | undefined;
  if (lineText[qStart] === '.') {
    hasSeparator = true;
    separator = '.';
    qStart--;
  } else if (qStart >= 1 && lineText[qStart] === ':' && lineText[qStart - 1] === ':') {
    hasSeparator = true;
    separator = '::';
    qStart -= 2;
  }

  if (!hasSeparator) {
    return { identifier, ...(argumentDetails ?? {}) };
  }

  // Ignorar espacios antes del separador
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0) {
    return { identifier, separator, ...(argumentDetails ?? {}) };
  }

  const qualifierSpan = findPowerBuilderIdentifierSpan(lineText, qStart);
  if (!qualifierSpan) {
    return { identifier, separator, ...(argumentDetails ?? {}) };
  }

  const qualifier = qualifierSpan.word;

  return { identifier, qualifier, separator, ...(argumentDetails ?? {}) };
}
