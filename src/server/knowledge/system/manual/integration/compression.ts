import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_COMPRESSION_CATEGORIES = [
  'Crypto / compression',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_COMPRESSION_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'CompressorObject',
    category: 'Crypto / compression',
    summary: 'Non-visual object for data compression.',
    manualOverlay: { mode: 'override', reason: 'Hardening CompressorObject documentation.', evidence: ['manual-core:integration:compression:compressorobject'] },
  }),
  systemObjectDatatype({
    name: 'ExtractorObject',
    category: 'Crypto / compression',
    summary: 'Non-visual object for compressed content extraction.',
    manualOverlay: { mode: 'override', reason: 'Hardening ExtractorObject documentation.', evidence: ['manual-core:integration:compression:extractorobject'] },
  }),
];