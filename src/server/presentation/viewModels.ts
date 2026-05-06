import type { DiagnosticSeverity, Range, SignatureInformation } from 'vscode-languageserver/node';

import type { SourceOrigin } from '../../shared/sourceOrigin';
import type {
  ResolvedCallableModel,
  ResolvedEnumContextModel,
  ResolvedReceiverModel,
  ResolvedSymbolModel,
} from '../knowledge/resolution/resolvedSemanticModels';
import type { DocumentationLocale } from '../knowledge/system/localization';

export type PresentationConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface PresentationBlockViewModel {
  kind: 'summary' | 'details' | 'documentation' | 'warning' | 'help' | 'evidence';
  lines: string[];
}

export interface PresentationPayloadPolicyViewModel {
  feature:
    | 'hover'
    | 'completion-initial'
    | 'completion-resolve'
    | 'signatureHelp'
    | 'definition'
    | 'diagnostics'
    | 'documentSymbols'
    | 'semanticTokens'
    | 'ai-context';
  compact: boolean;
  forbiddenBlocks: Array<'json-dump' | 'internal-paths' | 'long-evidence' | 'workspace-scan-results'>;
  budgetBytes?: number;
}

export type HoverPresentationKind =
  | 'local-variable'
  | 'argument'
  | 'instance-variable'
  | 'shared-variable'
  | 'global-variable'
  | 'function'
  | 'event'
  | 'inherited-member'
  | 'built-in'
  | 'enumerated-type'
  | 'enumerated-value'
  | 'datawindow-method'
  | 'datawindow-column'
  | 'datawindow-property'
  | 'sql-symbol'
  | 'dynamic'
  | 'unknown';

export interface HoverBlockViewModel {
  kind: 'context' | 'documentation' | 'warning' | 'details';
  lines: string[];
}

export interface SymbolHoverViewModel {
  feature: 'hover';
  kind: HoverPresentationKind;
  title?: string;
  signature?: string;
  summary?: string;
  blocks: HoverBlockViewModel[];
  confidence?: PresentationConfidence;
  locale?: DocumentationLocale;
  preformattedMarkdown?: string;
  payloadPolicy: PresentationPayloadPolicyViewModel;
}

export type SignatureHelpViewModelSource = 'system-catalog' | 'workspace' | 'datawindow-binding';

export interface SymbolSignatureViewModel {
  feature: 'signatureHelp';
  signatures: SignatureInformation[];
  activeSignature: number;
  activeParameter: number;
  source: SignatureHelpViewModelSource;
  reason: string;
  locale?: DocumentationLocale;
  resolvedCallable?: ResolvedCallableModel;
  payloadPolicy: PresentationPayloadPolicyViewModel;
}

export type CompletionPresentationKind =
  | 'method'
  | 'function'
  | 'event'
  | 'variable'
  | 'class'
  | 'field'
  | 'property'
  | 'type-parameter'
  | 'enum'
  | 'enum-member'
  | 'constant'
  | 'keyword'
  | 'text';

export interface CompletionItemViewModel {
  label: string;
  kind: CompletionPresentationKind;
  source: 'workspace-entity' | 'system-catalog' | 'datawindow-expression' | 'datawindow-adapter' | 'static';
  sortText?: string;
  filterText?: string;
  insertText?: string;
  insertTextFormat?: 'plain-text' | 'snippet';
  detail?: string;
  documentation?: string;
  data?: unknown;
  resolvedSymbol?: ResolvedSymbolModel;
  resolvedReceiver?: ResolvedReceiverModel;
  resolvedEnumContext?: ResolvedEnumContextModel;
  confidence?: PresentationConfidence;
  locale?: DocumentationLocale;
}

export interface CompletionListViewModel {
  feature: 'completion-initial';
  items: CompletionItemViewModel[];
  isIncomplete: boolean;
  payloadPolicy: PresentationPayloadPolicyViewModel;
}

export interface CompletionResolveViewModel {
  feature: 'completion-resolve';
  label: string;
  detail?: string;
  documentation?: string;
  blocks: PresentationBlockViewModel[];
  source: 'workspace-entity' | 'system-catalog' | 'fallback-original';
  resolvedSymbol?: ResolvedSymbolModel;
  locale?: DocumentationLocale;
}

export interface DefinitionViewModel {
  feature: 'definition';
  source: 'workspace' | 'system-catalog' | 'datawindow' | 'unknown';
  locations: Array<{
    uri: string;
    range: Range;
  }>;
  confidence?: PresentationConfidence;
  reasonCodes: string[];
  resolvedSymbol?: ResolvedSymbolModel;
}

export interface DiagnosticMessageViewModel {
  feature: 'diagnostics';
  range: Range;
  primaryMessage: string;
  severity?: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  reasonCodes: string[];
  confidence?: PresentationConfidence;
  help?: string;
  data?: unknown;
}

export interface SemanticTokenViewModelEntry {
  line: number;
  char: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
  source: 'declaration' | 'usage' | 'system-catalog' | 'enumerated-value';
  resolvedSymbol?: ResolvedSymbolModel;
  confidence?: PresentationConfidence;
}

export interface SemanticTokensViewModel {
  feature: 'semanticTokens';
  tokens: SemanticTokenViewModelEntry[];
  payloadPolicy: PresentationPayloadPolicyViewModel;
}

export interface AiContextSectionViewModel {
  title: string;
  blocks: PresentationBlockViewModel[];
  resolvedSymbols?: ResolvedSymbolModel[];
  resolvedCallables?: ResolvedCallableModel[];
}

export interface AiContextViewModel {
  feature: 'ai-context';
  title: string;
  sourceOrigin?: SourceOrigin | 'unknown';
  confidence?: PresentationConfidence;
  sections: AiContextSectionViewModel[];
  payloadPolicy: PresentationPayloadPolicyViewModel;
}

export function buildCompactPayloadPolicy(
  feature: PresentationPayloadPolicyViewModel['feature'],
  budgetBytes?: number,
): PresentationPayloadPolicyViewModel {
  return {
    feature,
    compact: true,
    forbiddenBlocks: ['json-dump', 'internal-paths', 'long-evidence', 'workspace-scan-results'],
    ...(budgetBytes !== undefined ? { budgetBytes } : {}),
  };
}

export type SymbolCompletionViewModel = CompletionListViewModel | CompletionResolveViewModel;

export type SymbolDiagnosticViewModel = DiagnosticMessageViewModel;

export type SymbolSemanticTokenViewModel = SemanticTokensViewModel;