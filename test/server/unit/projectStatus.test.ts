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
      formatProjectStatus({ readiness: 'indexing', projectName: 'app', totalFiles: 100, indexedFiles: 30, pass: 'structural' }),
      'app — estructural 30/100'
    );
  });

  test('degraded', () => {
    assert.equal(
      formatProjectStatus({ readiness: 'degraded', projectName: 'app', totalFiles: 10, indexedFiles: 8, skippedFiles: 1, failedFiles: 1 }),
      'app — degradado (8/10)'
    );
  });

  test('error', () => {
    assert.match(
      formatProjectStatus({ readiness: 'error', projectName: 'app', totalFiles: 0, indexedFiles: 0 }),
      /error/
    );
  });
});
