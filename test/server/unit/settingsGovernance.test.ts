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

    assert.deepEqual(profiles.map((profile) => profile.id), ['fast', 'balanced', 'deep-analysis', 'legacy-orca', 'ci-support', 'support-safe']);
    assert.ok(keys.includes('vscPowerSyntax.progress.show'));
    assert.ok(keys.includes('vscPowerSyntax.formatting.formatOnSave'));
    assert.ok(keys.includes('vscPowerSyntax.formatting.spaceAfterComma'));
    assert.ok(keys.includes('vscPowerSyntax.formatting.normalizeBlankLines'));
    assert.equal(new Set(keys).size, keys.length);
  });

  test('detecta divergencias respecto al perfil y conflictos estructurales', () => {
    const report = buildSettingsGovernanceReport({
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': false,
      'vscPowerSyntax.formatting.formatOnSave': true,
      'vscPowerSyntax.formatting.maxDocumentChars': 160000,
      'vscPowerSyntax.formatting.maxDocumentLines': 8000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    }, 'support-safe');

    assert.equal(report.selectedProfile, 'support-safe');
    assert.ok(report.managedSettings.some((entry) => entry.key === 'vscPowerSyntax.formatting.trimTrailingWhitespace' && entry.matchesProfile === false));
    assert.ok(report.conflicts.some((conflict) => conflict.key === 'vscPowerSyntax.formatting.formatOnSave'));
  });

  test('normaliza perfiles legacy conocidos a los nuevos ids corporativos', () => {
    const report = buildSettingsGovernanceReport({
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 60000,
      'vscPowerSyntax.formatting.maxDocumentLines': 2000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    }, 'interactive');

    assert.equal(report.selectedProfile, 'fast');
    assert.ok(report.conflicts.some((conflict) => conflict.severity === 'info' && conflict.key === 'vscPowerSyntax.profile'));
  });
});