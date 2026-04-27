import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateStructure } from '../../../src/server/features/diagnostics';
import { loadFixture } from '../helpers/fixtureLoader';

const validSource = loadFixture('basic/sample.sru');
const invalidSource = loadFixture('basic/sample_invalid.sru');

test('integración: diagnostics responde sobre fixture válido', () => {
  const document = TextDocument.create('file:///integration-valid.sru', 'powerbuilder', 1, validSource);
  const diagnostics = validateStructure(document);

  assert.equal(diagnostics.length, 0);
});

test('integración: diagnostics responde sobre fixture inválido', () => {
  const document = TextDocument.create('file:///integration-invalid.sru', 'powerbuilder', 1, invalidSource);
  const diagnostics = validateStructure(document);

  assert.ok(diagnostics.length > 0);
});
