import * as assert from 'assert/strict';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';

suite('unit/catalogSanity (B112)', () => {
  test('provenance presente en todas las entries', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      if (!e.provenance?.kind || !e.provenance?.authority) bad++;
    }
    assert.equal(bad, 0);
  });

  test('lookup keys no vacíos y en lower-case', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      if (!e.lookupKeys || e.lookupKeys.length === 0) { bad++; continue; }
      for (const k of e.lookupKeys) {
        if (k !== k.toLowerCase()) { bad++; break; }
      }
    }
    assert.equal(bad, 0);
  });

  test('owner-types normalizadas en lower-case', () => {
    let bad = 0;
    for (const e of PB_SYSTEM_SYMBOL_REGISTRY.entries) {
      for (const t of e.normalizedOwnerTypes) {
        if (t !== t.toLowerCase()) { bad++; break; }
      }
    }
    assert.equal(bad, 0);
  });
});
