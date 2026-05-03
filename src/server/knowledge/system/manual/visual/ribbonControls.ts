import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RIBBON_CONTROL_CATEGORIES = [
  'Controles Ribbon',
] as const;

export const PB_MANUAL_CORE_RIBBON_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'RibbonBar', category: 'Controles Ribbon', summary: 'Barra visual tipo ribbon.' }),
  systemObjectDatatype({ name: 'RibbonItem', category: 'Controles Ribbon', summary: 'Base de elementos interactivos usados por RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonApplicationButtonItem', category: 'Controles Ribbon', summary: 'Botón principal de la aplicación en un RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonApplicationMenu', category: 'Controles Ribbon', summary: 'Menú principal de aplicación asociado a un RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonCategoryItem', category: 'Controles Ribbon', summary: 'Categoría de primer nivel dentro de un RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonCheckBoxItem', category: 'Controles Ribbon', summary: 'Ítem check box usado dentro de paneles o grupos del Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonComboBoxItem', category: 'Controles Ribbon', summary: 'Ítem combo box usado dentro de paneles o grupos del Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonGroupItem', category: 'Controles Ribbon', summary: 'Grupo lógico de controles dentro de un panel del Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonLargeButtonItem', category: 'Controles Ribbon', summary: 'Botón grande usado dentro de un RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonMenu', category: 'Controles Ribbon', summary: 'Menú contextual o asociado a botones del Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonMenuItem', category: 'Controles Ribbon', summary: 'Ítem de menú usado en menús Ribbon y application menus.' }),
  systemObjectDatatype({ name: 'RibbonPanelItem', category: 'Controles Ribbon', summary: 'Panel que agrupa grupos y botones dentro de una categoría Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonSmallButtonItem', category: 'Controles Ribbon', summary: 'Botón pequeño usado dentro de un RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonTabButtonItem', category: 'Controles Ribbon', summary: 'Botón de pestaña integrado en un RibbonBar.' }),
];