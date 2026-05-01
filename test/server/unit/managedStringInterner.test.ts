import * as assert from 'assert/strict';

import { ManagedStringInterner } from '../../../src/server/knowledge/ManagedStringInterner';

suite('unit/managedStringInterner (B164)', () => {
  test('compacta por documento y libera al reemplazar o borrar', () => {
    const interner = new ManagedStringInterner();

    interner.replaceDocument('docA', (intern) => [intern('alpha'), intern('alpha'), intern('beta')]);
    assert.deepEqual(interner.getStats(), { uniqueStrings: 2, trackedDocuments: 1 });

    interner.replaceDocument('docB', (intern) => [intern('alpha')]);
    assert.deepEqual(interner.getStats(), { uniqueStrings: 2, trackedDocuments: 2 });

    interner.replaceDocument('docA', (intern) => [intern('gamma')]);
    assert.deepEqual(interner.getStats(), { uniqueStrings: 2, trackedDocuments: 2 });

    interner.removeDocument('docB');
    assert.deepEqual(interner.getStats(), { uniqueStrings: 1, trackedDocuments: 1 });

    interner.removeDocument('docA');
    assert.deepEqual(interner.getStats(), { uniqueStrings: 0, trackedDocuments: 0 });
  });
});