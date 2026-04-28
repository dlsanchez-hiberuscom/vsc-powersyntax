import { SymbolInformation, SymbolKind, Location, Position } from 'vscode-languageserver/node';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { Entity, EntityKind } from '../knowledge/types';

const MAX_RESULTS = 200;

/**
 * Convierte EntityKind del dominio a SymbolKind del protocolo LSP.
 */
function toSymbolKind(kind: EntityKind): SymbolKind {
  switch (kind) {
    case EntityKind.Function: return SymbolKind.Function;
    case EntityKind.Subroutine: return SymbolKind.Function;
    case EntityKind.Event: return SymbolKind.Event;
    case EntityKind.Variable: return SymbolKind.Variable;
    case EntityKind.Type: return SymbolKind.Class;
  }
}

/**
 * Convierte una Entity del dominio a SymbolInformation del protocolo LSP.
 */
function entityToSymbolInformation(entity: Entity): SymbolInformation {
  return {
    name: entity.name,
    kind: toSymbolKind(entity.kind),
    location: Location.create(
      entity.uri,
      {
        start: Position.create(entity.line, entity.character),
        end: Position.create(entity.line, entity.character + entity.name.length)
      }
    )
  };
}

/**
 * Provee Workspace Symbols filtrando la KnowledgeBase por query.
 * Usado por VS Code cuando el usuario abre la búsqueda global de símbolos (Ctrl+T).
 */
export function provideWorkspaceSymbols(query: string, kb: KnowledgeBase): SymbolInformation[] {
  const lowerQuery = query.toLowerCase();
  const allEntities = kb.getAllEntities();
  const results: SymbolInformation[] = [];

  for (const entity of allEntities) {
    if (results.length >= MAX_RESULTS) break;

    // Substring match case-insensitive
    if (lowerQuery === '' || entity.id.includes(lowerQuery)) {
      results.push(entityToSymbolInformation(entity));
    }
  }

  return results;
}
