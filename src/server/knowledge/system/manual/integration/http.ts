import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_HTTP_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_HTTP_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'HTTPClient', category: 'JSON / HTTP / OAuth / REST', summary: 'Cliente HTTP para requests REST y servicios web.' }),
  systemObjectDatatype({ name: 'Inet', category: 'JSON / HTTP / OAuth / REST', summary: 'Objeto no visual para operaciones de Internet.' }),
  systemObjectDatatype({ name: 'InternetResult', category: 'JSON / HTTP / OAuth / REST', summary: 'Resultado no visual de operaciones HTTP/Internet.' }),
  systemObjectDatatype({ name: 'ResourceResponse', category: 'JSON / HTTP / OAuth / REST', summary: 'Respuesta no visual devuelta por operaciones REST o de recursos HTTP.' }),
  systemObjectDatatype({ name: 'Service', category: 'JSON / HTTP / OAuth / REST', summary: 'Servicio no visual reusable en el runtime.' }),
  systemObjectDatatype({ name: 'SSLCallback', category: 'JSON / HTTP / OAuth / REST', summary: 'Callback SSL no visual.' }),
  systemObjectDatatype({ name: 'SSLServiceProvider', category: 'JSON / HTTP / OAuth / REST', summary: 'Proveedor SSL no visual.' }),
];