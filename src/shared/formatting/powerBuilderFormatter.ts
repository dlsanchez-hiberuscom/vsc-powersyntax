export type PowerBuilderFormatterCaseMode = 'preserve' | 'upper' | 'lower';
export type PowerBuilderFormatterIndentStyle = 'spaces' | 'tabs';
export type PowerBuilderFormatterBlankLineMode = 'preserve' | 'compact';

export interface PowerBuilderFormatterOptions {
  keywordCase?: PowerBuilderFormatterCaseMode;
  statementCase?: PowerBuilderFormatterCaseMode;
  typeCase?: PowerBuilderFormatterCaseMode;
  eventKeywordCase?: PowerBuilderFormatterCaseMode;
  indentStyle?: PowerBuilderFormatterIndentStyle;
  indentSize?: number;
  trimTrailingWhitespace?: boolean;
  spaceAfterComma?: boolean;
  spaceAroundOperators?: boolean;
  normalizeBlankLines?: PowerBuilderFormatterBlankLineMode;
}

interface ResolvedFormatterOptions {
  keywordCase: PowerBuilderFormatterCaseMode;
  statementCase: PowerBuilderFormatterCaseMode;
  typeCase: PowerBuilderFormatterCaseMode;
  eventKeywordCase: PowerBuilderFormatterCaseMode;
  indentStyle: PowerBuilderFormatterIndentStyle;
  indentSize: number;
  trimTrailingWhitespace: boolean;
  spaceAfterComma: boolean;
  spaceAroundOperators: boolean;
  normalizeBlankLines: PowerBuilderFormatterBlankLineMode;
}

const EVENT_KEYWORDS = [
  'end event',
  'end on',
  'event',
  'on'
] as const;

const TYPE_KEYWORDS = [
  'forward prototypes',
  'type variables',
  'type prototypes',
  'forward global type',
  'global type',
  'end prototypes',
  'end variables',
  'end forward',
  'end type'
] as const;

const STATEMENT_KEYWORDS = [
  'choose case',
  'case else',
  'end choose',
  'end function',
  'end if',
  'end subroutine',
  'end try',
  'using local',
  'elseif',
  'finally',
  'return',
  'catch',
  'while',
  'throw',
  'throws',
  'create',
  'destroy',
  'case',
  'else',
  'then',
  'next',
  'loop',
  'with ur',
  'and',
  'or',
  'not',
  'if',
  'try',
  'for',
  'do'
] as const;

const DEDENT_PATTERNS = [
  /^end\s+if\b/i,
  /^end\s+choose\b/i,
  /^end\s+try\b/i,
  /^end\s+function\b/i,
  /^end\s+subroutine\b/i,
  /^end\s+event\b/i,
  /^end\s+on\b/i,
  /^end\s+type\b/i,
  /^end\s+prototypes\b/i,
  /^end\s+variables\b/i,
  /^end\s+forward\b/i,
  /^next\b/i,
  /^loop\b/i,
  /^else(?:if)?\b/i,
  /^case(?:\s+else)?\b/i,
  /^catch\b/i,
  /^finally\b/i,
] as const;

const OPEN_PATTERNS = [
  /^if\b.*\bthen\b/i,
  /^choose\s+case\b/i,
  /^try\b/i,
  /^for\b/i,
  /^do\b/i,
  /^else(?:if)?\b/i,
  /^case(?:\s+else)?\b/i,
  /^catch\b/i,
  /^finally\b/i,
  /^(?:public|private|protected|global|shared)?\s*(?:function|subroutine)\b.*;\s*$/i,
  /^event\b.*;\s*$/i,
  /^on\b.+/i,
  /^global\s+type\b/i,
  /^forward\s+global\s+type\b/i,
  /^forward\s+prototypes\b/i,
  /^type\s+variables\b/i,
  /^type\s+prototypes\b/i,
] as const;

function normalizeCaseMode(value: string | undefined, fallback: PowerBuilderFormatterCaseMode): PowerBuilderFormatterCaseMode {
  return value === 'upper' || value === 'lower' || value === 'preserve' ? value : fallback;
}

function normalizeIndentStyle(value: string | undefined): PowerBuilderFormatterIndentStyle {
  return value === 'tabs' ? 'tabs' : 'spaces';
}

function resolveOptions(options: PowerBuilderFormatterOptions = {}): ResolvedFormatterOptions {
  const keywordCase = normalizeCaseMode(options.keywordCase, 'preserve');
  return {
    keywordCase,
    statementCase: normalizeCaseMode(options.statementCase, keywordCase),
    typeCase: normalizeCaseMode(options.typeCase, keywordCase),
    eventKeywordCase: normalizeCaseMode(options.eventKeywordCase, keywordCase),
    indentStyle: normalizeIndentStyle(options.indentStyle),
    indentSize: Number.isFinite(options.indentSize) && (options.indentSize ?? 0) > 0 ? Math.trunc(options.indentSize!) : 3,
    trimTrailingWhitespace: options.trimTrailingWhitespace !== false,
    spaceAfterComma: options.spaceAfterComma !== false,
    spaceAroundOperators: options.spaceAroundOperators !== false,
    normalizeBlankLines: options.normalizeBlankLines === 'compact' ? 'compact' : 'preserve',
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyCase(value: string, mode: PowerBuilderFormatterCaseMode): string {
  if (mode === 'upper') {
    return value.toUpperCase();
  }
  if (mode === 'lower') {
    return value.toLowerCase();
  }
  return value;
}

function transformOutsideStrings(text: string, transform: (segment: string) => string): string {
  let result = '';
  let segmentStart = 0;
  let quote: '"' | '\'' | null = null;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (!quote && (char === '"' || char === '\'')) {
      result += transform(text.slice(segmentStart, index));
      quote = char;
      segmentStart = index;
      continue;
    }

    if (quote && char === quote) {
      result += text.slice(segmentStart, index + 1);
      quote = null;
      segmentStart = index + 1;
    }
  }

  if (segmentStart < text.length) {
    result += quote ? text.slice(segmentStart) : transform(text.slice(segmentStart));
  }

  return result;
}

function replaceKeywordPhrases(text: string, phrases: readonly string[], mode: PowerBuilderFormatterCaseMode): string {
  if (mode === 'preserve') {
    return text;
  }

  const sorted = [...phrases].sort((left, right) => right.length - left.length);
  let output = text;
  for (const phrase of sorted) {
    const pattern = phrase.split(/\s+/).map((part) => escapeRegExp(part)).join('\\s+');
    const regex = new RegExp(`(^|[^A-Za-z0-9_$#%])(${pattern})(?=$|[^A-Za-z0-9_$#%])`, 'gi');
    output = output.replace(regex, (_match, prefix: string) => `${prefix}${applyCase(phrase, mode)}`);
  }
  return output;
}

function normalizeSpacing(text: string, options: ResolvedFormatterOptions): string {
  let output = text.replace(/[ \t]{2,}/g, ' ');
  output = output.replace(/\s+,/g, ',');
  output = output.replace(/,\s*/g, options.spaceAfterComma ? ', ' : ',');
  output = output.replace(/\(\s+/g, '(');
  output = output.replace(/\s+\)/g, ')');

  if (options.spaceAroundOperators) {
    output = output.replace(/\s*(<>|<=|>=|=|<|>)\s*/g, ' $1 ');
  }

  output = output.replace(/[ \t]{2,}/g, ' ');
  return output;
}

function splitLineComment(line: string): { code: string; comment: string } {
  let quote: '"' | '\'' | null = null;
  for (let index = 0; index < line.length - 1; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (!quote && (char === '"' || char === '\'')) {
      quote = char;
      continue;
    }
    if (quote && char === quote) {
      quote = null;
      continue;
    }
    if (!quote && char === '/' && next === '/') {
      return {
        code: line.slice(0, index),
        comment: line.slice(index)
      };
    }
  }
  return { code: line, comment: '' };
}

function formatLineBody(line: string, options: ResolvedFormatterOptions): string {
  const { code, comment } = splitLineComment(line);
  const formattedCode = transformOutsideStrings(code, (segment) => {
    let output = normalizeSpacing(segment, options);
    output = replaceKeywordPhrases(output, TYPE_KEYWORDS, options.typeCase);
    output = replaceKeywordPhrases(output, EVENT_KEYWORDS, options.eventKeywordCase);
    output = replaceKeywordPhrases(output, STATEMENT_KEYWORDS, options.statementCase);
    return output;
  }).trim();

  const trimmedComment = comment.trimStart();
  if (!trimmedComment) {
    return formattedCode;
  }

  if (!formattedCode) {
    return trimmedComment;
  }

  return `${formattedCode} ${trimmedComment}`;
}

function shouldDedentBefore(trimmedLine: string): boolean {
  return DEDENT_PATTERNS.some((pattern) => pattern.test(trimmedLine));
}

function shouldIndentAfter(trimmedLine: string): boolean {
  return OPEN_PATTERNS.some((pattern) => pattern.test(trimmedLine));
}

function buildIndent(level: number, options: ResolvedFormatterOptions): string {
  if (level <= 0) {
    return '';
  }

  if (options.indentStyle === 'tabs') {
    return '\t'.repeat(level);
  }

  return ' '.repeat(level * options.indentSize);
}

export function formatPowerBuilderText(
  text: string,
  options: PowerBuilderFormatterOptions = {},
  lineEnding = '\n'
): string {
  const resolved = resolveOptions(options);
  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  let indentLevel = 0;
  let previousWasBlank = false;

  for (const rawLine of lines) {
    const sanitizedLine = resolved.trimTrailingWhitespace ? rawLine.replace(/[ \t]+$/g, '') : rawLine;
    const trimmed = sanitizedLine.trim();

    if (trimmed.length === 0) {
      if (resolved.normalizeBlankLines === 'compact' && previousWasBlank) {
        continue;
      }
      output.push('');
      previousWasBlank = true;
      continue;
    }

    if (shouldDedentBefore(trimmed)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    output.push(`${buildIndent(indentLevel, resolved)}${formatLineBody(trimmed, resolved)}`);
    previousWasBlank = false;

    if (shouldIndentAfter(trimmed)) {
      indentLevel++;
    }
  }

  return output.join(lineEnding);
}