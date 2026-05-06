import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_CATEGORIES = [
  'Filesystem',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'FileSystem',
    category: 'Filesystem',
    summary: 'Filesystem access subsystem from the runtime.',
    manualOverlay: { mode: 'override', reason: 'Hardening FileSystem documentation.', evidence: ['manual-core:integration:filesystem:filesystem'] },
  }),
];