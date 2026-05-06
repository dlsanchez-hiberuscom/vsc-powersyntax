import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_LIST_CONTROL_CATEGORIES = [
  'List controls',
] as const;

export const PB_MANUAL_CORE_LIST_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'DropDownListBox', category: 'List controls', summary: 'Visual drop-down list box.' }),
  systemObjectDatatype({ name: 'DropDownPictureListBox', category: 'List controls', summary: 'Visual drop-down list box with images.' }),
  systemObjectDatatype({ name: 'ListBox', category: 'List controls', summary: 'Visual selection list box.' }),
  systemObjectDatatype({ name: 'ListView', category: 'List controls', summary: 'Visual detailed list control.' }),
  systemObjectDatatype({ name: 'ListViewItem', category: 'List controls', summary: 'Item within a ListView control.' }),
  systemObjectDatatype({ name: 'PictureListBox', category: 'List controls', summary: 'Visual list box with images.' }),
  systemObjectDatatype({ name: 'Tab', category: 'List controls', summary: 'Visual tabbed control.' }),
  systemObjectDatatype({ name: 'TabbedBar', category: 'List controls', summary: 'Visual tabbed bar for page navigation.' }),
  systemObjectDatatype({ name: 'TreeView', category: 'List controls', summary: 'Visual hierarchical tree control.' }),
  systemObjectDatatype({ name: 'TreeViewItem', category: 'List controls', summary: 'Item within a TreeView control.' }),
];