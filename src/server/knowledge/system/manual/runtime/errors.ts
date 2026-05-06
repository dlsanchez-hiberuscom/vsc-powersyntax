import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_ERROR_CATEGORIES = [
  'Errors',
] as const;

export const PB_MANUAL_CORE_RUNTIME_ERRORS: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'Exception', category: 'Errors', summary: 'Runtime exception interoperable with try/catch.' }),
  systemObjectDatatype({ name: 'Throwable', category: 'Errors', summary: 'Base for exceptions (try/catch/throw).' }),
  systemObjectDatatype({ name: 'Error', category: 'Errors', summary: 'Global system error object.' }),
  systemObjectDatatype({ name: 'RuntimeError', category: 'Errors', summary: 'Runtime error.' }),
];