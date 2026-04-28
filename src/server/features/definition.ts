import { Location, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { getInvocationContext } from '../utils/invocationContext';
import { resolveTargetEntity } from '../knowledge/resolution/semanticQueryService';

export function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph
): Location | Location[] | null {
  const lines = document.getText().split(/\r?\n/);
  const context = getInvocationContext(lines, position);

  if (!context) return null;

  const possibleTargets = resolveTargetEntity(context, document.uri, kb, graph, position.line);

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

