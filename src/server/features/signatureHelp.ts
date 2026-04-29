import { Position, SignatureHelp, SignatureInformation, ParameterInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../knowledge/resolution/semanticQueryService';
import { InvocationContext } from '../utils/invocationContext';
import { normalizeUri } from '../system/uriUtils';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { CharType } from '../utils/comments';

export function provideSignatureHelp(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph: InheritanceGraph
): SignatureHelp | null {
  const result = extractSignatureContext(document, position);
  if (!result) {
    return null;
  }

  const { identifier, qualifier, activeParameter } = result;

  const context: InvocationContext = { identifier, qualifier };
  const currentUri = normalizeUri(document.uri);

  // 1. Intentar resolver en SystemCatalog
  const sysTargets = systemCatalog.findSystemSymbol(identifier);
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
  const targets = resolveTargetEntity(context, currentUri, kb, graph, position.line);
  
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

function extractSignatureContext(document: TextDocument, position: Position): { identifier: string; qualifier?: string; activeParameter: number } | null {
  // Vamos a buscar hacia atrás el paréntesis de apertura '(' 
  // y contar las comas en el nivel de profundidad 0.
  let activeParameter = 0;
  let depth = 0;
  
  const analysis = getDocumentAnalysis(document);
  const strippedLines = analysis.strippedLines;

  // Limitar la búsqueda hacia atrás a unas cuantas líneas para evitar bloqueos
  const maxLinesBack = 5;
  const startLine = Math.max(0, position.line - maxLinesBack);
  
  let currentLine = position.line;
  let currentCharacter = 0;
  let foundOpenParen = false;
  
  while (currentLine >= startLine) {
    const originalLineText = analysis.lines[currentLine];
    const mask = analysis.masks[currentLine];
    
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
  
  return { identifier, qualifier, activeParameter };
}
