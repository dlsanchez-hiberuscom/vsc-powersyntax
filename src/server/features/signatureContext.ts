import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { CharType } from '../utils/comments';

function inferArgumentType(argumentText: string, systemCatalog: SystemCatalog): string {
  const trimmed = argumentText.trim();
  if (!trimmed) return 'unknown';
  if (/^(['"]).*\1$/s.test(trimmed)) return 'string';
  if (/^[+-]?\d+$/.test(trimmed)) return 'integer';
  if (/^[+-]?\d+\.\d+$/.test(trimmed)) return 'decimal';
  if (/^(true|false)$/i.test(trimmed)) return 'boolean';
  const systemGlobal = systemCatalog.resolveSystemGlobal(trimmed);
  if (systemGlobal?.valueType) return systemGlobal.valueType.toLowerCase();
  return 'unknown';
}

export function extractSignatureContext(
  document: TextDocument,
  position: Position,
  systemCatalog: SystemCatalog,
): { identifier: string; qualifier?: string; activeParameter: number; argumentCount?: number; argumentTypes?: string[] } | null {
  let activeParameter = 0;
  let depth = 0;

  const snapshot = getDocumentAnalysis(document).snapshot;
  const strippedLines = snapshot.maskedText.lines;
  const maxLinesBack = 5;
  const startLine = Math.max(0, position.line - maxLinesBack);

  let currentLine = position.line;
  let currentCharacter = 0;
  let foundOpenParen = false;

  while (currentLine >= startLine) {
    const originalLineText = strippedLines[currentLine];
    const mask = snapshot.maskedText.masks[currentLine];

    if (currentLine < position.line) {
      currentCharacter = originalLineText.length - 1;
    } else {
      currentCharacter = position.character - 1;
    }

    while (currentCharacter >= 0) {
      const m = mask[currentCharacter];
      const isCommentOrString = m === CharType.Comment || m === CharType.String;

      if (!isCommentOrString) {
        const char = originalLineText[currentCharacter];
        if (char === ')') {
          depth++;
        } else if (char === '(') {
          if (depth === 0) {
            foundOpenParen = true;
            break;
          }
          depth--;
        } else if (char === ',' && depth === 0) {
          activeParameter++;
        }
      }

      currentCharacter--;
    }

    if (foundOpenParen) {
      break;
    }

    currentLine--;
  }

  if (!foundOpenParen) {
    return null;
  }

  const lineText = document.getText({
    start: { line: currentLine, character: 0 },
    end: { line: currentLine, character: currentCharacter }
  });
  const trimmed = lineText.trimEnd();
  if (trimmed.length === 0) return null;

  const match = trimmed.match(/([a-zA-Z_$#%][\w$#%\-]*)(?:\s*\.\s*([a-zA-Z_$#%][\w$#%\-]*))?$/);
  if (!match) {
    return null;
  }

  let identifier: string;
  let qualifier: string | undefined;

  if (match[2]) {
    qualifier = match[1];
    identifier = match[2];
  } else {
    identifier = match[1];
  }

  const callText = document.getText({
    start: { line: currentLine, character: currentCharacter + 1 },
    end: position
  });
  const hasArgumentToken = /[^\s,]/.test(callText);
  const argumentCount = activeParameter > 0 || hasArgumentToken ? activeParameter + 1 : undefined;
  const argumentTypes = argumentCount !== undefined
    ? callText.split(',').slice(0, argumentCount).map((argument) => inferArgumentType(argument, systemCatalog))
    : undefined;

  return {
    identifier,
    qualifier,
    activeParameter,
    ...(argumentCount !== undefined ? { argumentCount } : {}),
    ...(argumentTypes ? { argumentTypes } : {})
  };
}

export function listSignatureParameterLabels(signatureLabel: string): readonly string[] {
  const match = signatureLabel.match(/\((.*)\)/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((parameter) => parameter.replace(/[{}]/g, '').trim())
    .filter((parameter) => parameter.length > 0);
}

export function getSignatureParameterLabel(signatureLabel: string, activeParameter: number): string | null {
  return listSignatureParameterLabels(signatureLabel)[activeParameter] ?? null;
}

export function resolveExpectedEnumTypeForParameterLabel(
  systemCatalog: SystemCatalog,
  parameterLabel: string,
): string | null {
  const explicitType = extractExplicitEnumTypeFromParameterLabel(systemCatalog, parameterLabel);
  if (explicitType) {
    return explicitType.name;
  }

  const parameterName = extractParameterNameFromLabel(parameterLabel);
  if (!parameterName) {
    return null;
  }

  const contextualEnumType = systemCatalog.listEnumeratedTypes().find((entry) =>
    entry.allowedInParameters?.some((allowedParameter) =>
      normalizeParameterName(allowedParameter) === normalizeParameterName(parameterName),
    ),
  );
  return contextualEnumType?.name ?? null;
}

function extractExplicitEnumTypeFromParameterLabel(
  systemCatalog: SystemCatalog,
  parameterLabel: string,
) {
  const cleaned = parameterLabel.replace(/[{}]/g, '').trim();
  const typeMatch = cleaned.match(/^(?:ref\s+)?([a-zA-Z_$#%][\w$#%\-]*)\s+[a-zA-Z_$#%][\w$#%\-]*\??$/i);
  if (!typeMatch) {
    return undefined;
  }

  return systemCatalog.resolveEnumeratedType(typeMatch[1]);
}

function extractParameterNameFromLabel(parameterLabel: string): string | null {
  const cleaned = parameterLabel.replace(/[{}]/g, '').trim();
  if (!cleaned) {
    return null;
  }

  const tokens = cleaned.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return null;
  }

  return tokens[tokens.length - 1].replace(/\?$/, '');
}

function normalizeParameterName(parameterName: string): string {
  return parameterName.toLowerCase().replace(/[^a-z0-9]/g, '');
}