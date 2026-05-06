import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_DRAWING_CONTROL_CATEGORIES = [
  'Drawing controls',
] as const;

export const PB_MANUAL_CORE_DRAWING_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Graph', category: 'Drawing controls', summary: 'Visual control for graphs and charts.' }),
  systemObjectDatatype({ name: 'grAxis', category: 'Drawing controls', summary: 'Axis configuration for a Graph control.' }),
  systemObjectDatatype({ name: 'grDispAttr', category: 'Drawing controls', summary: 'Display attributes for Graph elements.' }),
  systemObjectDatatype({ name: 'Line', category: 'Drawing controls', summary: 'Visual line object.' }),
  systemObjectDatatype({ name: 'Oval', category: 'Drawing controls', summary: 'Visual oval object.' }),
  systemObjectDatatype({ name: 'Picture', category: 'Drawing controls', summary: 'Visual image control.' }),
  systemObjectDatatype({ name: 'PictureHyperLink', category: 'Drawing controls', summary: 'Visual image-based hyperlink.' }),
  systemObjectDatatype({ name: 'Rectangle', category: 'Drawing controls', summary: 'Visual rectangle object.' }),
  systemObjectDatatype({ name: 'RoundRectangle', category: 'Drawing controls', summary: 'Visual rounded rectangle object.' }),
];