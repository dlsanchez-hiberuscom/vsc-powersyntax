import test from 'node:test';
import assert from 'node:assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('provideHover devuelve hover sobre una función', () => {
  const document = TextDocument.create('file:///hover.sru', 'powerbuilder', 1, source);
  const lines = source.split(/\r?\n/);
  const targetLine = lines.findIndex((line) => line.includes('of_get_name'));
  const char = lines[targetLine].indexOf('of_get_name') + 2;

  const hover = provideHover(document, Position.create(targetLine, char));

  assert.ok(hover);
  if (!hover || typeof hover.contents === 'string' || Array.isArray(hover.contents)) {
    assert.fail('Hover no tiene el formato esperado');
  }

  assert.match(hover.contents.value, /FUNCTION|SUBROUTINE/i);
  assert.match(hover.contents.value, /of_get_name/i);
});

test('provideHover devuelve null cuando no hay símbolo', () => {
  const document = TextDocument.create('file:///hover-null.sru', 'powerbuilder', 1, source);
  const hover = provideHover(document, Position.create(0, 0));

  assert.equal(hover, null);
});
