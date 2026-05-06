import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_HTTP_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_HTTP_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'HTTPClient',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'HTTP client for REST requests and web services.',
    manualOverlay: { mode: 'override', reason: 'Hardening HTTPClient documentation.', evidence: ['manual-core:integration:http:httpclient'] },
  }),
  systemObjectDatatype({
    name: 'Inet',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual object for Internet operations.',
    manualOverlay: { mode: 'override', reason: 'Hardening Inet documentation.', evidence: ['manual-core:integration:http:inet'] },
  }),
  systemObjectDatatype({
    name: 'InternetResult',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual result of HTTP/Internet operations.',
    manualOverlay: { mode: 'override', reason: 'Hardening InternetResult documentation.', evidence: ['manual-core:integration:http:internetresult'] },
  }),
  systemObjectDatatype({
    name: 'ResourceResponse',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual response returned by REST or HTTP resource operations.',
    manualOverlay: { mode: 'override', reason: 'Hardening ResourceResponse documentation.', evidence: ['manual-core:integration:http:resourceresponse'] },
  }),
  systemObjectDatatype({
    name: 'Service',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Reusable non-visual service in the runtime.',
    manualOverlay: { mode: 'override', reason: 'Hardening Service documentation.', evidence: ['manual-core:integration:http:service'] },
  }),
  systemObjectDatatype({
    name: 'SSLCallback',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual SSL callback.',
    manualOverlay: { mode: 'override', reason: 'Hardening SSLCallback documentation.', evidence: ['manual-core:integration:http:sslcallback'] },
  }),
  systemObjectDatatype({
    name: 'SSLServiceProvider',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual SSL provider.',
    manualOverlay: { mode: 'override', reason: 'Hardening SSLServiceProvider documentation.', evidence: ['manual-core:integration:http:sslserviceprovider'] },
  }),
];