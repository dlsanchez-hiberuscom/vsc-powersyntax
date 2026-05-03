import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_VISUAL_OBJECT_CATEGORIES = [
  'Objetos visuales',
] as const;

export const PB_MANUAL_CORE_VISUAL_OBJECTS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Window', category: 'Objetos visuales', summary: 'Ventana de la interfaz de usuario.' }),
  systemObjectDatatype({ name: 'MDIFrame', category: 'Objetos visuales', summary: 'Ventana marco MDI que hospeda hojas, toolbars y menús.' }),
  systemObjectDatatype({ name: 'MDIClient', category: 'Objetos visuales', summary: 'Área cliente MDI que contiene las hojas hijas dentro del marco.' }),
  systemObjectDatatype({ name: 'DataWindow', category: 'Objetos visuales', summary: 'Control DataWindow visual.', lookupAliases: ['dw'] }),
  systemObjectDatatype({ name: 'Menu', category: 'Objetos visuales', summary: 'Menú de la interfaz de usuario.' }),
  systemObjectDatatype({ name: 'MenuCascade', category: 'Objetos visuales', summary: 'Elemento de menú en cascada que expone un submenú.' }),
  systemObjectDatatype({ name: 'UserObject', category: 'Objetos visuales', summary: 'Base de user objects visuales.' }),
  systemObjectDatatype({ name: 'PowerServerLabel', category: 'Objetos visuales', summary: 'Etiqueta visual especializada para PowerServer.' }),
];