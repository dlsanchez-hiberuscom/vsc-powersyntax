import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_OLE_CATEGORIES = [
  'OLE',
] as const;

export const PB_MANUAL_CORE_RUNTIME_OLE_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'OLEObject', category: 'OLE', summary: 'Generic OLE Automation object.' }),
  systemObjectDatatype({ name: 'OLEStorage', category: 'OLE', summary: 'OLE Structured Storage.' }),
  systemObjectDatatype({ name: 'OLEStream', category: 'OLE', summary: 'Stream within an OLE Storage.' }),
  systemObjectDatatype({ name: 'OLETxnObject', category: 'OLE', summary: 'Non-visual OLE transactional object.' }),
];