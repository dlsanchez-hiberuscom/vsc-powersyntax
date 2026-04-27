import test from 'node:test';
import assert from 'node:assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { loadFixture } from '../helpers/fixtureLoader';

const source = loadFixture('basic/sample_forward.sru');

test('integración: hover funciona sobre fixture real', () => {
  const document = TextDocument.create('file:///integration-hover.sru', 'powerbuilder', 1, source);
  const lines = source.split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => line.includes('ue_refresh'));
  const char = lines[lineIndex].indexOf('ue_refresh') + 1;

  const hover = provideHover(document, Position.create(lineIndex, char));

  assert.ok(hover);
});
