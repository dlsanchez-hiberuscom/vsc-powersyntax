import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/hover', () => {
  test('provideHover devuelve hover sobre una función real', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///hover-unit.sru',
      'powerbuilder',
      1,
      source
    );

    const lines = source.split(/\r?\n/);
    const token = 'uf_inicializar';
    const lineIndex = lines.findIndex((line) => line.includes(token));

    assert.ok(lineIndex >= 0, `No se encontró '${token}' en el fixture.`);

    const char = lines[lineIndex].indexOf(token) + 1;
    const hover = provideHover(document, Position.create(lineIndex, char));

    assert.ok(hover, `Hover no debería ser null para '${token}'.`);

    if (hover && typeof hover.contents === 'object' && 'value' in hover.contents) {
      assert.ok(hover.contents.value.length > 0);
    }
  });

  test('provideHover devuelve null cuando no hay símbolo', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///hover-unit-null.sru',
      'powerbuilder',
      1,
      source
    );

    const lines = source.split(/\r?\n/);
    const blankLineIndex = lines.findIndex((line) => line.trim() === '');

    assert.ok(blankLineIndex >= 0, 'No se encontró una línea en blanco en el fixture.');

    const hover = provideHover(document, Position.create(blankLineIndex, 0));
    assert.equal(hover, null);
  });
});