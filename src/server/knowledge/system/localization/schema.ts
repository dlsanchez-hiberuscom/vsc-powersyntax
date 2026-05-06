export const PB_SYSTEM_SYMBOL_LOCALIZATION_SCHEMA_VERSION = '1.0.0' as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_REQUIRED_METADATA_FIELDS = [
  'source',
  'reviewed',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_TARGET_ANCHORS = [
  'targetId',
  'targetKey',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_TEXT_FIELDS = [
  'summary',
  'documentation',
  'usageNotes',
  'limitations',
  'obsoleteMessage',
  'returnDocumentation',
  'category',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_PARAMETER_FIELDS = [
  'parameterDocumentation',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_EVENT_FIELDS = [
  'eventReturnCodes',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_RESERVED_SCHEMA_FIELDS = [
  'examples',
  'tags',
  'qualityFlags',
  'provenanceMetadata',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_QUALITY_SIGNALS = [
  'reviewed',
  'schemaIssues',
  'incompleteOverlays',
  'invalidParameterTargets',
  'recoveredTargetIds',
  'orphanOverlays',
] as const;

export const PB_SYSTEM_SYMBOL_LOCALIZATION_PROVENANCE_SIGNALS = [
  'source',
  'targetId',
  'targetKey',
] as const;