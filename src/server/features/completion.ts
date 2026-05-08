import { Position, CompletionItem } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { DocumentationLocale } from '../knowledge/system/localization';
import { Entity, EntityKind } from '../knowledge/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { CharType } from '../utils/comments';
import { resolveCatalogOwnerTypes } from './dataWindowBindingModel';
import { buildDataWindowModel, rangeContains } from './dataWindowModel';
import { provideDataWindowCompletionAdapter } from './dataWindowServingAdapters';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { getQueryConsumerPolicy } from './queryScopePolicy';
import { matchesEnumeratedPropertyContext } from './enumeratedContext';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import {
  buildEntityCompletionItemViewModel,
  buildEntityCompletionResolveViewModel,
  buildStaticCompletionItemViewModel,
  buildSystemCompletionItemViewModel,
  buildSystemCompletionResolveViewModel,
  formatCompletionItemViewModel,
  formatCompletionResolveViewModel,
} from '../presentation/completionPresentation';

const MAX_GLOBAL_COMPLETION_ENTITIES = getQueryConsumerPolicy('completion').resultCap;

const COMPLETION_RESOLVE_DATA_PROTOCOL = 'vsc-powersyntax.completion';
const COMPLETION_RESOLVE_DATA_VERSION = 1;

export type CompletionRankGroup =
  | 'local'
  | 'argument'
  | 'qualified-member'
  | 'current-shared-member'
  | 'current-instance-member'
  | 'global'
  | 'reserved-word'
  | 'keyword'
  | 'pronoun'
  | 'datatype'
  | 'enumerated-type'
  | 'system-global'
  | 'enumerated-value'
  | 'datawindow-expression-function';

export const COMPLETION_RANK_SORT_PREFIX: Readonly<Record<CompletionRankGroup, string>> = {
  local: '0_local_0_',
  argument: '0_local_1_argument_',
  'qualified-member': '1_member_',
  'current-shared-member': '1_shared_',
  'current-instance-member': '1_instance_',
  global: '2_global_',
  'reserved-word': '3_reserved_',
  keyword: '3_keyword_',
  pronoun: '3_pronoun_',
  datatype: '3_datatype_',
  'enumerated-type': '3_enumerated_type_',
  'system-global': '3_system_global_',
  'enumerated-value': '3_enumerated_value_',
  'datawindow-expression-function': '0_dw_expr_function_',
};

interface CompletionResolveDataBase {
  protocol: typeof COMPLETION_RESOLVE_DATA_PROTOCOL;
  version: typeof COMPLETION_RESOLVE_DATA_VERSION;
  uri: string;
  documentVersion: number;
  kbVersion: number;
  documentFingerprint: number | string;
  sourceOrigin: SourceOrigin | 'unknown';
  locale: DocumentationLocale;
}

export interface CompletionProviderContext {
  sourceOrigin?: SourceOrigin | 'unknown';
}

export type CompletionResolveNegativeReason = 'unresolved';

export interface CompletionItemResolveResult {
  item: CompletionItem;
  resolved: boolean;
  negativeReason?: CompletionResolveNegativeReason;
}

export type CompletionItemResolveData = CompletionResolveDataBase & (
  | {
      source: 'system';
      symbolId: string;
      name: string;
      domain: PbSystemSymbolEntry['domain'];
    }
  | {
      source: 'entity';
      entityId: string;
      name: string;
      entityUri: string;
      entityKind: EntityKind;
      line: number;
      character: number;
    }
);

interface CompletionResolveContext extends CompletionResolveDataBase {}

function createCompletionResolveContext(
  document: TextDocument,
  kb: KnowledgeBase,
  documentationLocale: DocumentationLocale,
  providerContext?: CompletionProviderContext,
): CompletionResolveContext {
  return {
    protocol: COMPLETION_RESOLVE_DATA_PROTOCOL,
    version: COMPLETION_RESOLVE_DATA_VERSION,
    uri: document.uri,
    documentVersion: document.version,
    kbVersion: kb.version,
    documentFingerprint: kb.semanticEpoch,
    sourceOrigin: providerContext?.sourceOrigin ?? 'unknown',
    locale: documentationLocale,
  };
}

function getMembersForCompletion(
  typeName: string,
  currentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  semanticEpoch?: number
): Entity[] {
  const cacheKey = typeName.toLowerCase();
  const targetEpoch = semanticEpoch ?? kb.semanticEpoch;
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getSemanticEpoch() === targetEpoch) {
    const cached = hotContext.getInheritedMembers(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const members = graph.getMembers(typeName);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getSemanticEpoch() === targetEpoch) {
    hotContext.setInheritedMembers(cacheKey, members);
  }
  return members;
}

export function provideCompletion(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  kbVersion?: number,
  documentationLocale: DocumentationLocale = 'en',
  providerContext?: CompletionProviderContext,
): CompletionItem[] | null {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const lineText = snapshot.maskedText.lines[position.line].substring(0, position.character);
  const resolveContext = createCompletionResolveContext(document, kb, documentationLocale, providerContext);
  const facade = createSemanticQueryFacade({ kb, graph, systemCatalog, hotContext });

  const dataWindowExpressionCompletion = provideDataWindowExpressionCompletion(document, position, systemCatalog, documentationLocale, resolveContext);
  if (dataWindowExpressionCompletion) {
    return dataWindowExpressionCompletion;
  }
  
  const dataWindowCompletion = provideDataWindowCompletionAdapter({
    document,
    position,
    kb,
    graph,
    systemCatalog,
    hotContext,
  });
  if (dataWindowCompletion) {
    return dataWindowCompletion;
  }

  const mask = snapshot.maskedText.masks[position.line];
  
  // If the character before the cursor is a comment or string, we should probably not show completions
  // unless we are specifically in a string-only completion context (not yet implemented)
  if (position.character > 0 && mask && (mask[position.character - 1] === CharType.Comment || mask[position.character - 1] === CharType.String)) {
    return null;
  }

  const trailingIdentifierPrefix = extractTrailingIdentifierPrefix(lineText);

  const enumAssignmentContext = extractEnumeratedAssignmentContext(lineText);
  if (enumAssignmentContext) {
    const ownerType = facade.resolveReceiverType(document, enumAssignmentContext.qualifier, position).ownerType ?? undefined;
    const ownerTypes = resolveCatalogOwnerTypes(ownerType, graph);
    const enumType = systemCatalog.resolveEnumeratedType(enumAssignmentContext.enumTypeName);
    if (ownerTypes.length > 0 && enumType) {
      const enumValueItems = createEnumeratedValueCompletionItemsForType(
        systemCatalog,
        enumType.name,
        enumAssignmentContext.propertyName,
        ownerTypes,
        enumAssignmentContext.identifierPrefix,
        documentationLocale,
        resolveContext,
      );
      if (enumValueItems.length > 0) {
        return enumValueItems;
      }
    }
  }

  const enumArgumentItems = createEnumeratedValueCompletionItemsForCallArgument(
    document,
    position,
    facade,
    systemCatalog,
    trailingIdentifierPrefix,
    documentationLocale,
    resolveContext,
  );
  if (enumArgumentItems.length > 0) {
    return enumArgumentItems;
  }

  let qualifier: string | undefined;
  let identifierPrefix = trailingIdentifierPrefix;

  const qualMatch = lineText.match(/([a-zA-Z_$#%][\w$#%\-]*)\s*\.\s*([a-zA-Z_$#%][\w$#%\-]*)?$/);
  if (qualMatch) {
    qualifier = qualMatch[1];
    identifierPrefix = (qualMatch[2] || '').toLowerCase();
  } else {
    if (!identifierPrefix) {
      // If we don't match anything but we are at a whitespace, we just show global scope (no prefix)
      // Or we can return null to not show completions everywhere.
      // But let's allow empty prefix for now.
    }
  }
  
  const queryContext = facade.createPositionContext(document, position, { consumer: 'completion', traceLabel: 'completion' });
  const { currentUri, documentEntities, currentMainObject } = queryContext;
  const items: CompletionItem[] = [];

  if (qualifier) {
    // -----------------------------------------------------
    // SCENARIO 1: We have a qualifier (e.g. this. , ls_var.)
    // -----------------------------------------------------
    const varType = facade.resolveReceiverType(document, qualifier, position).ownerType ?? undefined;
    if (varType) {
      let members: Entity[] = [];
      let catalogOwnerType = varType;

      if (varType.toLowerCase() === 'super' && currentMainObject?.baseTypeName) {
        members = getMembersForCompletion(currentMainObject.baseTypeName, currentUri, kb, graph, hotContext, kbVersion);
        catalogOwnerType = currentMainObject.baseTypeName;
      } else if (varType.toLowerCase() === 'this' && currentMainObject) {
        members = getMembersForCompletion(currentMainObject.name, currentUri, kb, graph, hotContext, kbVersion);
        catalogOwnerType = currentMainObject.name;
      } else {
        members = getMembersForCompletion(varType, currentUri, kb, graph, hotContext, kbVersion);
      }

      const catalogOwnerTypes = resolveCatalogOwnerTypes(catalogOwnerType, graph);

      // Deduplicate members by name (in case of overrides, we just want to show it once in completion)
      const seen = new Set<string>();
      for (const m of members) {
        if (!m.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(m.name.toLowerCase())) continue;
        seen.add(m.name.toLowerCase());
        
        items.push(createCompletionItem(m, COMPLETION_RANK_SORT_PREFIX['qualified-member'], resolveContext));
      }

      for (const sys of systemCatalog.listMembersForOwner(catalogOwnerTypes)) {
        if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(sys.name.toLowerCase())) continue;
        seen.add(sys.name.toLowerCase());

        items.push(createSystemCompletionItem(sys, COMPLETION_RANK_SORT_PREFIX['qualified-member'], documentationLocale, resolveContext));
      }

      for (const sys of systemCatalog.listEventsForOwner(catalogOwnerTypes)) {
        if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(sys.name.toLowerCase())) continue;
        seen.add(sys.name.toLowerCase());

        items.push(createSystemCompletionItem(sys, COMPLETION_RANK_SORT_PREFIX['qualified-member'], documentationLocale, resolveContext));
      }
    }
  } else {
    // -----------------------------------------------------
    // SCENARIO 2: No qualifier (e.g. just started typing)
    // -----------------------------------------------------

    const seen = new Set<string>();

    // 1. Local variables
    const scope = kb.getScopeAtReadonly(currentUri, position.line);
    if (scope) {
      for (const local of scope.symbols) {
        if (!local.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(local.name.toLowerCase())) continue;
        seen.add(local.name.toLowerCase());
        
        const priority = local.scope === 'Argumento'
          ? COMPLETION_RANK_SORT_PREFIX.argument
          : COMPLETION_RANK_SORT_PREFIX.local;
        items.push(createCompletionItem(local, priority, resolveContext));
      }
    }

    // 2. Members of 'this'
    if (currentMainObject) {
      const members = getMembersForCompletion(currentMainObject.name, currentUri, kb, graph, hotContext, kbVersion);
      for (const m of members) {
        if (!m.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(m.name.toLowerCase())) continue;
        seen.add(m.name.toLowerCase());
        
        const priority = m.scope === 'Compartida'
          ? COMPLETION_RANK_SORT_PREFIX['current-shared-member']
          : COMPLETION_RANK_SORT_PREFIX['current-instance-member'];
        items.push(createCompletionItem(m, priority, resolveContext));
      }
    }

    // 3. Global and System symbols
    for (const sys of systemCatalog.listGlobalFunctions()) {
      if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
      if (seen.has(sys.name.toLowerCase())) continue;
      seen.add(sys.name.toLowerCase());

      items.push(createSystemCompletionItem(sys, COMPLETION_RANK_SORT_PREFIX.global, documentationLocale, resolveContext));
    }

    for (const sys of systemCatalog.listStatements()) {
      if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
      if (seen.has(sys.name.toLowerCase())) continue;
      seen.add(sys.name.toLowerCase());

      items.push(createSystemCompletionItem(sys, COMPLETION_RANK_SORT_PREFIX.global, documentationLocale, resolveContext));
    }

    for (const entity of kb.queryEntities({
      limit: MAX_GLOBAL_COMPLETION_ENTITIES,
      include: (entity) => {
        const isGlobalCandidate = entity.kind === EntityKind.Type
          || (entity.kind === EntityKind.Function && !entity.containerName)
          || (entity.kind === EntityKind.Variable && entity.scope === 'Global');
        return isGlobalCandidate && entity.name.toLowerCase().startsWith(identifierPrefix);
      }
    })) {
      if (seen.has(entity.name.toLowerCase())) continue;
      seen.add(entity.name.toLowerCase());

      items.push(createCompletionItem(entity, COMPLETION_RANK_SORT_PREFIX.global, resolveContext));
    }

    // 4. Keywords and datatypes from catalog v2 (only if prefix matches)
    if (identifierPrefix.length >= 2) {
      appendCatalogCompletionItems(items, seen, systemCatalog.listReservedWords(), identifierPrefix, COMPLETION_RANK_SORT_PREFIX['reserved-word'], documentationLocale, resolveContext);
      for (const kw of systemCatalog.listKeywords()) {
        if (!kw.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(kw.name.toLowerCase())) continue;
        seen.add(kw.name.toLowerCase());
        items.push(createSystemCompletionItem(kw, COMPLETION_RANK_SORT_PREFIX.keyword, documentationLocale, resolveContext));
      }
      appendCatalogCompletionItems(items, seen, systemCatalog.listPronouns(), identifierPrefix, COMPLETION_RANK_SORT_PREFIX.pronoun, documentationLocale, resolveContext);
      for (const dt of systemCatalog.listDatatypes()) {
        if (!dt.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(dt.name.toLowerCase())) continue;
        seen.add(dt.name.toLowerCase());
        items.push(createSystemCompletionItem(dt, COMPLETION_RANK_SORT_PREFIX.datatype, documentationLocale, resolveContext));
      }
      for (const st of systemCatalog.listSystemTypes()) {
        if (!st.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(st.name.toLowerCase())) continue;
        seen.add(st.name.toLowerCase());
        items.push(createSystemCompletionItem(st, COMPLETION_RANK_SORT_PREFIX.datatype, documentationLocale, resolveContext));
      }
      appendCatalogCompletionItems(items, seen, systemCatalog.listEnumeratedTypes(), identifierPrefix, COMPLETION_RANK_SORT_PREFIX['enumerated-type'], documentationLocale, resolveContext);
      appendCatalogCompletionItems(items, seen, systemCatalog.listSystemGlobals(), identifierPrefix, COMPLETION_RANK_SORT_PREFIX['system-global'], documentationLocale, resolveContext);
      appendCatalogCompletionItems(items, seen, systemCatalog.listEnumeratedValues(), identifierPrefix, COMPLETION_RANK_SORT_PREFIX['enumerated-value'], documentationLocale, resolveContext);
    }
  }

  return items.length > 0 ? items : null;
}

function provideDataWindowExpressionCompletion(
  document: TextDocument,
  position: Position,
  systemCatalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
  resolveContext: CompletionResolveContext,
): CompletionItem[] | null {
  const model = buildDataWindowModel(document);
  if (!model) {
    return null;
  }

  const expression = model.expressions.find((entry) => rangeContains(entry.selectionRange, position));
  if (!expression) {
    return null;
  }

  const expressionStartOffset = document.offsetAt(expression.selectionRange.start);
  const cursorOffset = document.offsetAt(position);
  if (cursorOffset < expressionStartOffset) {
    return null;
  }

  const prefixSource = document.getText().slice(expressionStartOffset, cursorOffset);
  const lastNonWhitespace = findLastNonWhitespaceCharacter(prefixSource);
  if (lastNonWhitespace === '.') {
    return null;
  }

  const prefixMatch = prefixSource.match(/([A-Za-z_][\w$#%]*)$/);
  const prefix = (prefixMatch?.[1] ?? '').toLowerCase();
  const seen = new Set<string>();
  const items: CompletionItem[] = [];

  appendCatalogCompletionItems(
    items,
    seen,
    systemCatalog.listDataWindowExpressionFunctions(),
    prefix,
    COMPLETION_RANK_SORT_PREFIX['datawindow-expression-function'],
    documentationLocale,
    resolveContext,
  );

  for (const column of model.tableColumns) {
    const normalized = column.name.toLowerCase();
    if (prefix && !normalized.startsWith(prefix)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    items.push(formatCompletionItemViewModel(buildStaticCompletionItemViewModel({
      label: column.name,
      kind: 'variable',
      source: 'datawindow-expression',
      detail: column.type ? `DataWindow column · ${column.type}` : 'DataWindow column',
      sortText: `1_dw_column_${normalized}`,
    })));
  }

  for (const control of model.controls) {
    const normalized = control.name.toLowerCase();
    if (prefix && !normalized.startsWith(prefix)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    items.push(formatCompletionItemViewModel(buildStaticCompletionItemViewModel({
      label: control.name,
      kind: 'field',
      source: 'datawindow-expression',
      detail: `DataWindow control · ${control.controlType}`,
      sortText: `2_dw_control_${normalized}`,
    })));
  }

  return items.length > 0 ? items : null;
}

function findLastNonWhitespaceCharacter(text: string): string | undefined {
  for (let index = text.length - 1; index >= 0; index--) {
    if (!/\s/.test(text[index])) {
      return text[index];
    }
  }

  return undefined;
}

function extractTrailingIdentifierPrefix(lineText: string): string {
  const match = lineText.match(/([a-zA-Z_$#%][\w$#%\-]*)$/);
  return (match?.[1] ?? '').toLowerCase();
}

function createCompletionItem(entity: Entity, sortPrefix: string, resolveContext: CompletionResolveContext): CompletionItem {
  return formatCompletionItemViewModel(buildEntityCompletionItemViewModel(
    entity,
    sortPrefix + entity.name.toLowerCase(),
    createEntityCompletionResolveData(entity, resolveContext),
  ));
}

function createEntityCompletionResolveData(
  entity: Entity,
  resolveContext: CompletionResolveContext,
): CompletionItemResolveData {
  return {
    ...resolveContext,
    source: 'entity',
    entityId: entity.id,
    name: entity.name,
    entityUri: entity.uri,
    entityKind: entity.kind,
    line: entity.line,
    character: entity.character,
  };
}

function createSystemCompletionResolveData(
  entry: PbSystemSymbolEntry,
  resolveContext: CompletionResolveContext,
): CompletionItemResolveData {
  return {
    ...resolveContext,
    source: 'system',
    symbolId: entry.id,
    name: entry.name,
    domain: entry.domain,
  };
}

export function isCompletionItemResolveData(value: unknown): value is CompletionItemResolveData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CompletionItemResolveData>;
  return candidate.protocol === COMPLETION_RESOLVE_DATA_PROTOCOL
    && candidate.version === COMPLETION_RESOLVE_DATA_VERSION
    && typeof candidate.uri === 'string'
    && typeof candidate.documentVersion === 'number'
    && typeof candidate.kbVersion === 'number'
    && (typeof candidate.documentFingerprint === 'number' || typeof candidate.documentFingerprint === 'string')
    && (candidate.source === 'system' || candidate.source === 'entity');
}

export function resolveCompletionItem(
  item: CompletionItem,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  documentationLocale: DocumentationLocale = 'en',
): CompletionItem {
  return resolveCompletionItemResult(item, kb, systemCatalog, documentationLocale).item;
}

export function resolveCompletionItemResult(
  item: CompletionItem,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  documentationLocale: DocumentationLocale = 'en',
): CompletionItemResolveResult {
  const data = isCompletionItemResolveData(item.data) ? item.data : null;
  if (!data) {
    return { item, resolved: false };
  }

  if (data.source === 'system') {
    const entry = resolveSystemCompletionEntry(systemCatalog, data);
    return entry
      ? { item: enrichSystemCompletionItem(item, entry, documentationLocale), resolved: true }
      : { item, resolved: false, negativeReason: 'unresolved' };
  }

  const entity = resolveEntityCompletionEntry(kb, data);
  return entity
    ? { item: enrichEntityCompletionItem(item, entity), resolved: true }
    : { item, resolved: false, negativeReason: 'unresolved' };
}

function resolveSystemCompletionEntry(
  systemCatalog: SystemCatalog,
  data: Extract<CompletionItemResolveData, { source: 'system' }>,
): PbSystemSymbolEntry | undefined {
  return systemCatalog.findByDomainAndLookupKey(data.domain, data.name)
    .find((entry) => entry.id === data.symbolId);
}

function resolveEntityCompletionEntry(
  kb: KnowledgeBase,
  data: Extract<CompletionItemResolveData, { source: 'entity' }>,
): Entity | undefined {
  const direct = kb.getEntitiesByUriReadonly(data.entityUri).find((entity) => matchesCompletionEntity(entity, data));
  if (direct) {
    return direct;
  }

  const scope = kb.getScopeAtReadonly(data.entityUri, data.line);
  return scope?.symbols.find((entity) => matchesCompletionEntity(entity, data));
}

function matchesCompletionEntity(
  entity: Entity,
  data: Extract<CompletionItemResolveData, { source: 'entity' }>,
): boolean {
  return entity.id === data.entityId
    && entity.kind === data.entityKind
    && entity.name === data.name
    && entity.line === data.line
    && entity.character === data.character;
}

function enrichEntityCompletionItem(item: CompletionItem, entity: Entity): CompletionItem {
  return formatCompletionResolveViewModel(item, buildEntityCompletionResolveViewModel(item, entity));
}

function enrichSystemCompletionItem(
  item: CompletionItem,
  entry: PbSystemSymbolEntry,
  documentationLocale: DocumentationLocale,
): CompletionItem {
  return formatCompletionResolveViewModel(item, buildSystemCompletionResolveViewModel(item, entry, documentationLocale));
}

function appendCatalogCompletionItems(
  items: CompletionItem[],
  seen: Set<string>,
  entries: readonly PbSystemSymbolEntry[],
  identifierPrefix: string,
  sortPrefix: string,
  documentationLocale: DocumentationLocale,
  resolveContext: CompletionResolveContext,
): void {
  for (const entry of entries) {
    const normalizedName = entry.name.toLowerCase();
    if (!normalizedName.startsWith(identifierPrefix)) continue;
    if (seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    items.push(createSystemCompletionItem(entry, sortPrefix, documentationLocale, resolveContext));
  }
}

function createSystemCompletionItem(
  entry: PbSystemSymbolEntry,
  sortPrefix: string,
  documentationLocale: DocumentationLocale,
  resolveContext: CompletionResolveContext,
): CompletionItem {
  return formatCompletionItemViewModel(buildSystemCompletionItemViewModel(
    entry,
    sortPrefix + entry.name.toLowerCase(),
    documentationLocale,
    createSystemCompletionResolveData(entry, resolveContext),
  ));
}

function createEnumeratedValueCompletionItemsForType(
  systemCatalog: SystemCatalog,
  typeName: string,
  propertyName: string,
  ownerTypes: readonly string[],
  identifierPrefix: string,
  documentationLocale: DocumentationLocale,
  resolveContext: CompletionResolveContext,
): CompletionItem[] {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  appendCatalogCompletionItems(
    items,
    seen,
    systemCatalog.listEnumeratedValuesForType(typeName).filter((entry) =>
      matchesEnumeratedPropertyContext(entry, propertyName, ownerTypes),
    ),
    identifierPrefix,
    '0_enum_value_context_',
    documentationLocale,
    resolveContext,
  );
  return items;
}

function createEnumeratedValueCompletionItemsForCallArgument(
  document: TextDocument,
  position: Position,
  facade: ReturnType<typeof createSemanticQueryFacade>,
  systemCatalog: SystemCatalog,
  identifierPrefix: string,
  documentationLocale: DocumentationLocale,
  resolveContext: CompletionResolveContext,
): CompletionItem[] {
  const enumContext = facade.resolveExpectedEnumContext(document, position);
  if (!enumContext) {
    return [];
  }

  const scopedEntries = enumContext.dataWindowContext
    ? systemCatalog.listDataWindowConstantValuesForType(enumContext.enumTypeName)
    : systemCatalog.listEnumeratedValuesForType(enumContext.enumTypeName);
  const sourceEntries = enumContext.dataWindowContext && scopedEntries.length === 0
    ? systemCatalog.listEnumeratedValuesForType(enumContext.enumTypeName)
    : scopedEntries;

  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  appendCatalogCompletionItems(
    items,
    seen,
    sourceEntries,
    identifierPrefix,
    '0_enum_value_context_',
    documentationLocale,
    resolveContext,
  );
  return items;
}

function extractEnumeratedAssignmentContext(lineText: string): {
  qualifier: string;
  enumTypeName: string;
  propertyName: string;
  identifierPrefix: string;
} | null {
  const match = lineText.match(/([a-zA-Z_$#%][\w$#%\-]*)\s*\.\s*([a-zA-Z_$#%][\w$#%\-]*)\s*=\s*([a-zA-Z_$#%][\w$#%\-]*)?$/);
  if (!match) {
    return null;
  }

  return {
    qualifier: match[1],
    enumTypeName: match[2],
    propertyName: match[2],
    identifierPrefix: (match[3] || '').toLowerCase(),
  };
}
