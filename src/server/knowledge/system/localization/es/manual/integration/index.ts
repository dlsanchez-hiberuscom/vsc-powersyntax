import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
import { httpLocalization } from './httpLocalization';
import { jsonLocalization } from './jsonLocalization';
import { restLocalization } from './restLocalization';
import { oauthLocalization } from './oauthLocalization';
import { pdfLocalization } from './pdfLocalization';
import { compressionLocalization } from './compressionLocalization';
import { cryptoLocalization } from './cryptoLocalization';
import { dotnetLocalization } from './dotnetLocalization';

/**
 * Spanish localization for manual integration symbols.
 */
export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_MANUAL_INTEGRATION: PbSystemSymbolLocalizationOverlay[] = [
    ...httpLocalization,
    ...jsonLocalization,
    ...restLocalization,
    ...oauthLocalization,
    ...pdfLocalization,
    ...compressionLocalization,
    ...cryptoLocalization,
    ...dotnetLocalization,
];
