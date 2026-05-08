import { Position, SignatureHelp, SignatureInformation, ParameterInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { InvocationContext } from '../utils/invocationContext';
import { normalizeUri } from '../system/uriUtils';
import { Entity, EntityKind } from '../knowledge/types';
import {
  getDisplayDocumentation,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import {
  buildSymbolSignatureViewModel,
  formatSymbolSignatureViewModel,
} from '../presentation/signatureHelpPresentation';
import type {
  SignatureHelpViewModelSource,
  SymbolSignatureViewModel as SignatureHelpViewModel,
} from '../presentation/viewModels';
import {
  extractSignatureContext,
  listSignatureParameterLabels,
  resolveExpectedEnumTypeForParameterLabel,
} from './signatureContext';

import { getQueryConsumerPolicy } from './queryScopePolicy';
import { DATAWINDOW_BIND_OWNER_TYPES } from './dataWindowBindingModel';
import { resolveLanguageSymbol } from '../knowledge/system/services/queryService';
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
  const sigContext = extractSignatureContext(document, position, systemCatalog);
  if (!sigContext) {
    return null;
  }

  const { identifier, qualifier, activeParameter, argumentCount, argumentTypes } = sigContext;

  const context: InvocationContext = {
    identifier,
    qualifier,
    ...(argumentCount !== undefined ? { argumentCount } : {}),
    ...(argumentTypes ? { argumentTypes } : {})
  };
  const currentUri = normalizeUri(document.uri);
  const budgetMs = getQueryConsumerPolicy('signature-help').budgetMs;
  const facade = createSemanticQueryFacade({ kb, graph, systemCatalog, hotContext });
  
  // 1. Resolver target unificado
  const result = facade.resolveTarget(document, position, { 
    explicitContext: context, 
    consumer: 'signature-help',
    traceLabel: 'signatureHelp' 
  });

  // 2. Extraer todos los candidatos (target principal + ambiguos)
  const allTargets = [result.target, ...(result.alternatives?.ambiguousTargets ?? [])]
    .filter((t): t is Entity => !!t && isCallableEntity(t));

  if (allTargets.length === 0) {
    return null;
  }

  const signatures: SignatureInformation[] = [];
  let specializedDataWindowRetrieveAdded = false;

  for (const target of allTargets) {
    if (target.uri.startsWith('catalog:')) {
      // Símbolo del sistema: puede tener múltiples firmas
      const sysId = target.uri.replace('catalog:', '');
      const sysTarget = systemCatalog.getSymbolById(sysId);
      if (sysTarget) {
        if (!specializedDataWindowRetrieveAdded
          && qualifier
          && sysTarget.domain === 'datawindow-functions'
          && sysTarget.normalizedName === 'retrieve') {
          const adaptedSignature = buildLinkedDataWindowRetrieveSignatureAdapter(
            { document, position, kb, graph, systemCatalog, hotContext },
            qualifier,
          );
          if (adaptedSignature) {
            signatures.push(adaptedSignature);
            specializedDataWindowRetrieveAdded = true;
          }
        }

        for (const sig of sysTarget.signatures || []) {
          const parameters = buildSystemSignatureParameters(systemCatalog, sysTarget, sig, documentationLocale);
          signatures.push(SignatureInformation.create(
            sig.label,
            buildSystemSignatureDocumentation(sysTarget, sig, documentationLocale),
            ...parameters
          ));
        }
        if (signatures.length === 0) {
          // Fallback
          signatures.push(SignatureInformation.create(
            sysTarget.name,
            getDisplaySummary(sysTarget, documentationLocale)
          ));
        }
      }
    } else {
      // Símbolo del workspace: una sola firma por entidad
      let label = target.signature || target.name;
      const parameters: ParameterInformation[] = [];
      
      if (target.parameters && target.parameters.length > 0) {
        for (const p of target.parameters) {
          parameters.push(ParameterInformation.create(p.label));
        }
      } else {
        // Fallback manual si no hay parámetros estructurados
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
  }

  if (signatures.length > 0) {
    return createSignatureHelpFromViewModel(
      signatures,
      activeParameter,
      result.kind === 'system-symbol' ? 'system-catalog' : 'workspace',
      result.reasons[0] || 'semantic-query-callable',
    );
  }

  return null;
}

function isCallableEntity(entity: import('../knowledge/types').Entity): boolean {
  return entity.kind === EntityKind.Function
    || entity.kind === EntityKind.Subroutine
    || entity.kind === EntityKind.Event;
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

export {
  extractSignatureContext,
  getSignatureParameterLabel,
  listSignatureParameterLabels,
  resolveExpectedEnumTypeForParameterLabel,
} from './signatureContext';
