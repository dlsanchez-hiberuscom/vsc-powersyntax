import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_COMPRESSION_CATEGORIES = [
  'Crypto / compression',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_COMPRESSION_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'CompressorObject', category: 'Crypto / compression', summary: 'Objeto no visual para compresión de datos.' }),
  systemObjectDatatype({ name: 'ExtractorObject', category: 'Crypto / compression', summary: 'Objeto no visual para extracción de contenidos comprimidos.' }),
];