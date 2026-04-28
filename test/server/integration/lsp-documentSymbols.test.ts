import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { loadFixture } from '../helpers/fixtureLoader';

suite('integration/documentSymbols', () => {
  test('documentSymbols devuelve estructura consistente', () => {
    const source = loadFixture('basic/sample_forward.sru');
    const document = TextDocument.create(
      'file:///integration-symbols.sru',
      'powerbuilder',
      1,
      source
    );

    const symbols = extractDocumentSymbols(document);

    assert.ok(symbols.length > 0, 'Debe devolver al menos un símbolo.');

    const names = symbols.map((symbol) => symbol.name);
    assert.ok(
      names.some((name) => ['ue_refresh', 'of_get_name'].includes(name)) || symbols.length >= 3,
      'No se detectó ningún símbolo esperado ni una estructura mínima razonable.'
    );

    for (const symbol of symbols) {
      assert.ok(symbol.name);
      assert.ok(symbol.range.start.line <= symbol.range.end.line);
    }
  });
});