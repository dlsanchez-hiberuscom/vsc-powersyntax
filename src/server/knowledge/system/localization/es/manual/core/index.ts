import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
import { globalFunctionsLocalization } from './globalFunctionsLocalization';
import { objectFunctionsLocalization } from './objectFunctionsLocalization';
import { systemEventsLocalization } from './systemEventsLocalization';

/**
 * Spanish localization for core manual symbols.
 */
export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_MANUAL_CORE: PbSystemSymbolLocalizationOverlay[] = [
    ...globalFunctionsLocalization,
    ...objectFunctionsLocalization,
    ...systemEventsLocalization,
];
