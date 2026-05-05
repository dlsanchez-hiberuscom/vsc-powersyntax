import { Location, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { provideDataWindowDefinitionAdapter } from './dataWindowServingAdapters';
import { resolveCatalogOwnerTypes } from './dataWindowBindingModel';
import { resolveDocumentQualifierType, type DocumentQueryContext } from './queryContext';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { buildDefinitionViewModel, formatDefinitionViewModel } from '../presentation/definitionPresentation';

function createCatalogDefinitionLocation(uri: string): Location {
  return Location.create(uri, {
    start: Position.create(0, 0),
    end: Position.create(0, 0)
  });
}

function resolveCatalogOwnerType(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  hotContext: HotContextCache | undefined,
  queryContext: DocumentQueryContext
): string | undefined {
  const invocationContext = queryContext.context;
  const qualifier = invocationContext?.qualifier;

  if (!invocationContext) {
    return queryContext.currentMainObject?.name;
  }

  switch (qualifier?.toLowerCase()) {
    case undefined:
      return queryContext.currentMainObject?.name;
    case 'this':
      return queryContext.currentMainObject?.name;
    case 'super':
    case 'ancestor':
      return queryContext.currentMainObject?.baseTypeName;
    case 'parent':
      return queryContext.currentMainObject?.containerName;
    default:
      return qualifier
        ? resolveDocumentQualifierType(document, qualifier, position, kb, hotContext)
        : undefined;
  }
}

function resolveSystemCatalogDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  hotContext: HotContextCache | undefined,
  queryContext: DocumentQueryContext
): Location | null {
  const invocationContext = queryContext.context;
  if (!invocationContext || invocationContext.argumentCount === undefined) {
    return null;
  }

  const ownerType = resolveCatalogOwnerType(document, position, kb, hotContext, queryContext);
  if (!ownerType) {
    return null;
  }

  const ownerTypes = resolveCatalogOwnerTypes(ownerType, graph);
  if (ownerTypes.length === 0) {
    return null;
  }

  const symbol = systemCatalog.resolveMemberFunctionForOwner(invocationContext.identifier, ownerTypes);
  const targetUri = symbol?.sourceUrl ?? symbol?.provenance.sourceUrl;
  return targetUri ? createCatalogDefinitionLocation(targetUri) : null;
}

export function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  queryContext?: DocumentQueryContext,
  systemCatalog?: SystemCatalog
): Location | Location[] | null {
  const catalog = systemCatalog ?? new SystemCatalog();
  const dataWindowDefinition = provideDataWindowDefinitionAdapter({
    document,
    position,
    kb,
    graph,
    systemCatalog: catalog,
    hotContext,
  });
  if (dataWindowDefinition) {
    return formatDefinitionViewModel(buildDefinitionViewModel([dataWindowDefinition], 'datawindow'));
  }

  const localQueryContext = queryContext ?? createSemanticQueryFacade({ kb, graph, systemCatalog: catalog, hotContext })
    .createPositionContext(document, position, { traceLabel: 'definition', consumer: 'definition' });
  const resolved = localQueryContext.resolvedTargets;
  if (!resolved) return null;

  const possibleTargets = resolved.targets;

  if (possibleTargets.length === 0) {
    const catalogDefinition = resolveSystemCatalogDefinition(document, position, kb, graph, catalog, hotContext, localQueryContext);
    return catalogDefinition
      ? formatDefinitionViewModel(buildDefinitionViewModel([catalogDefinition], 'system-catalog', resolved))
      : null;
  }

  const locations = possibleTargets.map(entity =>
    Location.create(
      entity.uri,
      {
        start: Position.create(entity.line, entity.character),
        end: Position.create(entity.line, entity.character + entity.name.length)
      }
    )
  );

  return formatDefinitionViewModel(buildDefinitionViewModel(locations, 'workspace', resolved));
}

