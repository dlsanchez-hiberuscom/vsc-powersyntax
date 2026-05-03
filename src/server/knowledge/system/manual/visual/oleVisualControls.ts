import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_OLE_VISUAL_CONTROL_CATEGORIES = [
  'OLE visual',
] as const;

export const PB_MANUAL_CORE_OLE_VISUAL_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'OLEControl', category: 'OLE visual', summary: 'Control OLE visual insertable.' }),
  systemObjectDatatype({ name: 'OLECustomControl', category: 'OLE visual', summary: 'Control OLE ActiveX personalizado.' }),
  systemObjectDatatype({ name: 'WindowActiveX', category: 'OLE visual', summary: 'Control visual ActiveX que hospeda una ventana PowerBuilder embebida.' }),
];