import { Location, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { getWordAtPosition } from '../utils/wordAtPosition';

/**
 * Provee Go to Definition.
 * Extrae la palabra bajo el cursor, busca en la KnowledgeBase, y devuelve
 * la(s) ubicación(es) donde está definida.
 *
 * Si hay múltiples definiciones (mismo nombre en distintos objetos PB),
 * VS Code mostrará un Peek view con todas las opciones.
 */
export function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase
): Location | Location[] | null {
  const lines = document.getText().split(/\r?\n/);
  const word = getWordAtPosition(lines, position);

  if (!word) return null;

  const definitions = kb.findAllDefinitions(word);
  if (definitions.length === 0) return null;

  const locations = definitions.map(entity =>
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
