import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_JSON_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_JSON_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'JSONParser',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual JSON parser to read and navigate JSON payloads.',
    manualOverlay: { mode: 'override', reason: 'Hardening JSONParser documentation.', evidence: ['manual-core:integration:json:jsonparser'] },
  }),
  systemObjectDatatype({
    name: 'JSONGenerator',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual JSON generator to build serialized payloads.',
    manualOverlay: { mode: 'override', reason: 'Hardening JSONGenerator documentation.', evidence: ['manual-core:integration:json:jsongenerator'] },
  }),
  systemObjectDatatype({
    name: 'JSONPackage',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual JSON container to package JSON structures.',
    manualOverlay: { mode: 'override', reason: 'Hardening JSONPackage documentation.', evidence: ['manual-core:integration:json:jsonpackage'] },
  }),
];