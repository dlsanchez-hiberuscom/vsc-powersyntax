import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_DATA_CONTROL_CATEGORIES = [
  'Controles de datos/UI',
] as const;

export const PB_MANUAL_CORE_DATA_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Animation', category: 'Controles de datos/UI', summary: 'Control visual para animaciones integradas.' }),
  systemObjectDatatype({ name: 'CheckBox', category: 'Controles de datos/UI', summary: 'Control visual de casilla de verificación.' }),
  systemObjectDatatype({ name: 'CommandButton', category: 'Controles de datos/UI', summary: 'Botón de comando visual.' }),
  systemObjectDatatype({ name: 'DatePicker', category: 'Controles de datos/UI', summary: 'Selector visual de fecha.' }),
  systemObjectDatatype({ name: 'GroupBox', category: 'Controles de datos/UI', summary: 'Contenedor visual para agrupar controles.' }),
  systemObjectDatatype({ name: 'HProgressBar', category: 'Controles de datos/UI', summary: 'Barra de progreso horizontal.' }),
  systemObjectDatatype({ name: 'HScrollBar', category: 'Controles de datos/UI', summary: 'Barra de desplazamiento horizontal.' }),
  systemObjectDatatype({ name: 'HTrackBar', category: 'Controles de datos/UI', summary: 'Trackbar horizontal visual.' }),
  systemObjectDatatype({ name: 'InkPicture', category: 'Controles de datos/UI', summary: 'Control visual para imágenes de tinta.' }),
  systemObjectDatatype({ name: 'MonthCalendar', category: 'Controles de datos/UI', summary: 'Calendario mensual visual.' }),
  systemObjectDatatype({ name: 'PictureButton', category: 'Controles de datos/UI', summary: 'Botón visual con imagen.' }),
  systemObjectDatatype({ name: 'RadioButton', category: 'Controles de datos/UI', summary: 'Control visual de opción única.' }),
  systemObjectDatatype({ name: 'VProgressBar', category: 'Controles de datos/UI', summary: 'Barra de progreso vertical.' }),
  systemObjectDatatype({ name: 'VScrollBar', category: 'Controles de datos/UI', summary: 'Barra de desplazamiento vertical.' }),
  systemObjectDatatype({ name: 'VTrackBar', category: 'Controles de datos/UI', summary: 'Trackbar vertical visual.' }),
  systemObjectDatatype({ name: 'WebBrowser', category: 'Controles de datos/UI', summary: 'Control visual de navegador embebido.' }),
];