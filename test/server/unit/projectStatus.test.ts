import * as assert from 'assert/strict';
import { formatProjectStatus } from '../../../src/server/features/projectStatus';

suite('unit/projectStatus (B107)', () => {
  test('ready', () => {
    assert.equal(
      formatProjectStatus({ readiness: 'ready', projectName: 'app', totalFiles: 12, indexedFiles: 12 }),
      'app — 12 archivos'
    );
  });

  test('indexing', () => {
    assert.equal(
      formatProjectStatus({ readiness: 'indexing', projectName: 'app', totalFiles: 100, indexedFiles: 30 }),
      'app — indexando 30/100'
    );
  });

  test('error', () => {
    assert.match(
      formatProjectStatus({ readiness: 'error', projectName: 'app', totalFiles: 0, indexedFiles: 0 }),
      /error/
    );
  });
});
