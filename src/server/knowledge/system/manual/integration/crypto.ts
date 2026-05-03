import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_CRYPTO_CATEGORIES = [
  'Crypto / compression',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_CRYPTO_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'CoderObject', category: 'Crypto / compression', summary: 'Objeto no visual para codificación y transformaciones.' }),
  systemObjectDatatype({ name: 'CrypterObject', category: 'Crypto / compression', summary: 'Objeto no visual para cifrado y descifrado.' }),
];