import * as assert from 'assert/strict';
import { buildDocumentModel } from '../../../src/server/parsing/documentModel';

suite('unit/documentModel (B135)', () => {
  const sample = [
    'forward',
    'global type w_main from window',
    'end type',
    'end forward',
    '',
    'type variables',
    'integer i',
    'end variables'
  ].join('\n');

  test('produce statements, sections y container', () => {
    const model = buildDocumentModel(sample);
    assert.ok(model.statements.length > 0);
    assert.equal(model.container.globalType?.name, 'w_main');
    assert.ok(model.sections.some((s) => s.kind === 'variables'));
  });
});
