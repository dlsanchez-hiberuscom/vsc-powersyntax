import { Position, SignatureHelp, SignatureInformation, ParameterInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { InvocationContext } from '../utils/invocationContext';
import { normalizeUri } from '../system/uriUtils';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { resolveSystemGlobal } from '../knowledge/system/services/queryService';
import {
  getDisplayDocumentation,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import { CharType } from '../utils/comments';
import {
  buildSymbolSignatureViewModel,
  formatSymbolSignatureViewModel,
} from '../presentation/signatureHelpPresentation';
import type {
  SignatureHelpViewModelSource,
  SymbolSignatureViewModel as SignatureHelpViewModel,
} from '../presentation/viewModels';

import { getQueryConsumerPolicy } from './queryScopePolicy';
import {
  DATAWINDOW_BIND_OWNER_TYPES,
  resolveCatalogOwnerTypes,
} from './dataWindowBindingModel';
import { buildLinkedDataWindowRetrieveSignatureAdapter } from './dataWindowServingAdapters';
import type { PbSystemSymbolEntry, PbSystemSymbolSignature } from '../knowledge/system/types';

export type { SignatureHelpViewModelSource, SignatureHelpViewModel };

type SignatureHelpViewModelInput = Omit<SignatureHelpViewModel, 'feature' | 'payloadPolicy'>
  & Partial<Pick<SignatureHelpViewModel, 'feature' | 'payloadPolicy'>>;

export function formatSignatureHelpViewModel(viewModel: SignatureHelpViewModelInput): SignatureHelp {
  let normalized: SignatureHelpViewModel;
  if (viewModel.feature === 'signatureHelp' && viewModel.payloadPolicy) {
    normalized = viewModel as SignatureHelpViewModel;
  } else {
    normalized = buildSymbolSignatureViewModel({
      signatures: viewModel.signatures,
      activeSignature: viewModel.activeSignature,
      activeParameter: viewModel.activeParameter,
      source: viewModel.source,
      reason: viewModel.reason,
      ...(viewModel.locale ? { locale: viewModel.locale } : {}),
      ...(viewModel.resolvedCallable ? { resolvedCallable: viewModel.resolvedCallable } : {}),
    });
  }

  return formatSymbolSignatureViewModel(normalized);
}

function createSignatureHelpFromViewModel(
  signatures: SignatureInformation[],
  activeParameter: number,
  source: SignatureHelpViewModelSource,
  reason: string,
): SignatureHelp {
  return formatSignatureHelpViewModel(buildSymbolSignatureViewModel({
    signatures,
    activeParameter,
    source,
    reason,
  }));
}

export function provideSignatureHelp(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  documentationLocale: DocumentationLocale = 'en'
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
  const budgetMs = getQueryConsumerPolicy('signature-help').budgetMs;
  const facade = createSemanticQueryFacade({ kb, graph, systemCatalog, hotContext });
  const ownerType = qualifier
    ? facade.resolveReceiverType(document, qualifier, position).ownerType ?? undefined
    : undefined;
  const ownerTypes = resolveCatalogOwnerTypes(ownerType, graph);

  const linkedRetrieveSignature = identifier.toLowerCase() === 'retrieve'
    && qualifier
    && ownerTypes.some((typeName) => DATAWINDOW_BIND_OWNER_TYPES.has(typeName))
    ? buildLinkedDataWindowRetrieveSignatureAdapter({
        document,
        position,
        kb,
        graph,
        systemCatalog,
        hotContext,
      }, qualifier)
    : null;
  if (linkedRetrieveSignature) {
    return createSignatureHelpFromViewModel(
      [linkedRetrieveSignature],
      activeParameter,
      'datawindow-binding',
      'linked-datawindow-retrieve',
    );
  }

  // 1. Intentar resolver en SystemCatalog
  const ownerScopedTarget = ownerTypes.length > 0
    ? systemCatalog.resolveMemberFunctionForOwner(identifier, ownerTypes)
    : undefined;
  const sysTargets = qualifier
    ? (ownerScopedTarget ? [ownerScopedTarget] : [])
    : systemCatalog.findSystemSymbol(identifier);
  if (sysTargets.length > 0) {
    // Si hay qualifier, validar que aplique, pero para signature help
    // seremos un poco más permisivos si es una función de sistema
    const signatures: SignatureInformation[] = [];
    
    for (const sysTarget of prioritizeDocumentationTargets(sysTargets)) {
      if (sysTarget.signatures && sysTarget.signatures.length > 0) {
        for (const sig of sysTarget.signatures) {
          const parameters = buildSystemSignatureParameters(systemCatalog, sysTarget, sig, documentationLocale);

          signatures.push(SignatureInformation.create(
            sig.label,
            buildSystemSignatureDocumentation(sysTarget, sig, documentationLocale),
            ...parameters
          ));
        }
      } else {
        // Fallback si no hay array signatures explícito
        signatures.push(SignatureInformation.create(
          sysTarget.name,
          getDisplaySummary(sysTarget, documentationLocale)
        ));
      }
    }

    if (signatures.length > 0) {
      return createSignatureHelpFromViewModel(
        signatures,
        activeParameter,
        'system-catalog',
        qualifier ? 'owner-scoped-system-callable' : 'global-system-callable',
      );
    }
  }

  // 2. Intentar resolver con SemanticQueryFacade
  const callables = facade.resolveCallable(document, position, {
    consumer: 'signature-help',
    traceLabel: 'signatureHelp',
  });
  
  if (callables.length > 0) {
    const signatures: SignatureInformation[] = [];
    
    for (const callable of callables) {
      const target = callable.symbol;
      let label = callable.signature || target.name;
      const parameters: ParameterInformation[] = [];
      
      if (callable.parameterLabels && callable.parameterLabels.length > 0) {
        for (const p of callable.parameterLabels) {
          parameters.push(ParameterInformation.create(p));
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
      return createSignatureHelpFromViewModel(
        signatures,
        activeParameter,
        'workspace',
        'semantic-query-callable',
      );
    }
  }

  return null;
}

function prioritizeDocumentationTargets(entries: readonly PbSystemSymbolEntry[]): readonly PbSystemSymbolEntry[] {
  return [...entries].sort((left, right) => getDocumentationPriority(left) - getDocumentationPriority(right));
}

function getDocumentationPriority(entry: PbSystemSymbolEntry): number {
  if (entry.manualOverlay?.mode === 'candidate') {
    return 3;
  }

  if (entry.dataset === 'manual-core' && entry.manualOverlay?.mode === 'override') {
    return 0;
  }

  if (entry.dataset === 'generated') {
    return 1;
  }

  return 2;
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

export function extractSignatureContext(document: TextDocument, position: Position): { identifier: string; qualifier?: string; activeParameter: number; argumentCount?: number; argumentTypes?: string[] } | null {
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

function buildSystemSignatureParameters(
  systemCatalog: SystemCatalog,
  entry: PbSystemSymbolEntry,
  signature: PbSystemSymbolSignature,
  documentationLocale: DocumentationLocale,
): ParameterInformation[] {
  const entries: Array<{ label: string; documentation?: string }> = signature.parameters?.length
    ? signature.parameters.map((parameter) => ({
        label: parameter.label,
        documentation: getDisplayParameterDocumentation(
          entry,
          signature.label,
          parameter.label,
          documentationLocale,
        ) ?? parameter.documentation,
      }))
    : listSignatureParameterLabels(signature.label).map((label) => ({
        label,
        documentation: getDisplayParameterDocumentation(entry, signature.label, label, documentationLocale),
      }));

  return entries.map((parameter) =>
    ParameterInformation.create(
      parameter.label,
      parameter.documentation ?? buildEnumParameterDocumentation(systemCatalog, entry, parameter.label, documentationLocale),
    ),
  );
}

function buildSystemSignatureDocumentation(
  entry: PbSystemSymbolEntry,
  signature: PbSystemSymbolSignature,
  documentationLocale: DocumentationLocale,
): string | undefined {
  const segments: string[] = [];
  const displayDocumentation = getDisplayDocumentation(entry, documentationLocale);
  const displaySummary = getDisplaySummary(entry, documentationLocale);
  const displayReturnDocumentation = getDisplayReturnDocumentation(entry, documentationLocale);

  if (displayDocumentation) {
    segments.push(displayDocumentation);
  } else if (displaySummary) {
    segments.push(displaySummary);
  }

  if (signature.documentation && !segments.includes(signature.documentation)) {
    segments.push(signature.documentation);
  }

  if (displayReturnDocumentation) {
    segments.push(`${documentationLocale === 'es' ? 'Retorno' : 'Return'}: ${displayReturnDocumentation}`);
  }

  return segments.length > 0 ? segments.join('\n\n') : undefined;
}

function buildEnumParameterDocumentation(
  systemCatalog: SystemCatalog,
  entry: PbSystemSymbolEntry,
  parameterLabel: string,
  documentationLocale: DocumentationLocale,
): string | undefined {
  const enumTypeName = resolveExpectedEnumTypeForParameterLabel(systemCatalog, parameterLabel);
  if (!enumTypeName) {
    return undefined;
  }

  const preferDataWindowConstants = entry.domain === 'datawindow-functions';
  const enumType = preferDataWindowConstants
    ? (systemCatalog.resolveDataWindowConstant(enumTypeName) ?? systemCatalog.resolveEnumeratedType(enumTypeName))
    : systemCatalog.resolveEnumeratedType(enumTypeName);
  if (!enumType) {
    return undefined;
  }

  const preferredValues = preferDataWindowConstants
    ? systemCatalog.listDataWindowConstantValuesForType(enumType.name)
    : systemCatalog.listEnumeratedValuesForType(enumType.name);
  const effectiveValues = preferredValues.length > 0
    ? preferredValues
    : systemCatalog.listEnumeratedValuesForType(enumType.name);
  const valuesText = effectiveValues.length > 0
    ? ` Valores: ${effectiveValues.map((value) => value.name).join(', ')}.`
    : '';
  const displayDocumentation = getDisplayDocumentation(enumType, documentationLocale) ?? enumType.documentation;
  return `Tipo esperado: ${enumType.name}.${valuesText}${displayDocumentation ? ` ${displayDocumentation}` : ''}`.trim();
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
