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

  // 2. Buscar cualificador hacia atrás
  let qStart = start - 1;
  
  // Ignorar espacios en blanco antes del identifier
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0) {
    return { identifier };
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
    return { identifier };
  }

  // Ignorar espacios antes del separador
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0) {
    return { identifier };
  }

  const qualifierSpan = findPowerBuilderIdentifierSpan(lineText, qStart);
  if (!qualifierSpan) {
    return { identifier };
  }

  const qualifier = qualifierSpan.word;

  return { identifier, qualifier, separator };
}
