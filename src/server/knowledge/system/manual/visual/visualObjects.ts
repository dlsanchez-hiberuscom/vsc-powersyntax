import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_VISUAL_OBJECT_CATEGORIES = [
  'Visual objects',
] as const;

export const PB_MANUAL_CORE_VISUAL_OBJECTS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Window', category: 'Visual objects', summary: 'User interface window.' }),
  systemObjectDatatype({ name: 'MDIFrame', category: 'Visual objects', summary: 'MDI frame window that hosts sheets, toolbars and menus.' }),
  systemObjectDatatype({ name: 'MDIClient', category: 'Visual objects', summary: 'MDI client area that contains child sheets within the frame.' }),
  systemObjectDatatype({ name: 'DataWindow', category: 'Visual objects', summary: 'Visual DataWindow control.', lookupAliases: ['dw'] }),
  systemObjectDatatype({ name: 'Menu', category: 'Visual objects', summary: 'User interface menu.' }),
  systemObjectDatatype({ name: 'MenuCascade', category: 'Visual objects', summary: 'Cascading menu item that exposes a submenu.' }),
  systemObjectDatatype({ name: 'UserObject', category: 'Visual objects', summary: 'Base for visual user objects.' }),
  systemObjectDatatype({ name: 'PowerServerLabel', category: 'Visual objects', summary: 'Specialized visual label for PowerServer.' }),
];