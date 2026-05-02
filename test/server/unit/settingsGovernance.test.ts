import * as assert from 'assert/strict';

import {
  buildSettingsGovernanceReport,
  getGovernedSettingKeys,
  getSettingsProfileDescriptors,
} from '../../../src/client/settingsGovernance';

suite('unit/settingsGovernance (B244)', () => {
  test('publica perfiles estables y claves gobernadas sin duplicados', () => {
    const profiles = getSettingsProfileDescriptors();
    const keys = getGovernedSettingKeys();

    assert.deepEqual(profiles.map((profile) => profile.id), ['balanced', 'interactive', 'legacy-safe']);
    assert.ok(keys.includes('vscPowerSyntax.progress.show'));
    assert.ok(keys.includes('vscPowerSyntax.formatting.formatOnSave'));
    assert.equal(new Set(keys).size, keys.length);
  });

  test('detecta divergencias respecto al perfil y conflictos estructurales', () => {
    const report = buildSettingsGovernanceReport({
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': false,
      'vscPowerSyntax.formatting.formatOnSave': true,
      'vscPowerSyntax.formatting.maxDocumentChars': 120000,
      'vscPowerSyntax.formatting.maxDocumentLines': 4000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
    }, 'legacy-safe');

    assert.equal(report.selectedProfile, 'legacy-safe');
    assert.ok(report.managedSettings.some((entry) => entry.key === 'vscPowerSyntax.formatting.trimTrailingWhitespace' && entry.matchesProfile === false));
    assert.ok(report.conflicts.some((conflict) => conflict.key === 'vscPowerSyntax.formatting.formatOnSave'));
  });
});