import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_CRYPTO_CATEGORIES = [
  'Crypto / compression',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_CRYPTO_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'CoderObject',
    category: 'Crypto / compression',
    summary: 'Non-visual object for encoding and transformations.',
    manualOverlay: { mode: 'override', reason: 'Hardening CoderObject documentation.', evidence: ['manual-core:integration:crypto:coderobject'] },
  }),
  systemObjectDatatype({
    name: 'CrypterObject',
    category: 'Crypto / compression',
    summary: 'Non-visual object for encryption and decryption.',
    manualOverlay: { mode: 'override', reason: 'Hardening CrypterObject documentation.', evidence: ['manual-core:integration:crypto:crypterobject'] },
  }),
];