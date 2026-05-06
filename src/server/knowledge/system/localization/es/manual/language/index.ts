import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
import { datatypesLocalization } from './datatypesLocalization';
import { operatorsLocalization } from './operatorsLocalization';
import { pronounsLocalization } from './pronounsLocalization';
import { statementsLocalization } from './statementsLocalization';
import { reservedWordsLocalization } from './reservedWordsLocalization';
import { languageKeywordsLocalization } from './languageKeywordsLocalization';
import { enumerationsLocalization } from './enumerationsLocalization';

/**
 * Spanish localization for manual language symbols.
 */
export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_MANUAL_LANGUAGE: PbSystemSymbolLocalizationOverlay[] = [
    ...datatypesLocalization,
    ...operatorsLocalization,
    ...pronounsLocalization,
    ...statementsLocalization,
    ...reservedWordsLocalization,
    ...languageKeywordsLocalization,
    ...enumerationsLocalization,
];
