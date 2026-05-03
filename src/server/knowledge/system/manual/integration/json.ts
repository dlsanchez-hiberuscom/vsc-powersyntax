import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_JSON_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_JSON_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'JSONParser', category: 'JSON / HTTP / OAuth / REST', summary: 'Parser JSON no visual para leer y navegar payloads JSON.' }),
  systemObjectDatatype({ name: 'JSONGenerator', category: 'JSON / HTTP / OAuth / REST', summary: 'Generador JSON no visual para construir payloads serializados.' }),
  systemObjectDatatype({ name: 'JSONPackage', category: 'JSON / HTTP / OAuth / REST', summary: 'Contenedor JSON no visual para empaquetar estructuras JSON.' }),
];