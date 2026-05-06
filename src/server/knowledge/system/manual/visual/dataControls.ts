import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_DATA_CONTROL_CATEGORIES = [
  'Data/UI controls',
] as const;

export const PB_MANUAL_CORE_DATA_CONTROLS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Animation', category: 'Data/UI controls', summary: 'Visual control for embedded animations.' }),
  systemObjectDatatype({ name: 'CheckBox', category: 'Data/UI controls', summary: 'Visual check box control.' }),
  systemObjectDatatype({ name: 'CommandButton', category: 'Data/UI controls', summary: 'Visual command button.' }),
  systemObjectDatatype({ name: 'DatePicker', category: 'Data/UI controls', summary: 'Visual date picker control.' }),
  systemObjectDatatype({ name: 'GroupBox', category: 'Data/UI controls', summary: 'Visual container for grouping controls.' }),
  systemObjectDatatype({ name: 'HProgressBar', category: 'Data/UI controls', summary: 'Horizontal progress bar.' }),
  systemObjectDatatype({ name: 'HScrollBar', category: 'Data/UI controls', summary: 'Horizontal scroll bar.' }),
  systemObjectDatatype({ name: 'HTrackBar', category: 'Data/UI controls', summary: 'Visual horizontal track bar.' }),
  systemObjectDatatype({ name: 'InkPicture', category: 'Data/UI controls', summary: 'Visual control for ink images.' }),
  systemObjectDatatype({ name: 'MonthCalendar', category: 'Data/UI controls', summary: 'Visual month calendar.' }),
  systemObjectDatatype({ name: 'PictureButton', category: 'Data/UI controls', summary: 'Visual button with image.' }),
  systemObjectDatatype({ name: 'RadioButton', category: 'Data/UI controls', summary: 'Visual single-option radio button.' }),
  systemObjectDatatype({ name: 'VProgressBar', category: 'Data/UI controls', summary: 'Vertical progress bar.' }),
  systemObjectDatatype({ name: 'VScrollBar', category: 'Data/UI controls', summary: 'Vertical scroll bar.' }),
  systemObjectDatatype({ name: 'VTrackBar', category: 'Data/UI controls', summary: 'Visual vertical track bar.' }),
  systemObjectDatatype({ name: 'WebBrowser', category: 'Data/UI controls', summary: 'Visual embedded web browser control.' }),
];