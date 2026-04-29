import {
  EventLikeMatch,
  FunctionLikeMatch,
  TypeMatch
} from '../model/types';
import { normalizeSpace } from '../utils/helpers';
import {
  ROOT_TYPE_PATTERN,
  NESTED_TYPE_PATTERN,
  FUNCTION_PATTERN,
  SUBROUTINE_PATTERN,
  EVENT_PATTERN,
  ON_EVENT_PATTERN,
  VARIABLE_PATTERN,
  PB_KEYWORDS
} from './grammar';

export function isTypeDefinitionHeader(line: string): boolean {
  return ROOT_TYPE_PATTERN.test(line) || NESTED_TYPE_PATTERN.test(line);
}

export function matchTypeDefinition(line: string): TypeMatch | null {
  const rootMatch = ROOT_TYPE_PATTERN.exec(line);
  if (rootMatch) {
    return {
      name: rootMatch[1],
      ancestor: rootMatch[2]
    };
  }

  const nestedMatch = NESTED_TYPE_PATTERN.exec(line);
  if (nestedMatch) {
    return {
      name: nestedMatch[1],
      ancestor: nestedMatch[2],
      container: nestedMatch[3] // Group 3 is the container
    };
  }

  return null;
}

export function matchFunctionImplementationHeader(
  line: string
): FunctionLikeMatch | null {
  const functionMatch = FUNCTION_PATTERN.exec(line);
  if (functionMatch) {
    return {
      kind: 'function',
      returnType: functionMatch[1],
      name: functionMatch[2]
    };
  }

  const subroutineMatch = SUBROUTINE_PATTERN.exec(line);
  if (subroutineMatch) {
    return {
      kind: 'subroutine',
      name: subroutineMatch[1]
    };
  }

  return null;
}

export function matchFunctionPrototype(
  line: string
): FunctionLikeMatch | null {
  return matchFunctionImplementationHeader(line);
}

export function matchEventImplementationHeader(
  line: string
): EventLikeMatch | null {
  const match = EVENT_PATTERN.exec(line);

  if (!match) {
    return null;
  }

  return {
    name: match[1],
    detail: 'event'
  };
}

export function matchOnImplementationHeader(
  line: string
): EventLikeMatch | null {
  const match = ON_EVENT_PATTERN.exec(line);

  if (!match) {
    return null;
  }

  return {
    name: match[1],
    detail: 'on-event'
  };
}

export function matchEventPrototype(line: string): EventLikeMatch | null {
  return matchEventImplementationHeader(line);
}

export function matchVariableDeclaration(
  line: string
): { modifiers?: string; type: string; name: string } | null {
  const match = VARIABLE_PATTERN.exec(line);

  if (!match) {
    return null;
  }

  const modifiers = normalizeSpace(match[1]);
  const type = match[2];
  const name = match[3];

  if (PB_KEYWORDS.has(type.toLowerCase())) {
    return null;
  }

  return {
    modifiers: modifiers || undefined,
    type,
    name
  };
}