import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_ERROR_CATEGORIES = [
  'Errores',
] as const;

export const PB_MANUAL_CORE_RUNTIME_ERRORS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Exception', category: 'Errores', summary: 'Excepción runtime interoperable con try/catch.' }),
  systemObjectDatatype({ name: 'Throwable', category: 'Errores', summary: 'Base de excepciones (try/catch/throw).' }),
  systemObjectDatatype({ name: 'Error', category: 'Errores', summary: 'Objeto global de error del sistema.' }),
  systemObjectDatatype({ name: 'RuntimeError', category: 'Errores', summary: 'Error en tiempo de ejecución.' }),
];