import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateStructure } from '../../../src/server/features/diagnostics';
import { DIAGNOSTIC_SOURCE } from '../../../src/shared/types';
import { loadFixture } from '../helpers/fixtureLoader';

const validSource = loadFixture('basic/sample.sru');
const invalidSource = loadFixture('basic/sample_invalid.sru');

test('validateStructure no devuelve errores en estructura simple válida', () => {
  const document = TextDocument.create('file:///valid.sru', 'powerbuilder', 1, validSource);
  const diagnostics = validateStructure(document);

  assert.equal(diagnostics.length, 0);
});

test('validateStructure detecta bloque sin cierre', () => {
  const document = TextDocument.create('file:///invalid.sru', 'powerbuilder', 1, invalidSource);
  const diagnostics = validateStructure(document);

  assert.ok(diagnostics.length > 0);
  assert.equal(diagnostics[0].source, DIAGNOSTIC_SOURCE);
  assert.match(diagnostics[0].message, /sin cierre/i);
});
