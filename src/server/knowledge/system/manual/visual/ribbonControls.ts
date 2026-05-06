import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RIBBON_CONTROL_CATEGORIES = [
  'Ribbon controls',
] as const;

export const PB_MANUAL_CORE_RIBBON_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'RibbonBar', category: 'Ribbon controls', summary: 'Visual ribbon bar.' }),
  systemObjectDatatype({ name: 'RibbonItem', category: 'Ribbon controls', summary: 'Base for interactive elements used by RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonApplicationButtonItem', category: 'Ribbon controls', summary: 'Application button in a RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonApplicationMenu', category: 'Ribbon controls', summary: 'Application menu associated with a RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonCategoryItem', category: 'Ribbon controls', summary: 'Top-level category within a RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonCheckBoxItem', category: 'Ribbon controls', summary: 'Check box item used within Ribbon panels or groups.' }),
  systemObjectDatatype({ name: 'RibbonComboBoxItem', category: 'Ribbon controls', summary: 'Combo box item used within Ribbon panels or groups.' }),
  systemObjectDatatype({ name: 'RibbonGroupItem', category: 'Ribbon controls', summary: 'Logical group of controls within a Ribbon panel.' }),
  systemObjectDatatype({ name: 'RibbonLargeButtonItem', category: 'Ribbon controls', summary: 'Large button used within a RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonMenu', category: 'Ribbon controls', summary: 'Context menu or button-associated menu in the Ribbon.' }),
  systemObjectDatatype({ name: 'RibbonMenuItem', category: 'Ribbon controls', summary: 'Menu item used in Ribbon menus and application menus.' }),
  systemObjectDatatype({ name: 'RibbonPanelItem', category: 'Ribbon controls', summary: 'Panel that groups items within a Ribbon category.' }),
  systemObjectDatatype({ name: 'RibbonSmallButtonItem', category: 'Ribbon controls', summary: 'Small button used within a RibbonBar.' }),
  systemObjectDatatype({ name: 'RibbonTabButtonItem', category: 'Ribbon controls', summary: 'Tab button integrated into a RibbonBar.' }),
];