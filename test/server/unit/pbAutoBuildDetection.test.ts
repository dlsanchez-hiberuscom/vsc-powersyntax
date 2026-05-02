import * as assert from 'assert/strict';

import {
  createPbAutoBuildDetector,
  detectPbAutoBuildCapability,
  formatPbAutoBuildStatusInline,
} from '../../../src/client/build/pbAutoBuildDetection';

suite('unit/pbAutoBuildDetection (B181)', () => {
  test('prioriza la ruta configurada cuando existe y es el binario esperado', async () => {
    const snapshot = await detectPbAutoBuildCapability({
      configuredPath: 'C:/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      envPath: 'C:/env/pbautobuild250.exe',
      defaultCandidates: ['C:/default/pbautobuild250.exe'],
      pathExists: async (candidate) => candidate === 'C:\\Appeon\\PowerBuilder 2025\\pbautobuild250.exe',
    });

    assert.equal(snapshot.status, 'available');
    assert.equal(snapshot.source, 'config');
    assert.equal(snapshot.versionLabel, '25.0 / 2025');
    assert.deepEqual(snapshot.capabilities, ['json-build', 'pbc-compile']);
  });

  test('cae a la variable de entorno si la configuración no existe', async () => {
    const snapshot = await detectPbAutoBuildCapability({
      configuredPath: 'C:/missing/pbautobuild250.exe',
      envPath: 'C:/env/pbautobuild250.exe',
      defaultCandidates: [],
      pathExists: async (candidate) => candidate === 'C:\\env\\pbautobuild250.exe',
    });

    assert.equal(snapshot.status, 'available');
    assert.equal(snapshot.source, 'env');
    assert.match(snapshot.detail, /entorno/);
  });

  test('marca inválida una ruta existente que no apunta al binario esperado si no hay fallback válido', async () => {
    const snapshot = await detectPbAutoBuildCapability({
      configuredPath: 'C:/Tools/notepad.exe',
      envPath: '',
      defaultCandidates: [],
      pathExists: async (candidate) => candidate === 'C:\\Tools\\notepad.exe',
    });

    assert.equal(snapshot.status, 'invalid');
    assert.equal(snapshot.source, 'config');
    assert.match(snapshot.detail, /no apunta a pbautobuild250\.exe/i);
  });

  test('devuelve missing y una guía explícita cuando no encuentra candidatos', async () => {
    const snapshot = await detectPbAutoBuildCapability({
      configuredPath: '',
      envPath: '',
      defaultCandidates: [],
      pathExists: async () => false,
    });

    assert.equal(snapshot.status, 'missing');
    assert.equal(snapshot.source, 'unresolved');
    assert.match(snapshot.detail, /vscPowerSyntax\.build\.pbAutoBuildPath/);
    assert.equal(formatPbAutoBuildStatusInline(snapshot), 'PBAutoBuild no detectado');
  });

  test('cachea el resultado mientras no cambie la firma de entrada', async () => {
    let calls = 0;
    const detector = createPbAutoBuildDetector({
      ttlMs: 60_000,
      now: () => 1,
      pathExists: async () => {
        calls++;
        return false;
      },
      defaultCandidates: [],
    });

    await detector.detect({ configuredPath: 'C:/missing/pbautobuild250.exe' });
    await detector.detect({ configuredPath: 'C:/missing/pbautobuild250.exe' });

    assert.equal(calls, 1);
  });
});