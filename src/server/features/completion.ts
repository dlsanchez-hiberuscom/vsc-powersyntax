import { Position, CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import {
  getDisplayDocumentation,
  getDisplaySummary,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import { Entity, EntityKind } from '../knowledge/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { CharType } from '../utils/comments';
import { buildDataWindowModel, rangeContains } from './dataWindowModel';
import { providePowerScriptDataWindowPropertyCompletion } from './dataWindowPropertyPaths';
import { createDocumentQueryContext, resolveDocumentQualifierType } from './queryContext';
import { getQueryConsumerPolicy } from './queryScopePolicy';
import {
  matchesEnumeratedPropertyContext,
  resolveExpectedEnumTypeForCallArgumentAtPosition,
} from './enumeratedContext';

const MAX_GLOBAL_COMPLETION_ENTITIES = getQueryConsumerPolicy('completion').resultCap;

function getMembersForCompletion(
  typeName: string,
  currentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  kbVersion?: number
): Entity[] {
  const cacheKey = typeName.toLowerCase();
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === (kbVersion ?? kb.version)) {
    const cached = hotContext.getInheritedMembers(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const members = graph.getMembers(typeName);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === (kbVersion ?? kb.version)) {
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
  documentationLocale: DocumentationLocale = 'en'
): CompletionItem[] | null {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const lineText = snapshot.maskedText.lines[position.line].substring(0, position.character);

  const dataWindowExpressionCompletion = provideDataWindowExpressionCompletion(document, position);
  if (dataWindowExpressionCompletion) {
    return dataWindowExpressionCompletion;
  }
  
  const dataWindowCompletion = providePowerScriptDataWindowPropertyCompletion(document, position, kb);
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
    const ownerType = resolveDocumentQualifierType(document, enumAssignmentContext.qualifier, position, kb);
    const enumType = systemCatalog.resolveEnumeratedType(enumAssignmentContext.enumTypeName);
    if (ownerType && enumType) {
      const enumValueItems = createEnumeratedValueCompletionItemsForType(
        systemCatalog,
        enumType.name,
        enumAssignmentContext.propertyName,
        ownerType,
        enumAssignmentContext.identifierPrefix,
        documentationLocale,
      );
      if (enumValueItems.length > 0) {
        return enumValueItems;
      }
    }
  }

  const enumArgumentItems = createEnumeratedValueCompletionItemsForCallArgument(
    document,
    position,
    kb,
    systemCatalog,
    trailingIdentifierPrefix,
    documentationLocale,
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
  
  const queryContext = createDocumentQueryContext(document, position, kb, graph, hotContext, 'completion');
  const { currentUri, documentEntities, currentMainObject } = queryContext;
  const items: CompletionItem[] = [];

  if (qualifier) {
    // -----------------------------------------------------
    // SCENARIO 1: We have a qualifier (e.g. this. , ls_var.)
    // -----------------------------------------------------
    const varType = resolveDocumentQualifierType(document, qualifier, position, kb);
    if (varType) {
      let members: Entity[] = [];

      if (varType.toLowerCase() === 'super' && currentMainObject?.baseTypeName) {
        members = getMembersForCompletion(currentMainObject.baseTypeName, currentUri, kb, graph, hotContext, kbVersion);
      } else if (varType.toLowerCase() === 'this' && currentMainObject) {
        members = getMembersForCompletion(currentMainObject.name, currentUri, kb, graph, hotContext, kbVersion);
      } else {
        members = getMembersForCompletion(varType, currentUri, kb, graph, hotContext, kbVersion);
      }

      // Deduplicate members by name (in case of overrides, we just want to show it once in completion)
      const seen = new Set<string>();
      for (const m of members) {
        if (!m.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(m.name.toLowerCase())) continue;
        seen.add(m.name.toLowerCase());
        
        items.push(createCompletionItem(m, '1_member_'));
      }

      for (const sys of systemCatalog.listMembersForOwner([varType])) {
        if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(sys.name.toLowerCase())) continue;
        seen.add(sys.name.toLowerCase());

        items.push(createSystemCompletionItem(sys, '1_member_', documentationLocale));
      }

      for (const sys of systemCatalog.listEventsForOwner([varType])) {
        if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(sys.name.toLowerCase())) continue;
        seen.add(sys.name.toLowerCase());

        items.push(createSystemCompletionItem(sys, '1_member_', documentationLocale));
      }
    }
  } else {
    // -----------------------------------------------------
    // SCENARIO 2: No qualifier (e.g. just started typing)
    // -----------------------------------------------------

    const seen = new Set<string>();

    // 1. Local variables
    const scope = kb.getScopeAt(currentUri, position.line);
    if (scope) {
      for (const local of scope.symbols) {
        if (!local.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(local.name.toLowerCase())) continue;
        seen.add(local.name.toLowerCase());
        
        items.push(createCompletionItem(local, '0_local_'));
      }
    }

    // 2. Members of 'this'
    if (currentMainObject) {
      const members = getMembersForCompletion(currentMainObject.name, currentUri, kb, graph, hotContext, kbVersion);
      for (const m of members) {
        if (!m.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(m.name.toLowerCase())) continue;
        seen.add(m.name.toLowerCase());
        
        items.push(createCompletionItem(m, '1_member_'));
      }
    }

    // 3. Global and System functions
    for (const sys of systemCatalog.listGlobalFunctions()) {
      if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
      if (seen.has(sys.name.toLowerCase())) continue;
      seen.add(sys.name.toLowerCase());

      items.push(createSystemCompletionItem(sys, '2_global_', documentationLocale));
    }

    for (const sys of systemCatalog.listStatements()) {
      if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
      if (seen.has(sys.name.toLowerCase())) continue;
      seen.add(sys.name.toLowerCase());

      items.push(createSystemCompletionItem(sys, '2_global_', documentationLocale));
    }

    for (const entity of kb.queryEntities({
      limit: MAX_GLOBAL_COMPLETION_ENTITIES,
      include: (entity) => {
        const isGlobalCandidate = entity.kind === EntityKind.Type
          || (entity.kind === EntityKind.Function && !entity.containerName);
        return isGlobalCandidate && entity.name.toLowerCase().startsWith(identifierPrefix);
      }
    })) {
      // Only include global entities that are types or global functions
      // Actually, we index local functions as EntityKind.Function, but they are bounded to a file/type.
      // A truly global function might just have no containerName.
      if (seen.has(entity.name.toLowerCase())) continue;
      seen.add(entity.name.toLowerCase());

      items.push(createCompletionItem(entity, '2_global_'));
    }

    // 4. Keywords and datatypes from catalog v2 (only if prefix matches)
    if (identifierPrefix.length >= 2) {
      appendCatalogCompletionItems(items, seen, systemCatalog.listReservedWords(), identifierPrefix, '3_reserved_', documentationLocale);
      for (const kw of systemCatalog.listKeywords()) {
        if (!kw.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(kw.name.toLowerCase())) continue;
        seen.add(kw.name.toLowerCase());
        items.push(createSystemCompletionItem(kw, '3_keyword_', documentationLocale));
      }
      appendCatalogCompletionItems(items, seen, systemCatalog.listPronouns(), identifierPrefix, '3_pronoun_', documentationLocale);
      for (const dt of systemCatalog.listDatatypes()) {
        if (!dt.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(dt.name.toLowerCase())) continue;
        seen.add(dt.name.toLowerCase());
        items.push(createSystemCompletionItem(dt, '3_keyword_', documentationLocale));
      }
      for (const st of systemCatalog.listSystemTypes()) {
        if (!st.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(st.name.toLowerCase())) continue;
        seen.add(st.name.toLowerCase());
        items.push(createSystemCompletionItem(st, '3_keyword_', documentationLocale));
      }
      appendCatalogCompletionItems(items, seen, systemCatalog.listEnumeratedTypes(), identifierPrefix, '3_enumerated_type_', documentationLocale);
      appendCatalogCompletionItems(items, seen, systemCatalog.listSystemGlobals(), identifierPrefix, '3_system_global_', documentationLocale);
      appendCatalogCompletionItems(items, seen, systemCatalog.listEnumeratedValues(), identifierPrefix, '3_enumerated_value_', documentationLocale);
    }
  }

  return items.length > 0 ? items : null;
}

function provideDataWindowExpressionCompletion(
  document: TextDocument,
  position: Position,
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

  for (const column of model.tableColumns) {
    const normalized = column.name.toLowerCase();
    if (prefix && !normalized.startsWith(prefix)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    items.push({
      label: column.name,
      kind: CompletionItemKind.Variable,
      detail: column.type ? `DataWindow column · ${column.type}` : 'DataWindow column',
      sortText: `0_dw_column_${normalized}`,
    });
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
    items.push({
      label: control.name,
      kind: CompletionItemKind.Field,
      detail: `DataWindow control · ${control.controlType}`,
      sortText: `1_dw_control_${normalized}`,
    });
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

function createCompletionItem(entity: Entity, sortPrefix: string): CompletionItem {
  let kind: CompletionItemKind;
  switch (entity.kind) {
    case EntityKind.Function:
    case EntityKind.Subroutine:
      kind = CompletionItemKind.Method;
      break;
    case EntityKind.Event:
      kind = CompletionItemKind.Event;
      break;
    case EntityKind.Variable:
      kind = CompletionItemKind.Variable;
      break;
    case EntityKind.Type:
      kind = CompletionItemKind.Class;
      break;
    default:
      kind = CompletionItemKind.Text;
  }

  return {
    label: entity.name,
    kind: kind,
    detail: entity.signature || (entity.datatype ? `${entity.datatype} ${entity.name}` : undefined),
    documentation: entity.documentation,
    sortText: sortPrefix + entity.name.toLowerCase()
  };
}

function appendCatalogCompletionItems(
  items: CompletionItem[],
  seen: Set<string>,
  entries: readonly PbSystemSymbolEntry[],
  identifierPrefix: string,
  sortPrefix: string,
  documentationLocale: DocumentationLocale,
): void {
  for (const entry of entries) {
    const normalizedName = entry.name.toLowerCase();
    if (!normalizedName.startsWith(identifierPrefix)) continue;
    if (seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    items.push(createSystemCompletionItem(entry, sortPrefix, documentationLocale));
  }
}

function createSystemCompletionItem(
  entry: PbSystemSymbolEntry,
  sortPrefix: string,
  documentationLocale: DocumentationLocale,
): CompletionItem {
  let kind: CompletionItemKind;
  switch (entry.kind) {
    case 'event':
      kind = CompletionItemKind.Event;
      break;
    case 'callable':
      kind = entry.invocation === 'global' ? CompletionItemKind.Function : CompletionItemKind.Method;
      break;
    case 'datatype':
      kind = CompletionItemKind.TypeParameter;
      break;
    case 'system-type':
      kind = CompletionItemKind.Class;
      break;
    case 'enumerated-type':
      kind = CompletionItemKind.Enum;
      break;
    case 'system-global':
    case 'pronoun':
      kind = CompletionItemKind.Variable;
      break;
    case 'enumerated-value':
      kind = CompletionItemKind.EnumMember;
      break;
    case 'property':
      kind = CompletionItemKind.Property;
      break;
    case 'constant':
      kind = CompletionItemKind.Constant;
      break;
    default:
      kind = CompletionItemKind.Keyword;
  }

  return {
    label: entry.name,
    kind,
    detail: entry.summary,
    documentation: getDisplayDocumentation(entry, documentationLocale) ?? getDisplaySummary(entry, documentationLocale),
    insertTextFormat: InsertTextFormat.PlainText,
    sortText: sortPrefix + entry.name.toLowerCase()
  };
}

function createEnumeratedValueCompletionItemsForType(
  systemCatalog: SystemCatalog,
  typeName: string,
  propertyName: string,
  ownerType: string,
  identifierPrefix: string,
  documentationLocale: DocumentationLocale,
): CompletionItem[] {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  appendCatalogCompletionItems(
    items,
    seen,
    systemCatalog.listEnumeratedValuesForType(typeName).filter((entry) =>
      matchesEnumeratedPropertyContext(entry, propertyName, ownerType),
    ),
    identifierPrefix,
    '0_enum_value_context_',
    documentationLocale,
  );
  return items;
}

function createEnumeratedValueCompletionItemsForCallArgument(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  identifierPrefix: string,
  documentationLocale: DocumentationLocale = 'en',
): CompletionItem[] {
  const enumTypeName = resolveExpectedEnumTypeForCallArgumentAtPosition(document, position, kb, systemCatalog);
  if (!enumTypeName) {
    return [];
  }

  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  appendCatalogCompletionItems(
    items,
    seen,
    systemCatalog.listEnumeratedValuesForType(enumTypeName),
    identifierPrefix,
    '0_enum_value_context_',
    documentationLocale,
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
