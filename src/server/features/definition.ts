import { Location, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { resolveDocumentQueryTargets } from './queryContext';

export function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache
): Location | Location[] | null {
  const resolved = resolveDocumentQueryTargets(document, position, kb, graph, hotContext, 'definition');
  if (!resolved) return null;

  const possibleTargets = resolved.targets;

  if (possibleTargets.length === 0) return null;

  const locations = possibleTargets.map(entity =>
    Location.create(
      entity.uri,
      {
        start: Position.create(entity.line, entity.character),
        end: Position.create(entity.line, entity.character + entity.name.length)
      }
    )
  );

  return locations.length === 1 ? locations[0] : locations;
}

