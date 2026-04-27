import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('integración: documentSymbols devuelve estructura consistente', () => {
  const document = TextDocument.create('file:///integration-symbols.sru', 'powerbuilder', 1, source);
  const symbols = extractDocumentSymbols(document);

  assert.ok(symbols.length >= 3);
  assert.ok(symbols.some((symbol) => symbol.name === 'of_get_name'));
  assert.ok(symbols.some((symbol) => symbol.name === 'ue_refresh'));
});
