import * as assert from 'assert/strict';
import { parseSrContainer } from '../../../src/server/parsing/srContainerParser';

suite('unit/srContainer (B113)', () => {
  test('reconoce estructura típica .srw', () => {
    const src = [
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      'global w_main w_main',
      '',
      'type variables',
      'integer i',
      'end variables',
      '',
      'forward prototypes',
      'public function integer of_test()',
      'end prototypes',
      '',
      'on w_main.create',
      'end on',
      '',
      'on w_main.destroy',
      'end on'
    ].join('\n');

    const c = parseSrContainer(src);
    assert.equal(c.forwardLine, 0);
    assert.equal(c.globalType?.name, 'w_main');
    assert.equal(c.globalType?.baseType, 'window');
    assert.ok(c.typeVariablesRange);
    assert.equal(c.typeVariablesRange?.kind, 'variables');
    assert.ok(c.forwardPrototypesRange);
    assert.equal(c.onCreateLine, 14);
    assert.equal(c.onDestroyLine, 17);
  });

  test('archivo sin estructura → todo undefined', () => {
    const c = parseSrContainer('integer i\n');
    assert.equal(c.globalType, undefined);
    assert.equal(c.forwardLine, undefined);
  });
});
