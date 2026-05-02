import * as assert from 'assert/strict';

import { buildPbAutoBuildHealthSnapshot } from '../../../src/client/build/pbAutoBuildHealth';

suite('unit/pbAutoBuildHealth (B187)', () => {
  test('queda listo cuando hay ejecutable y build file utilizable', () => {
    const snapshot = buildPbAutoBuildHealthSnapshot({
      buildTooling: {
        status: 'available',
        source: 'config',
        executablePath: 'C:/Appeon/pbautobuild250.exe',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible.'
      },
      buildFiles: {
        total: 2,
        usable: 1,
        invalid: 1,
        ambiguous: 0
      }
    });

    assert.equal(snapshot.state, 'ready');
    assert.equal(snapshot.status, 'healthy');
    assert.equal(snapshot.canRun, true);
    assert.equal(snapshot.summary, 'listo para ejecutar build moderno');
  });

  test('bloquea el build si falta el ejecutable o no hay build files utilizables', () => {
    const snapshot = buildPbAutoBuildHealthSnapshot({
      buildTooling: {
        status: 'missing',
        source: 'default',
        capabilities: [],
        detail: 'No se encontró PBAutoBuild.'
      },
      buildFiles: {
        total: 1,
        usable: 0,
        invalid: 0,
        ambiguous: 1
      }
    });

    assert.equal(snapshot.state, 'blocked');
    assert.equal(snapshot.status, 'error');
    assert.equal(snapshot.canRun, false);
    assert.match(snapshot.summary, /No se encontró PBAutoBuild/);
    assert.equal(snapshot.findings.length, 2);
  });

  test('requiere atención cuando el último build falla y deja problemas recientes', () => {
    const snapshot = buildPbAutoBuildHealthSnapshot({
      buildTooling: {
        status: 'available',
        source: 'config',
        executablePath: 'C:/Appeon/pbautobuild250.exe',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible.'
      },
      buildFiles: {
        total: 1,
        usable: 1,
        invalid: 0,
        ambiguous: 0
      },
      buildRunner: {
        state: 'failed',
        detail: 'Build finalizado con errores.'
      },
      buildProblems: {
        total: 3,
        published: 2,
        unresolved: 1
      }
    });

    assert.equal(snapshot.state, 'attention');
    assert.equal(snapshot.status, 'error');
    assert.equal(snapshot.canRun, true);
    assert.match(snapshot.summary, /Build finalizado con errores/);
    assert.equal(snapshot.findings[0]?.layer, 'runner');
    assert.equal(snapshot.findings[1]?.layer, 'problems');
  });
});