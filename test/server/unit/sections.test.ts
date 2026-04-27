import test from 'node:test';
import assert from 'node:assert/strict';

import { findSections } from '../../../src/server/parsing/sections';

const sampleLines = [
  'forward',
  'type uo_customer from uo_base',
  'end type',
  'end forward',
  'prototypes',
  'function string of_get_name()',
  'end prototypes',
  'variables',
  'string ls_name',
  'end variables'
];

test('findSections detecta FORWARD, PROTOTYPES y VARIABLES', () => {
  const sections = findSections(sampleLines);

  assert.equal(sections.length, 3);
  assert.equal(sections[0].kind, 'forward');
  assert.equal(sections[1].kind, 'prototypes');
  assert.equal(sections[2].kind, 'variables');
});
