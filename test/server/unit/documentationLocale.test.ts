import * as assert from 'assert/strict';

import {
  resolveDocumentationLocale,
  sanitizeDocumentationLocaleSetting,
} from '../../../src/server/knowledge/system/localization';

suite('unit/documentationLocale', () => {
  test('resuelve auto a espanol cuando VS Code expone locale es-*', () => {
    assert.equal(resolveDocumentationLocale('auto', 'es-ES'), 'es');
  });

  test('resuelve auto a ingles cuando no hay locale soportada', () => {
    assert.equal(resolveDocumentationLocale('auto', 'fr-FR'), 'en');
    assert.equal(resolveDocumentationLocale('auto', undefined), 'en');
  });

  test('sanea valores invalidos de setting al baseline auto', () => {
    assert.equal(sanitizeDocumentationLocaleSetting('pt'), 'auto');
    assert.equal(sanitizeDocumentationLocaleSetting('es'), 'es');
  });
});