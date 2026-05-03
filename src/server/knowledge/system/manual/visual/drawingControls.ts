import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_DRAWING_CONTROL_CATEGORIES = [
  'Controles de dibujo',
] as const;

export const PB_MANUAL_CORE_DRAWING_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Graph', category: 'Controles de dibujo', summary: 'Control visual para gráficos y charts.' }),
  systemObjectDatatype({ name: 'grAxis', category: 'Controles de dibujo', summary: 'Configuración de ejes para un control Graph.' }),
  systemObjectDatatype({ name: 'grDispAttr', category: 'Controles de dibujo', summary: 'Atributos de visualización para elementos de un Graph.' }),
  systemObjectDatatype({ name: 'Line', category: 'Controles de dibujo', summary: 'Objeto visual de línea.' }),
  systemObjectDatatype({ name: 'Oval', category: 'Controles de dibujo', summary: 'Objeto visual ovalado.' }),
  systemObjectDatatype({ name: 'Picture', category: 'Controles de dibujo', summary: 'Control visual de imagen.' }),
  systemObjectDatatype({ name: 'PictureHyperLink', category: 'Controles de dibujo', summary: 'Hipervínculo visual basado en imagen.' }),
  systemObjectDatatype({ name: 'Rectangle', category: 'Controles de dibujo', summary: 'Objeto visual rectangular.' }),
  systemObjectDatatype({ name: 'RoundRectangle', category: 'Controles de dibujo', summary: 'Objeto visual rectangular con esquinas redondeadas.' }),
];