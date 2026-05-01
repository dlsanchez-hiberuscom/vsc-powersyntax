import { Position, CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { resolveQualifierType } from '../knowledge/resolution/semanticQueryService';
import { Entity, EntityKind } from '../knowledge/types';
import { normalizeUri } from '../system/uriUtils';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { CharType } from '../utils/comments';

function getActiveEntities(
  currentUri: string,
  kb: KnowledgeBase,
  hotContext?: HotContextCache,
  kbVersion?: number
): Entity[] {
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === (kbVersion ?? kb.version)) {
    const cached = hotContext.getActiveEntities();
    if (cached) {
      return cached;
    }
  }

  const entities = kb.getEntitiesByUri(currentUri);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === (kbVersion ?? kb.version)) {
    hotContext.setActiveEntities(entities);
  }
  return entities;
}

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
  kbVersion?: number
): CompletionItem[] | null {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const lineText = snapshot.maskedText.lines[position.line].substring(0, position.character);
  
  const mask = snapshot.maskedText.masks[position.line];
  
  // If the character before the cursor is a comment or string, we should probably not show completions
  // unless we are specifically in a string-only completion context (not yet implemented)
  if (position.character > 0 && mask && (mask[position.character - 1] === CharType.Comment || mask[position.character - 1] === CharType.String)) {
    return null;
  }

  let qualifier: string | undefined;
  let identifierPrefix = '';

  const qualMatch = lineText.match(/([a-zA-Z_$#%][\w$#%\-]*)\s*\.\s*([a-zA-Z_$#%][\w$#%\-]*)?$/);
  if (qualMatch) {
    qualifier = qualMatch[1];
    identifierPrefix = (qualMatch[2] || '').toLowerCase();
  } else {
    const idMatch = lineText.match(/([a-zA-Z_$#%][\w$#%\-]+)$/);
    if (idMatch) {
      identifierPrefix = idMatch[1].toLowerCase();
    } else {
      // If we don't match anything but we are at a whitespace, we just show global scope (no prefix)
      // Or we can return null to not show completions everywhere.
      // But let's allow empty prefix for now.
    }
  }
  
  const currentUri = normalizeUri(document.uri);
  const items: CompletionItem[] = [];

  const documentEntities = getActiveEntities(currentUri, kb, hotContext, kbVersion);
  const currentMainObject = documentEntities.find(
    e => e.kind === EntityKind.Type
  );

  if (qualifier) {
    // -----------------------------------------------------
    // SCENARIO 1: We have a qualifier (e.g. this. , ls_var.)
    // -----------------------------------------------------
    const varType = resolveQualifierType(qualifier, currentUri, kb, position.line);
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
    const systemSymbols = systemCatalog.getAllSystemSymbols();
    for (const sys of systemSymbols) {
      if (sys.domain !== 'global-functions' && sys.domain !== 'statements') continue;
      if (!sys.name.toLowerCase().startsWith(identifierPrefix)) continue;
      if (seen.has(sys.name.toLowerCase())) continue;
      seen.add(sys.name.toLowerCase());

      items.push({
        label: sys.name,
        kind: sys.kind === 'callable' ? CompletionItemKind.Function : CompletionItemKind.Keyword,
        detail: sys.summary,
        documentation: sys.summary, // Can be improved
        sortText: '2_global_' + sys.name.toLowerCase()
      });
    }

    for (const entity of kb.getAllEntities()) {
      // Only include global entities that are types or global functions
      // Actually, we index local functions as EntityKind.Function, but they are bounded to a file/type.
      // A truly global function might just have no containerName.
      if (entity.kind === EntityKind.Type || (entity.kind === EntityKind.Function && !entity.containerName)) {
        if (!entity.name.toLowerCase().startsWith(identifierPrefix)) continue;
        if (seen.has(entity.name.toLowerCase())) continue;
        seen.add(entity.name.toLowerCase());

        items.push(createCompletionItem(entity, '2_global_'));
      }
    }
  }

  return items.length > 0 ? items : null;
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
