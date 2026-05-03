import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_CATEGORIES = [
  'Filesystem',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'FileSystem', category: 'Filesystem', summary: 'Subsistema de acceso al sistema de archivos desde el runtime.' }),
];