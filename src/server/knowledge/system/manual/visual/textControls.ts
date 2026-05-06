import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_TEXT_CONTROL_CATEGORIES = [
  'Text controls',
] as const;

export const PB_MANUAL_CORE_TEXT_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'EditMask', category: 'Text controls', summary: 'Masked edit control.' }),
  systemObjectDatatype({ name: 'InkEdit', category: 'Text controls', summary: 'Ink and handwriting edit control.' }),
  systemObjectDatatype({ name: 'MultiLineEdit', category: 'Text controls', summary: 'Multi-line edit control.' }),
  systemObjectDatatype({ name: 'RichTextEdit', category: 'Text controls', summary: 'Visual rich text editor.' }),
  systemObjectDatatype({ name: 'SingleLineEdit', category: 'Text controls', summary: 'Single-line edit control.' }),
  systemObjectDatatype({ name: 'StaticHyperLink', category: 'Text controls', summary: 'Visual static hyperlink.' }),
  systemObjectDatatype({ name: 'StaticText', category: 'Text controls', summary: 'Visual static text.' }),
];