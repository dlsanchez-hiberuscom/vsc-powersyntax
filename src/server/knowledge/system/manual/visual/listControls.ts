import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_LIST_CONTROL_CATEGORIES = [
  'Controles de lista',
] as const;

export const PB_MANUAL_CORE_LIST_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'DropDownListBox', category: 'Controles de lista', summary: 'Lista desplegable visual.' }),
  systemObjectDatatype({ name: 'DropDownPictureListBox', category: 'Controles de lista', summary: 'Lista desplegable visual con imágenes.' }),
  systemObjectDatatype({ name: 'ListBox', category: 'Controles de lista', summary: 'Lista visual de selección.' }),
  systemObjectDatatype({ name: 'ListView', category: 'Controles de lista', summary: 'Control visual de lista detallada.' }),
  systemObjectDatatype({ name: 'ListViewItem', category: 'Controles de lista', summary: 'Ítem de un control ListView.' }),
  systemObjectDatatype({ name: 'PictureListBox', category: 'Controles de lista', summary: 'Lista visual con imágenes.' }),
  systemObjectDatatype({ name: 'Tab', category: 'Controles de lista', summary: 'Control visual con pestañas.' }),
  systemObjectDatatype({ name: 'TabbedBar', category: 'Controles de lista', summary: 'Barra de pestañas visual para navegación entre páginas.' }),
  systemObjectDatatype({ name: 'TreeView', category: 'Controles de lista', summary: 'Control visual jerárquico.' }),
  systemObjectDatatype({ name: 'TreeViewItem', category: 'Controles de lista', summary: 'Ítem de un control TreeView.' }),
];