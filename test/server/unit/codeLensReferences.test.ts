import * as assert from 'assert/strict';
import { Range } from 'vscode-languageserver/node';
import {
  formatCodeLensTitle,
  formatHierarchyTitle,
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
      [{ key: 'of_test@0', name: 'of_test', range: Range.create(0, 0, 0, 7) }],
      new Map([['of_test@0', 3]])
    );
    assert.equal(lenses.length, 1);
    assert.equal(lenses[0].command?.title, '3 referencias');
  });

  test('case-insensitive lookup', () => {
    const lenses = provideReferenceCodeLenses(
      [{ key: 'of_test@1', name: 'OF_TEST', range: Range.create(0, 0, 0, 7) }],
      new Map([['of_test@1', 2]])
    );
    assert.equal(lenses[0].command?.title, '2 referencias');
  });

  test('agrega informacion de overrides al titulo', () => {
    const symbol = { key: 'of_test@2', name: 'of_test', range: Range.create(0, 0, 0, 7), overrideCount: 2 };
    assert.equal(formatHierarchyTitle(symbol), '2 overrides');
    assert.equal(formatCodeLensTitle(symbol, 3), '3 referencias · 2 overrides');
  });

  test('muestra override cuando el simbolo sobreescribe un ancestro', () => {
    const symbol = { key: 'of_test@3', name: 'of_test', range: Range.create(0, 0, 0, 7), relation: 'override' as const };
    assert.equal(formatHierarchyTitle(symbol), 'override');
    assert.equal(formatCodeLensTitle(symbol, 1), '1 referencia · override');
  });

  test('degrada honestamente cuando las referencias no estan listas', () => {
    const lenses = provideReferenceCodeLenses(
      [{ key: 'of_test@4', name: 'of_test', range: Range.create(0, 0, 0, 7), unavailableReason: 'referencias no listas' }],
      new Map()
    );

    assert.equal(lenses[0].command, undefined);
    assert.deepEqual(lenses[0].data, { title: 'referencias no listas' });
  });
});
