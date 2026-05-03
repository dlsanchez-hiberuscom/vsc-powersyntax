import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_REST_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_REST_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'RESTClient', category: 'JSON / HTTP / OAuth / REST', summary: 'Cliente REST no visual.' }),
  systemObjectDatatype({ name: 'WSConnection', category: 'JSON / HTTP / OAuth / REST', summary: 'Conexión no visual a servicios web.' }),
];