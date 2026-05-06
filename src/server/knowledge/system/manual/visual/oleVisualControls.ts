import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_OLE_VISUAL_CONTROL_CATEGORIES = [
  'OLE visual',
] as const;

export const PB_MANUAL_CORE_OLE_VISUAL_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'OLEControl', category: 'OLE visual', summary: 'Insertable visual OLE control.' }),
  systemObjectDatatype({ name: 'OLECustomControl', category: 'OLE visual', summary: 'Custom OLE ActiveX control.' }),
  systemObjectDatatype({ name: 'WindowActiveX', category: 'OLE visual', summary: 'ActiveX visual control that hosts an embedded PowerBuilder window.' }),
];