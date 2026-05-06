import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_OAUTH_CATEGORIES = [
  'JSON / HTTP / OAuth / REST',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_OAUTH_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'OAuthClient',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'OAuth client for HTTP authentication and authorization.',
    manualOverlay: { mode: 'override', reason: 'Hardening OAuthClient documentation.', evidence: ['manual-core:integration:oauth:oauthclient'] },
  }),
  systemObjectDatatype({
    name: 'OAuthRequest',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual OAuth request.',
    manualOverlay: { mode: 'override', reason: 'Hardening OAuthRequest documentation.', evidence: ['manual-core:integration:oauth:oauthrequest'] },
  }),
  systemObjectDatatype({
    name: 'TokenRequest',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual token/authentication request.',
    manualOverlay: { mode: 'override', reason: 'Hardening TokenRequest documentation.', evidence: ['manual-core:integration:oauth:tokenrequest'] },
  }),
  systemObjectDatatype({
    name: 'TokenResponse',
    category: 'JSON / HTTP / OAuth / REST',
    summary: 'Non-visual token/authentication response.',
    manualOverlay: { mode: 'override', reason: 'Hardening TokenResponse documentation.', evidence: ['manual-core:integration:oauth:tokenresponse'] },
  }),
];