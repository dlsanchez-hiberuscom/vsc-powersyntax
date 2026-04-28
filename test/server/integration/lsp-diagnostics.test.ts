import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateStructure } from '../../../src/server/features/diagnostics';
import { loadFixture } from '../helpers/fixtureLoader';

suite('integration/diagnostics', () => {
  test('diagnostics responde sobre entrada válida mínima', () => {
    const validSource = [
      'forward',
      'end forward',
      '',
      'forward prototypes',
      'end prototypes',
      '',
      'type variables',
      'end variables'
    ].join('\r\n');

    const document = TextDocument.create(
      'file:///integration-valid.sru',
      'powerbuilder',
      1,
      validSource
    );

    const diagnostics = validateStructure(document);

    assert.equal(diagnostics.length, 0);
  });

  test('diagnostics responde sobre fixture inválido', () => {
    const invalidSource = loadFixture('basic/sample_invalid.sru');
    const document = TextDocument.create(
      'file:///integration-invalid.sru',
      'powerbuilder',
      1,
      invalidSource
    );

    const diagnostics = validateStructure(document);

    assert.ok(diagnostics.length > 0);
  });
});
