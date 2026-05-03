import assert from 'node:assert/strict';

import {
  findCoreMaintenanceCommandModel,
  getCoreMaintenanceCommandModels,
} from '../../../src/client/coreMaintenanceCommandCatalog';

suite('unit/coreMaintenanceCommandCatalog (B278)', () => {
  test('cubre exactamente los diez comandos del backlog con ids únicos', () => {
    const models = getCoreMaintenanceCommandModels();

    assert.equal(models.length, 10);
    assert.deepEqual(
      models.map((model) => model.backlogLabel),
      [
        'clear semantic cache',
        'export health report',
        'export support bundle',
        'run runtime self-test',
        'show memory budgets',
        'show indexing state',
        'show project routing',
        'show sourceOrigin conflicts',
        'rebuild workspace index',
        'validate persistent cache',
      ]
    );
    assert.equal(new Set(models.map((model) => model.command)).size, models.length);
  });

  test('marca como confirmables solo los comandos write-enabled del pack', () => {
    const models = getCoreMaintenanceCommandModels();
    const confirmable = models.filter((model) => model.kind === 'confirmable').map((model) => model.command);
    const readOnly = models.filter((model) => model.kind === 'read-only').map((model) => model.command);

    assert.deepEqual(confirmable, [
      'vscPowerSyntax.clearSemanticCache',
      'vscPowerSyntax.rebuildWorkspaceIndex',
    ]);
    assert.ok(readOnly.includes('vscPowerSyntax.exportSupportBundle'));
    assert.ok(readOnly.includes('vscPowerSyntax.exportHealthReport'));
    assert.ok(readOnly.includes('vscPowerSyntax.runRuntimeSelfTest'));
    assert.ok(readOnly.includes('vscPowerSyntax.validatePersistentCache'));
  });

  test('permite localizar cada command model por id estable', () => {
    const clear = findCoreMaintenanceCommandModel('vscPowerSyntax.clearSemanticCache');
    const routing = findCoreMaintenanceCommandModel('vscPowerSyntax.showProjectRouting');
    const selfTest = findCoreMaintenanceCommandModel('vscPowerSyntax.runRuntimeSelfTest');

    assert.equal(clear?.backlogLabel, 'clear semantic cache');
    assert.equal(clear?.kind, 'confirmable');
    assert.equal(routing?.backlogLabel, 'show project routing');
    assert.equal(routing?.kind, 'read-only');
    assert.equal(selfTest?.backlogLabel, 'run runtime self-test');
    assert.equal(selfTest?.kind, 'read-only');
  });
});