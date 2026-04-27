import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('extractDocumentSymbols devuelve secciones y símbolos reales', () => {
  const document = TextDocument.create('file:///symbols.sru', 'powerbuilder', 1, source);
  const symbols = extractDocumentSymbols(document);

  assert.ok(symbols.length > 0);
  assert.ok(symbols.some((symbol) => symbol.name === 'forward'));
  assert.ok(symbols.some((symbol) => symbol.name === 'prototypes'));
  assert.ok(symbols.some((symbol) => symbol.name === 'variables'));
  assert.ok(symbols.some((symbol) => symbol.name === 'of_get_name'));
});
