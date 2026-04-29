import {
  EventLikeMatch,
  FunctionLikeMatch,
  TypeMatch
} from '../model/types';
import { normalizeSpace } from '../utils/helpers';

export function isTypeDefinitionHeader(line: string): boolean {
  return /^(?:\s*(?:global|public|private|protected)\s+)?type\s+[A-Za-z_$#%][\w$#%\-]*\s+from\s+[A-Za-z_$#%][\w$#%\-`]*/i.test(
    line
  );
}

export function matchTypeDefinition(line: string): TypeMatch | null {
  const match =
    /^(?:\s*(?:global|public|private|protected)\s+)?type\s+([A-Za-z_$#%][\w$#%\-]*)\s+from\s+([A-Za-z_$#%][\w$#%\-`]*)(?:\s+within\s+([A-Za-z_$#%][\w$#%\-`]*))?/i.exec(
      line
    );

  if (!match) {
    return null;
  }

  return {
    name: match[1],
    ancestor: match[2],
    container: match[3]
  };
}

export function matchFunctionImplementationHeader(
  line: string
): FunctionLikeMatch | null {
  const functionMatch =
    /^\s*(?:(?:public|private|protected|global|shared|static|rpcfunc|external|native|readonly|constant|ref|indirect)\s+)*function\s+([A-Za-z_$#%][\w$#%\-`]*)\s+([A-Za-z_$#%][\w$#%\-]*)\s*(?=\()/i.exec(
      line
    );

  if (functionMatch) {
    return {
      kind: 'function',
      returnType: functionMatch[1],
      name: functionMatch[2]
    };
  }

  const subroutineMatch =
    /^\s*(?:(?:public|private|protected|global|shared|static|rpcfunc|external|native|readonly|constant|ref|indirect)\s+)*subroutine\s+([A-Za-z_$#%][\w$#%\-]*)\s*(?=\()/i.exec(
      line
    );

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
  const match =
    /^\s*(?:(?:public|private|protected|global|shared|static)\s+)*event\s+([A-Za-z_$#%][\w$#%\-]*(?:::[A-Za-z_$#%][\w$#%\-]*)?)\s*(?:;|\(|$)/i.exec(
      line
    );

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
  const match =
    /^\s*on\s+([A-Za-z_$#%][\w$#%\-]*(?:\.[A-Za-z_$#%][\w$#%\-]*)+)\s*;?\s*$/i.exec(
      line
    );

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
  const match =
    /^\s*((?:(?:public|private|protected|global|shared|readonly|constant|ref|indirect|static)\s+)*)((?:[A-Za-z_$#%][\w$#%\-`]*(?:\{\d+\})?))\s+([A-Za-z_$#%][\w$#%\-]*)/i.exec(
      line
    );

  if (!match) {
    return null;
  }

  const modifiers = normalizeSpace(match[1]);
  const type = match[2];
  const name = match[3];

  // Exclude common PowerScript keywords that might be mistaken for a type
  const keywords = ['return', 'if', 'elseif', 'else', 'choose', 'case', 'for', 'do', 'while', 'loop', 'next', 'continue', 'exit', 'goto', 'throw', 'catch', 'finally', 'end', 'forward', 'global', 'type', 'variables'];
  if (keywords.includes(type.toLowerCase())) {
    return null;
  }

  return {
    modifiers: modifiers || undefined,
    type,
    name
  };
}