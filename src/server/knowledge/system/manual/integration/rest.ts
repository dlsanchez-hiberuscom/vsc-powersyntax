import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_REST_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_REST_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'RESTClient',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual REST client.',
    manualOverlay: { mode: 'override', reason: 'Hardening RESTClient documentation.', evidence: ['manual-core:integration:rest:restclient'] },
  }),
  systemObjectDatatype({
    name: 'WSConnection',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual connection to web services.',
    manualOverlay: { mode: 'override', reason: 'Hardening WSConnection documentation.', evidence: ['manual-core:integration:rest:wsconnection'] },
  }),
];