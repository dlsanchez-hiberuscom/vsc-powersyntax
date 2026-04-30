import * as assert from 'assert/strict';
import { PUBLIC_API_VERSION, isApiVersionCompatible } from '../../../src/shared/publicApi';

suite('unit/publicApi (B109)', () => {
  test('versión exportada', () => {
    assert.match(PUBLIC_API_VERSION, /^\d+\.\d+\.\d+$/);
  });

  test('major igual ⇒ compatible', () => {
    const major = PUBLIC_API_VERSION.split('.')[0];
    assert.equal(isApiVersionCompatible(`${major}.0.0`), true);
    assert.equal(isApiVersionCompatible(`${major}.99.7`), true);
  });

  test('major distinto ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('99.0.0'), false);
  });

  test('valor inválido ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('abc'), false);
  });
});
