import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';

import { EntityKind, type Entity } from '../knowledge/types';
import {
  getDisplayDocumentation,
  getDisplayObsoleteMessage,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  getDisplayUsageNotes,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import {
  buildCompactPayloadPolicy,
  type CompletionItemViewModel,
  type CompletionListViewModel,
  type CompletionPresentationKind,
  type CompletionResolveViewModel,
} from './viewModels';

function mapCompletionKind(kind: CompletionPresentationKind): CompletionItemKind {
  switch (kind) {
    case 'method':
      return CompletionItemKind.Method;
    case 'function':
      return CompletionItemKind.Function;
    case 'event':
      return CompletionItemKind.Event;
    case 'variable':
      return CompletionItemKind.Variable;
    case 'class':
      return CompletionItemKind.Class;
    case 'field':
      return CompletionItemKind.Field;
    case 'property':
      return CompletionItemKind.Property;
    case 'type-parameter':
      return CompletionItemKind.TypeParameter;
    case 'enum':
      return CompletionItemKind.Enum;
    case 'enum-member':
      return CompletionItemKind.EnumMember;
    case 'constant':
      return CompletionItemKind.Constant;
    case 'keyword':
      return CompletionItemKind.Keyword;
    default:
      return CompletionItemKind.Text;
  }
}

function mapInsertTextFormat(format: CompletionItemViewModel['insertTextFormat']): InsertTextFormat | undefined {
  switch (format) {
    case 'plain-text':
      return InsertTextFormat.PlainText;
    case 'snippet':
      return InsertTextFormat.Snippet;
    default:
      return undefined;
  }
}

function entityKindToCompletionKind(entity: Entity): CompletionPresentationKind {
  switch (entity.kind) {
    case EntityKind.Function:
    case EntityKind.Subroutine:
      return 'method';
    case EntityKind.Event:
      return 'event';
    case EntityKind.Variable:
      return 'variable';
    case EntityKind.Type:
      return 'class';
    default:
      return 'text';
  }
}

function systemEntryToCompletionKind(entry: PbSystemSymbolEntry): CompletionPresentationKind {
  switch (entry.kind) {
    case 'event':
      return 'event';
    case 'callable':
      return entry.invocation === 'global' ? 'function' : 'method';
    case 'datatype':
      return 'type-parameter';
    case 'system-type':
      return 'class';
    case 'enumerated-type':
      return 'enum';
    case 'system-global':
    case 'pronoun':
      return 'variable';
    case 'enumerated-value':
      return 'enum-member';
    case 'property':
      return 'property';
    case 'constant':
      return entry.enumValueOf ? 'enum-member' : entry.enumValues?.length ? 'enum' : 'constant';
    default:
      return 'keyword';
  }
}

export function buildCompletionListViewModel(items: CompletionItemViewModel[]): CompletionListViewModel {
  return {
    feature: 'completion-initial',
    items,
    isIncomplete: false,
    payloadPolicy: buildCompactPayloadPolicy('completion-initial', 64 * 1024),
  };
}

export function buildEntityCompletionItemViewModel(
  entity: Entity,
  sortText: string,
  data: unknown,
): CompletionItemViewModel {
  return {
    label: entity.name,
    kind: entityKindToCompletionKind(entity),
    source: 'workspace-entity',
    detail: entity.signature || (entity.datatype ? `${entity.datatype} ${entity.name}` : undefined),
    sortText,
    data,
    confidence: 'high',
  };
}

export function buildSystemCompletionItemViewModel(
  entry: PbSystemSymbolEntry,
  sortText: string,
  documentationLocale: DocumentationLocale,
  data: unknown,
): CompletionItemViewModel {
  return {
    label: entry.name,
    kind: systemEntryToCompletionKind(entry),
    source: 'system-catalog',
    detail: getDisplaySummary(entry, documentationLocale),
    insertTextFormat: 'plain-text',
    sortText,
    data,
    locale: documentationLocale,
    confidence: 'high',
  };
}

export function buildStaticCompletionItemViewModel(input: {
  label: string;
  kind: CompletionPresentationKind;
  source: CompletionItemViewModel['source'];
  sortText?: string;
  detail?: string;
  documentation?: string;
  data?: unknown;
}): CompletionItemViewModel {
  return {
    label: input.label,
    kind: input.kind,
    source: input.source,
    ...(input.sortText ? { sortText: input.sortText } : {}),
    ...(input.detail ? { detail: input.detail } : {}),
    ...(input.documentation ? { documentation: input.documentation } : {}),
    ...(input.data !== undefined ? { data: input.data } : {}),
    confidence: 'high',
  };
}

export function formatCompletionItemViewModel(viewModel: CompletionItemViewModel): CompletionItem {
  const insertTextFormat = mapInsertTextFormat(viewModel.insertTextFormat);
  return {
    label: viewModel.label,
    kind: mapCompletionKind(viewModel.kind),
    ...(viewModel.detail ? { detail: viewModel.detail } : {}),
    ...(viewModel.documentation ? { documentation: viewModel.documentation } : {}),
    ...(viewModel.sortText ? { sortText: viewModel.sortText } : {}),
    ...(viewModel.filterText ? { filterText: viewModel.filterText } : {}),
    ...(viewModel.insertText ? { insertText: viewModel.insertText } : {}),
    ...(insertTextFormat !== undefined ? { insertTextFormat } : {}),
    ...(viewModel.data !== undefined ? { data: viewModel.data } : {}),
  };
}

export function formatCompletionListViewModel(viewModel: CompletionListViewModel): CompletionItem[] {
  return viewModel.items.map(formatCompletionItemViewModel);
}

export function buildEntityCompletionResolveViewModel(
  item: CompletionItem,
  entity: Entity,
): CompletionResolveViewModel {
  return {
    feature: 'completion-resolve',
    label: item.label,
    source: 'workspace-entity',
    detail: entity.signature || (entity.datatype ? `${entity.datatype} ${entity.name}` : item.detail),
    ...(entity.documentation ? { documentation: entity.documentation } : {}),
    blocks: entity.documentation ? [{ kind: 'documentation', lines: [entity.documentation] }] : [],
  };
}

export function buildSystemCompletionResolveViewModel(
  item: CompletionItem,
  entry: PbSystemSymbolEntry,
  documentationLocale: DocumentationLocale,
): CompletionResolveViewModel {
  return {
    feature: 'completion-resolve',
    label: item.label,
    source: 'system-catalog',
    detail: buildSystemCompletionDetail(entry, documentationLocale),
    documentation: buildSystemCompletionDocumentation(entry, documentationLocale),
    blocks: [],
    locale: documentationLocale,
  };
}

export function formatCompletionResolveViewModel(
  originalItem: CompletionItem,
  viewModel: CompletionResolveViewModel,
): CompletionItem {
  return {
    ...originalItem,
    ...(viewModel.detail ? { detail: viewModel.detail } : {}),
    ...(viewModel.documentation ? { documentation: viewModel.documentation } : {}),
  };
}

function buildSystemCompletionDetail(
  entry: PbSystemSymbolEntry,
  documentationLocale: DocumentationLocale,
): string {
  return entry.signatures[0]?.label
    ?? entry.syntax
    ?? getDisplaySummary(entry, documentationLocale);
}

function buildSystemCompletionDocumentation(
  entry: PbSystemSymbolEntry,
  documentationLocale: DocumentationLocale,
): string {
  const blocks: string[] = [];
  const summary = getDisplaySummary(entry, documentationLocale);
  const documentation = getDisplayDocumentation(entry, documentationLocale);
  const returnDocumentation = getDisplayReturnDocumentation(entry, documentationLocale);
  const usageNotes = getDisplayUsageNotes(entry, documentationLocale);
  const obsoleteMessage = getDisplayObsoleteMessage(entry, documentationLocale);

  blocks.push(documentation ?? summary);

  if (entry.signatures.length > 0) {
    blocks.push(`Signatures:\n${entry.signatures.map((signature) => `- ${signature.label}`).join('\n')}`);
  }

  if (returnDocumentation) {
    blocks.push(`Returns:\n${returnDocumentation}`);
  }

  if (usageNotes.length > 0) {
    blocks.push(`Notes:\n${usageNotes.map((note) => `- ${note}`).join('\n')}`);
  }

  if (obsoleteMessage) {
    blocks.push(`Obsolete:\n${obsoleteMessage}`);
  }

  return blocks.join('\n\n');
}