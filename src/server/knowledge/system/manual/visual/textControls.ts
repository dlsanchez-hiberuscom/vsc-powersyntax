import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_TEXT_CONTROL_CATEGORIES = [
  'Controles de texto',
] as const;

export const PB_MANUAL_CORE_TEXT_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'EditMask', category: 'Controles de texto', summary: 'Control de edición con máscara.' }),
  systemObjectDatatype({ name: 'InkEdit', category: 'Controles de texto', summary: 'Control de tinta y escritura manuscrita.' }),
  systemObjectDatatype({ name: 'MultiLineEdit', category: 'Controles de texto', summary: 'Control de edición multilínea.' }),
  systemObjectDatatype({ name: 'RichTextEdit', category: 'Controles de texto', summary: 'Editor visual de texto enriquecido.' }),
  systemObjectDatatype({ name: 'SingleLineEdit', category: 'Controles de texto', summary: 'Control de edición de una sola línea.' }),
  systemObjectDatatype({ name: 'StaticHyperLink', category: 'Controles de texto', summary: 'Hipervínculo visual estático.' }),
  systemObjectDatatype({ name: 'StaticText', category: 'Controles de texto', summary: 'Texto visual estático.' }),
];