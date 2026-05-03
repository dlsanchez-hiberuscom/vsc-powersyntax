import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_OAUTH_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_OAUTH_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'OAuthClient', category: 'JSON / HTTP / OAuth / REST', summary: 'Cliente OAuth para autenticación y autorización HTTP.' }),
  systemObjectDatatype({ name: 'OAuthRequest', category: 'JSON / HTTP / OAuth / REST', summary: 'Request OAuth no visual.' }),
  systemObjectDatatype({ name: 'TokenRequest', category: 'JSON / HTTP / OAuth / REST', summary: 'Request no visual de token/autenticación.' }),
  systemObjectDatatype({ name: 'TokenResponse', category: 'JSON / HTTP / OAuth / REST', summary: 'Response no visual de token/autenticación.' }),
];