import { stripCommentsSmart } from '../utils/comments';

export type ConditionalCompilationDirectiveKind = 'if' | 'elseif' | 'else' | 'end-if' | 'define';

export interface ConditionalCompilationMarker {
  line: number;
  directive: ConditionalCompilationDirectiveKind;
  rawText: string;
}

const CONDITIONAL_COMPILATION_DIRECTIVE = /^([#$])\s*(if|elseif|else|end\s*if|endif|define)\b/i;

export function findConditionalCompilationMarkers(content: string): ConditionalCompilationMarker[] {
  const lines = content.split(/\r?\n/);
  const stripped = stripCommentsSmart(lines).lines;
  const markers: ConditionalCompilationMarker[] = [];

  for (let lineIndex = 0; lineIndex < stripped.length; lineIndex++) {
    const strippedLine = stripped[lineIndex] ?? '';
    const trimmed = strippedLine.trimStart();
    if (!trimmed) {
      continue;
    }

    const match = CONDITIONAL_COMPILATION_DIRECTIVE.exec(trimmed);
    if (!match) {
      continue;
    }

    markers.push({
      line: lineIndex,
      directive: normalizeDirective(match[2]),
      rawText: trimmed,
    });
  }

  return markers;
}

function normalizeDirective(raw: string): ConditionalCompilationDirectiveKind {
  const normalized = raw.replace(/\s+/g, '').toLowerCase();
  switch (normalized) {
    case 'if':
      return 'if';
    case 'elseif':
      return 'elseif';
    case 'else':
      return 'else';
    case 'endif':
      return 'end-if';
    case 'define':
      return 'define';
    default:
      return 'if';
  }
}