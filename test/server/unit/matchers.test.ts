import * as assert from 'assert/strict';

import {
  matchEventImplementationHeader,
  matchFunctionImplementationHeader,
  matchOnImplementationHeader,
  matchTypeDefinition,
  matchVariableDeclaration
} from '../../../src/server/parsing/matchers';

suite('unit/matchers', () => {
  test('matchTypeDefinition reconoce TYPE ... FROM ...', () => {
    const result = matchTypeDefinition('type uo_customer from uo_base within w_main');

    assert.ok(result);
    assert.equal(result?.name, 'uo_customer');
    assert.equal(result?.ancestor, 'uo_base');
    assert.equal(result?.container, 'w_main');
  });

  test('matchFunctionImplementationHeader reconoce FUNCTION', () => {
    const result = matchFunctionImplementationHeader('public function string of_get_name()');

    assert.ok(result);
    assert.equal(result?.kind, 'function');
    assert.equal(result?.name, 'of_get_name');
    assert.equal(result?.returnType, 'string');
  });

  test('matchFunctionImplementationHeader reconoce SUBROUTINE', () => {
    const result = matchFunctionImplementationHeader('private subroutine of_reset()');

    assert.ok(result);
    assert.equal(result?.kind, 'subroutine');
    assert.equal(result?.name, 'of_reset');
  });

  test('matchEventImplementationHeader reconoce EVENT', () => {
    const result = matchEventImplementationHeader('event clicked;');

    assert.ok(result);
    assert.equal(result?.name, 'clicked');
    assert.equal(result?.detail, 'event');
  });

  test('matchOnImplementationHeader reconoce ON ...', () => {
    const result = matchOnImplementationHeader('on w_main.cb_accept.clicked;');

    assert.ok(result);
    assert.equal(result?.name, 'w_main.cb_accept.clicked');
    assert.equal(result?.detail, 'on-event');
  });

  test('matchVariableDeclaration reconoce declaración simple', () => {
    const result = matchVariableDeclaration('private string ls_name');

    assert.ok(result);
    assert.equal(result?.modifiers, 'private');
    assert.equal(result?.type, 'string');
    assert.equal(result?.name, 'ls_name');
  });
});