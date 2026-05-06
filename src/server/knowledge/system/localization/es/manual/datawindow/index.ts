import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
import { dataWindowFunctionsLocalization } from './dataWindowFunctionsLocalization';
import { dataWindowEventsLocalization } from './dataWindowEventsLocalization';
import { dataWindowExpressionFunctionsLocalization } from './dataWindowExpressionFunctionsLocalization';
import { dataWindowPropertiesLocalization } from './dataWindowPropertiesLocalization';

/**
 * Spanish localization for DataWindow manual symbols.
 */
export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_MANUAL_DATAWINDOW: PbSystemSymbolLocalizationOverlay[] = [
    ...dataWindowFunctionsLocalization,
    ...dataWindowEventsLocalization as any as PbSystemSymbolLocalizationOverlay[],
    ...dataWindowExpressionFunctionsLocalization,
    ...dataWindowPropertiesLocalization,
];
