export type PowerSyntaxProfileId = 'fast' | 'balanced' | 'deep-analysis' | 'legacy-orca' | 'ci-support' | 'support-safe';

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

const LEGACY_PROFILE_ALIASES: Readonly<Record<string, PowerSyntaxProfileId>> = {
  interactive: 'fast',
  'legacy-safe': 'support-safe',
};

const SETTINGS_PROFILE_DESCRIPTORS: readonly PowerSyntaxSettingsProfileDescriptor[] = [
  {
    id: 'fast',
    label: 'Fast',
    description: 'Prioriza feedback interactivo y budgets bajos para edición diaria sobre archivos grandes.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 60000,
      'vscPowerSyntax.formatting.maxDocumentLines': 2000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    },
  },
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
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    },
  },
  {
    id: 'deep-analysis',
    label: 'Deep Analysis',
    description: 'Amplía budgets de formateo y observabilidad para workspaces grandes y sesiones de análisis exhaustivo.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 250000,
      'vscPowerSyntax.formatting.maxDocumentLines': 10000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    },
  },
  {
    id: 'legacy-orca',
    label: 'Legacy ORCA',
    description: 'Minimiza transformaciones automáticas durante export/import ORCA y revisión de staging legacy.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 90000,
      'vscPowerSyntax.formatting.maxDocumentLines': 3000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': false,
      'vscPowerSyntax.formatting.spaceAfterComma': false,
      'vscPowerSyntax.formatting.spaceAroundOperators': false,
      'vscPowerSyntax.formatting.normalizeBlankLines': false,
    },
  },
  {
    id: 'ci-support',
    label: 'CI Support',
    description: 'Congela formateo automático y ruido visual para reproducibilidad y troubleshooting orientado a CI/soporte.',
    managedSettings: {
      'vscPowerSyntax.progress.show': false,
      'vscPowerSyntax.formatting.enabled': false,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 300000,
      'vscPowerSyntax.formatting.maxDocumentLines': 12000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': false,
      'vscPowerSyntax.formatting.spaceAfterComma': false,
      'vscPowerSyntax.formatting.spaceAroundOperators': false,
      'vscPowerSyntax.formatting.normalizeBlankLines': false,
    },
  },
  {
    id: 'support-safe',
    label: 'Support Safe',
    description: 'Mantiene observabilidad y desactiva ajustes de formateo agresivos para sesiones de soporte o auditoría.',
    managedSettings: {
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': true,
      'vscPowerSyntax.formatting.formatOnSave': false,
      'vscPowerSyntax.formatting.maxDocumentChars': 160000,
      'vscPowerSyntax.formatting.maxDocumentLines': 8000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': false,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': false,
      'vscPowerSyntax.formatting.normalizeBlankLines': false,
    },
  },
];

function resolveSettingsProfile(
  availableProfiles: PowerSyntaxSettingsProfileDescriptor[],
  selectedProfile: string | undefined,
): { profile: PowerSyntaxSettingsProfileDescriptor; aliasSource?: string; unknownProfile?: string } {
  if (selectedProfile) {
    const direct = availableProfiles.find((profile) => profile.id === selectedProfile);
    if (direct) {
      return { profile: direct };
    }

    const aliasedProfileId = LEGACY_PROFILE_ALIASES[selectedProfile];
    if (aliasedProfileId) {
      return {
        profile: availableProfiles.find((profile) => profile.id === aliasedProfileId) ?? availableProfiles[0]!,
        aliasSource: selectedProfile,
      };
    }

    return {
      profile: availableProfiles[0]!,
      unknownProfile: selectedProfile,
    };
  }

  return { profile: availableProfiles[0]! };
}

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
  const { profile: resolvedProfile, aliasSource, unknownProfile } = resolveSettingsProfile(availableProfiles, selectedProfile);
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

  if (aliasSource) {
    conflicts.unshift({
      key: 'vscPowerSyntax.profile',
      severity: 'info',
      message: `Perfil legacy '${aliasSource}' normalizado a '${resolvedProfile.id}'.`,
    });
  } else if (unknownProfile) {
    conflicts.unshift({
      key: 'vscPowerSyntax.profile',
      severity: 'warning',
      message: `Perfil desconocido '${unknownProfile}'. Se degradó al perfil ${resolvedProfile.id}.`,
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