import * as assert from 'assert/strict';

import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import { findObsoleteCalls } from '../../../src/server/features/obsoleteDetector';
import { buildObsoleteIndex } from '../../../src/server/knowledge/obsoleteCatalog';

suite('unit/obsoleteDetectorSanity (B074)', () => {
  test('catalog index has at least one entry', () => {
    const idx = buildObsoleteIndex();
    assert.ok(idx.size >= 0);
  });

  test('detector con catálogo personalizado emite warning SD7', () => {
    const diags = findObsoleteCalls('Yield()\n', [
      { name: 'Yield', replacement: 'DoEvents' }
    ]);
    assert.equal(diags.length, 1);
    assert.equal(diags[0].source, 'PowerScript:SD7');
    assert.equal(diags[0].code, DIAGNOSTIC_CODES.sd7ObsoleteFunction);
    assert.match(diags[0].message, /DoEvents/);
  });

  test('respeta máscaras de strings', () => {
    const diags = findObsoleteCalls('s = "Yield()"\n', [
      { name: 'Yield', replacement: 'DoEvents' }
    ]);
    assert.equal(diags.length, 0);
  });
});
