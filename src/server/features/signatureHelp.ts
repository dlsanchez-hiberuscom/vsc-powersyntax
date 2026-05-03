import { Position, SignatureHelp, SignatureInformation, ParameterInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { resolveTargetEntityDetailed } from '../knowledge/resolution/semanticQueryService';
import { InvocationContext } from '../utils/invocationContext';
import { normalizeUri } from '../system/uriUtils';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { resolveSystemGlobal } from '../knowledge/system/services/queryService';
import { CharType } from '../utils/comments';
import { resolveDocumentQualifierType } from './queryContext';
import {
  DATAWINDOW_BIND_OWNER_TYPES,
  findNearestDataObjectLiteralBinding,
  resolveDataWindowRetrieveArguments,
} from './dataWindowBindingModel';

export function provideSignatureHelp(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache
): SignatureHelp | null {
  const result = extractSignatureContext(document, position);
  if (!result) {
    return null;
  }

  const { identifier, qualifier, activeParameter, argumentCount, argumentTypes } = result;

  const context: InvocationContext = {
    identifier,
    qualifier,
    ...(argumentCount !== undefined ? { argumentCount } : {}),
    ...(argumentTypes ? { argumentTypes } : {})
  };
  const currentUri = normalizeUri(document.uri);
  const ownerType = qualifier
    ? resolveDocumentQualifierType(document, qualifier, position, kb)
    : undefined;

  const linkedRetrieveSignature = identifier.toLowerCase() === 'retrieve'
    && qualifier
    && ownerType
    && DATAWINDOW_BIND_OWNER_TYPES.has(ownerType.toLowerCase())
    ? buildLinkedDataWindowRetrieveSignature(document, qualifier, position.line, kb)
    : null;
  if (linkedRetrieveSignature) {
    return {
      signatures: [linkedRetrieveSignature],
      activeSignature: 0,
      activeParameter,
    };
  }

  // 1. Intentar resolver en SystemCatalog
  const ownerScopedTarget = ownerType
    ? systemCatalog.resolveMemberFunctionForOwner(identifier, [ownerType])
    : undefined;
  const sysTargets = qualifier
    ? (ownerScopedTarget ? [ownerScopedTarget] : [])
    : systemCatalog.findSystemSymbol(identifier);
  if (sysTargets.length > 0) {
    // Si hay qualifier, validar que aplique, pero para signature help
    // seremos un poco más permisivos si es una función de sistema
    const signatures: SignatureInformation[] = [];
    
    for (const sysTarget of sysTargets) {
      if (sysTarget.signatures && sysTarget.signatures.length > 0) {
        for (const sig of sysTarget.signatures) {
          const parameters = sig.parameters?.map(p => {
            return ParameterInformation.create(p.label, p.documentation);
          }) || [];

          signatures.push(SignatureInformation.create(
            sig.label,
            sig.documentation || sysTarget.summary,
            ...parameters
          ));
        }
      } else {
        // Fallback si no hay array signatures explícito
        signatures.push(SignatureInformation.create(
          sysTarget.name,
          sysTarget.summary
        ));
      }
    }

    if (signatures.length > 0) {
      return {
        signatures,
        activeSignature: 0,
        activeParameter: activeParameter
      };
    }
  }

  // 2. Intentar resolver con KnowledgeBase
  const targets = resolveTargetEntityDetailed(context, currentUri, kb, graph, {
    line: position.line,
    hotContext,
    traceLabel: 'signatureHelp'
  }).targets;
  
  if (targets.length > 0) {
    const signatures: SignatureInformation[] = [];
    
    for (const target of targets) {
      let label = target.signature || target.name;
      const parameters: ParameterInformation[] = [];
      
      if (target.parameters && target.parameters.length > 0) {
        for (const p of target.parameters) {
          parameters.push(ParameterInformation.create(p.label, p.documentation));
        }
      } else {
        // Fallback si la entidad no fue parseada con parámetros normalizados (versiones antiguas en caché)
        const match = label.match(/\((.*?)\)/);
        if (match && match[1].trim() !== '') {
          const args = match[1].split(',');
          for (const arg of args) {
            parameters.push(ParameterInformation.create(arg.trim()));
          }
        }
      }
      
      signatures.push(SignatureInformation.create(
        label,
        target.documentation,
        ...parameters
      ));
    }
    
    if (signatures.length > 0) {
      return {
        signatures,
        activeSignature: 0,
        activeParameter: activeParameter
      };
    }
  }

  return null;
}

function buildLinkedDataWindowRetrieveSignature(
  document: TextDocument,
  qualifier: string,
  line: number,
  kb: KnowledgeBase
): SignatureInformation | null {
  const dataObjectLiteral = findNearestDataObjectLiteralBinding(document, qualifier, line);
  if (!dataObjectLiteral) {
    return null;
  }

  const retrieveArguments = resolveDataWindowRetrieveArguments(dataObjectLiteral, kb);
  if (retrieveArguments.length === 0) {
    return null;
  }

  const parameters = retrieveArguments.map((argument) =>
    ParameterInformation.create(
      argument.label,
      `Argumento de retrieve '${argument.name}' (${argument.type}) del DataWindow '${dataObjectLiteral}'.`
    )
  );

  return SignatureInformation.create(
    `Retrieve(${retrieveArguments.map((argument) => argument.label).join(', ')})`,
    `Retrieve del DataWindow '${dataObjectLiteral}' enlazado por DataObject.`,
    ...parameters
  );
}

function inferArgumentType(argumentText: string): string {
  const trimmed = argumentText.trim();
  if (!trimmed) return 'unknown';
  if (/^(['"]).*\1$/s.test(trimmed)) return 'string';
  if (/^[+-]?\d+$/.test(trimmed)) return 'integer';
  if (/^[+-]?\d+\.\d+$/.test(trimmed)) return 'decimal';
  if (/^(true|false)$/i.test(trimmed)) return 'boolean';
  const systemGlobal = resolveSystemGlobal(trimmed);
  if (systemGlobal?.valueType) return systemGlobal.valueType.toLowerCase();
  return 'unknown';
}

function extractSignatureContext(document: TextDocument, position: Position): { identifier: string; qualifier?: string; activeParameter: number; argumentCount?: number; argumentTypes?: string[] } | null {
  // Vamos a buscar hacia atrás el paréntesis de apertura '(' 
  // y contar las comas en el nivel de profundidad 0.
  let activeParameter = 0;
  let depth = 0;
  
  const snapshot = getDocumentAnalysis(document).snapshot;
  const strippedLines = snapshot.maskedText.lines;

  // Limitar la búsqueda hacia atrás a unas cuantas líneas para evitar bloqueos
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
          } else {
            depth--;
          }
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
  
  // Extraer el identificador justo antes del paréntesis '('
  // currentLine, currentCharacter apunta al '('
  const lineText = document.getText({
    start: { line: currentLine, character: 0 },
    end: { line: currentLine, character: currentCharacter }
  });
  
  const trimmed = lineText.trimEnd();
  if (trimmed.length === 0) return null;
  
  // Buscamos algo tipo "identificador" o "qualifier.identificador"
  // Extraemos usando una expresión regular al final del string
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
    ? callText.split(',').slice(0, argumentCount).map(inferArgumentType)
    : undefined;

  return { identifier, qualifier, activeParameter, ...(argumentCount !== undefined ? { argumentCount } : {}), ...(argumentTypes ? { argumentTypes } : {}) };
}
