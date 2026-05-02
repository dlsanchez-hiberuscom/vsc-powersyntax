export type PowerSyntaxProfileId = 'balanced' | 'interactive' | 'legacy-safe';

export interface PowerSyntaxSettingsProfileDescriptor {
  id: PowerSyntaxProfileId;
  label: string;
  description: string;
  managedSettings: Record<string, boolean | number | string>;
}

export interface PowerSyntaxSettingsGovernanceEntry {
  key: string;
  expectedValue: boolean | number | string;
  currentValue: unknown;
  matchesProfile: boolean;
}

export interface PowerSyntaxSettingsGovernanceConflict {
  key: string;
  severity: 'info' | 'warning';
  message: string;
}

export interface PowerSyntaxSettingsGovernanceReport {
  selectedProfile: PowerSyntaxProfileId;
  availableProfiles: PowerSyntaxSettingsProfileDescriptor[];
  managedSettings: PowerSyntaxSettingsGovernanceEntry[];
  conflicts: PowerSyntaxSettingsGovernanceConflict[];
}

const SETTINGS_PROFILE_DESCRIPTORS: readonly PowerSyntaxSettingsProfileDescriptor[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Mantiene los defaults defendibles del producto para edición diaria y observabilidad básica.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 120000,
      'vscPowerSyntax.formatting.maxDocumentLines': 4000,
    },
  },
  {
    id: 'interactive',
    label: 'Interactive',
    description: 'Prioriza edición interactiva y budgets más bajos en formateo sobre archivos grandes.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 80000,
      'vscPowerSyntax.formatting.maxDocumentLines': 2500,
    },
  },
  {
    id: 'legacy-safe',
    label: 'Legacy Safe',
    description: 'Reduce transformaciones automáticas para corpus legacy y sesiones de revisión conservadora.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': false,
      'vscPowerSyntax.formatting.spaceAroundOperators': false,
    },
  },
];

export function getSettingsProfileDescriptors(): PowerSyntaxSettingsProfileDescriptor[] {
  return SETTINGS_PROFILE_DESCRIPTORS.map((profile) => ({
    ...profile,
    managedSettings: { ...profile.managedSettings },
  }));
}

export function getGovernedSettingKeys(): string[] {
  return [...new Set(SETTINGS_PROFILE_DESCRIPTORS.flatMap((profile) => Object.keys(profile.managedSettings)))].sort();
}

export function buildSettingsGovernanceReport(
  currentValues: Record<string, unknown>,
  selectedProfile: string | undefined,
): PowerSyntaxSettingsGovernanceReport {
  const availableProfiles = getSettingsProfileDescriptors();
  const resolvedProfile = availableProfiles.find((profile) => profile.id === selectedProfile) ?? availableProfiles[0]!;
  const managedSettings = getGovernedSettingKeys().map((key) => ({
    key,
    expectedValue: resolvedProfile.managedSettings[key] as boolean | number | string,
    currentValue: currentValues[key],
    matchesProfile: Object.is(currentValues[key], resolvedProfile.managedSettings[key]),
  }));

  const conflicts: PowerSyntaxSettingsGovernanceConflict[] = managedSettings
    .filter((entry) => !entry.matchesProfile)
    .map((entry) => ({
      key: entry.key,
      severity: 'warning',
      message: `El valor actual no coincide con el perfil ${resolvedProfile.id}.`,
    }));

  if (selectedProfile && selectedProfile !== resolvedProfile.id) {
    conflicts.unshift({
      key: 'vscPowerSyntax.profile',
      severity: 'warning',
      message: `Perfil desconocido '${selectedProfile}'. Se degradó al perfil ${resolvedProfile.id}.`,
    });
  }

  if (currentValues['vscPowerSyntax.formatting.formatOnSave'] === true
      && currentValues['vscPowerSyntax.formatting.enabled'] !== true) {
    conflicts.push({
      key: 'vscPowerSyntax.formatting.formatOnSave',
      severity: 'warning',
      message: 'formatOnSave requiere formatting.enabled=true para ser efectivo.',
    });
  }

  return {
    selectedProfile: resolvedProfile.id,
    availableProfiles,
    managedSettings,
    conflicts,
  };
}