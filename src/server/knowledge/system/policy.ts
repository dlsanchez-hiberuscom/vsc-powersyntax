import type {
  PbSystemManualOverlayMode,
  PbSystemSymbolLocalizationOverlaySource,
  PbSystemSymbolProvenanceAuthority,
} from './types';

export const PB_SYSTEM_CATALOG_CONFLICT_POLICY = 'generated-primary-with-manual-overlays' as const;

export const PB_SYSTEM_CATALOG_ENRICHMENT_LAYER_ORDER = [
  'generated-base',
  'manual-curated-enrichment',
  'localization-overlay',
  'presentation-formatter',
] as const;

export const PB_SYSTEM_CATALOG_ENRICHABLE_FIELDS = [
  'summary',
  'documentation',
  'usageNotes',
  'obsoleteMessage',
  'returnDocumentation',
  'parameterDocumentation',
  'category',
] as const;

export const PB_SYSTEM_CATALOG_IDENTITY_LOCKED_FIELDS = [
  'id',
  'name',
  'lookupKeys',
  'normalizedName',
  'domain',
  'kind',
  'namespace',
  'ownerTypes',
  'invocation',
  'signatures.label',
  'parameterName',
  'datatypes',
  'enum values',
  'sourceUrl',
] as const;

export const PB_SYSTEM_CATALOG_PRESENTATION_EXPOSURE = {
  hover: [
    'summary',
    'documentation',
    'usageNotes',
    'obsoleteMessage',
    'returnDocumentation',
    'parameterDocumentation',
  ],
  completionInitial: ['summary'],
  completionResolve: [
    'summary',
    'documentation',
    'usageNotes',
    'obsoleteMessage',
    'returnDocumentation',
    'parameterDocumentation',
  ],
  signatureHelp: ['summary', 'returnDocumentation', 'parameterDocumentation'],
} as const;

export const PB_SYSTEM_CATALOG_PROVENANCE_CHAIN = {
  generatedBase: {
    authority: 'official' as PbSystemSymbolProvenanceAuthority,
    dataset: 'generated',
  },
  manualCuratedEnrichment: {
    authority: 'curated' as PbSystemSymbolProvenanceAuthority,
    dataset: 'manual-core',
    manualOverlayModes: ['enrichment', 'override'] as readonly PbSystemManualOverlayMode[],
  },
  localizationOverlay: {
    sources: [
      'manual-curated',
      'machine-assisted-reviewed',
      'generated-assisted',
    ] as readonly PbSystemSymbolLocalizationOverlaySource[],
  },
  presentationFormatter: {
    derived: true,
  },
} as const;