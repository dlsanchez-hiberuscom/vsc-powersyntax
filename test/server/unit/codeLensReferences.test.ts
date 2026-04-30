import * as assert from 'assert/strict';
import { Range } from 'vscode-languageserver/node';
import {
  formatReferenceTitle,
  provideReferenceCodeLenses
} from '../../../src/server/features/codeLensReferences';

suite('unit/codeLensReferences (B066)', () => {
  test('formatReferenceTitle', () => {
    assert.equal(formatReferenceTitle(0), 'sin referencias');
    assert.equal(formatReferenceTitle(1), '1 referencia');
    assert.equal(formatReferenceTitle(7), '7 referencias');
  });

  test('genera lens con conteo', () => {
    const lenses = provideReferenceCodeLenses(
      [{ name: 'of_test', range: Range.create(0, 0, 0, 7) }],
      new Map([['of_test', 3]])
    );
    assert.equal(lenses.length, 1);
    assert.equal(lenses[0].command?.title, '3 referencias');
  });

  test('case-insensitive lookup', () => {
    const lenses = provideReferenceCodeLenses(
      [{ name: 'OF_TEST', range: Range.create(0, 0, 0, 7) }],
      new Map([['of_test', 2]])
    );
    assert.equal(lenses[0].command?.title, '2 referencias');
  });
});
