import * as assert from 'assert/strict';
import * as path from 'path';

import {
  createOrcaDetector,
  detectOrcaCapability,
  formatOrcaStatusInline,
} from '../../../src/client/build/orcaDetection';

suite('unit/orcaDetection (B189)', () => {
  test('prioriza la ruta configurada cuando existe', async () => {
    const snapshot = await detectOrcaCapability({
      configuredPath: 'C:/Tools/orca.exe',
      envPath: 'C:/Env/orca.exe',
      platform: 'win32',
      inspectPath: async (candidate) => candidate === path.win32.normalize('C:/Tools/orca.exe') ? 'file' : 'missing',
    });

    assert.equal(snapshot.status, 'available');
    assert.equal(snapshot.source, 'config');
    assert.deepEqual(snapshot.capabilities, [
      'legacy-script-runner',
      'staging-export',
      'staging-import-compile',
      'staging-regenerate',
      'project-rebuild',
    ]);
    assert.equal(formatOrcaStatusInline(snapshot), 'ORCA disponible · configuración');
  });

  test('cae a la variable de entorno si la configuración no existe', async () => {
    const snapshot = await detectOrcaCapability({
      configuredPath: 'C:/missing/orca.exe',
      envPath: 'C:/Env/orca.exe',
      platform: 'win32',
      inspectPath: async (candidate) => candidate === path.win32.normalize('C:/Env/orca.exe') ? 'file' : 'missing',
    });

    assert.equal(snapshot.status, 'available');
    assert.equal(snapshot.source, 'env');
    assert.match(snapshot.detail, /entorno/);
  });

  test('marca inválida una ruta que apunta a un directorio', async () => {
    const snapshot = await detectOrcaCapability({
      configuredPath: 'C:/Tools/orca',
      envPath: '',
      platform: 'win32',
      inspectPath: async (candidate) => candidate === path.win32.normalize('C:/Tools/orca') ? 'directory' : 'missing',
    });

    assert.equal(snapshot.status, 'invalid');
    assert.equal(snapshot.source, 'config');
    assert.match(snapshot.detail, /directorio/);
    assert.equal(formatOrcaStatusInline(snapshot), `ORCA inválido · ${snapshot.detail}`);
  });

  test('devuelve invalid fuera de Windows', async () => {
    const snapshot = await detectOrcaCapability({
      configuredPath: 'C:/Tools/orca.exe',
      envPath: '',
      platform: 'linux',
      inspectPath: async () => 'file',
    });

    assert.equal(snapshot.status, 'invalid');
    assert.equal(snapshot.source, 'unresolved');
    assert.match(snapshot.detail, /Windows/);
  });

  test('cachea el resultado mientras no cambie la firma de entrada', async () => {
    let calls = 0;
    const detector = createOrcaDetector({
      ttlMs: 60_000,
      now: () => 1,
      platform: 'win32',
      inspectPath: async () => {
        calls++;
        return 'missing';
      },
    });

    await detector.detect({ configuredPath: 'C:/missing/orca.exe' });
    await detector.detect({ configuredPath: 'C:/missing/orca.exe' });

    assert.equal(calls, 1);
  });
});