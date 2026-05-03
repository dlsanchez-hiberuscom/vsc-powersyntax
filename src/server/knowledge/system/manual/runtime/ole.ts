import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_OLE_CATEGORIES = [
  'OLE',
] as const;

export const PB_MANUAL_CORE_RUNTIME_OLE_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'OLEObject', category: 'OLE', summary: 'Objeto OLE Automation genérico.' }),
  systemObjectDatatype({ name: 'OLEStorage', category: 'OLE', summary: 'Almacenamiento OLE Structured Storage.' }),
  systemObjectDatatype({ name: 'OLEStream', category: 'OLE', summary: 'Flujo dentro de un OLE Storage.' }),
  systemObjectDatatype({ name: 'OLETxnObject', category: 'OLE', summary: 'Objeto transaccional OLE no visual.' }),
];