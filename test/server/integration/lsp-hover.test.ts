import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { loadFixture } from '../helpers/fixtureLoader';

suite('integration/hover', () => {
  test('hover funciona sobre fixture real', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///integration-hover.sru',
      'powerbuilder',
      1,
      source
    );

    const lines = source.split(/\r?\n/);
    const candidates = [
      'uf_inicializar',
      'constructor',
      'destructor',
      'uf_dame_empresas_filtradas'
    ];

    let token: string | undefined;
    let lineIndex = -1;

    for (const candidate of candidates) {
      const idx = lines.findIndex((line) => line.includes(candidate));
      if (idx >= 0) {
        token = candidate;
        lineIndex = idx;
        break;
      }
    }

    assert.ok(token, 'No se encontró ningún símbolo usable en el fixture.');
    assert.ok(lineIndex >= 0, `No se encontró línea para el símbolo '${token}'.`);

    const char = lines[lineIndex].indexOf(token!) + 1;
    const kb = new KnowledgeBase();
    kb.upsertDocument(document.uri, [{
      id: token!.toLowerCase(),
      name: token!,
      kind: EntityKind.Function,
      uri: document.uri,
      line: lineIndex,
      character: char
    }]);
    const catalog = new SystemCatalog();
    const graph = new InheritanceGraph(kb);

    const hover = provideHover(document, Position.create(lineIndex, char), kb, catalog, graph);

    assert.ok(hover, `Hover no debería ser null para '${token}'.`);

    if (hover && typeof hover.contents === 'object' && 'value' in hover.contents) {
      assert.ok(hover.contents.value.length > 0);
    }
  });
});