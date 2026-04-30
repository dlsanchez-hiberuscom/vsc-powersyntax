import { buildSystemSymbolIndexes } from '../indexes/buildIndexes';
import {
    PbSystemSymbolDatasetSlice,
    PbSystemSymbolRegistry,
} from '../types';
import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from './datasets';

export function createSystemSymbolRegistry(
    slices: readonly PbSystemSymbolDatasetSlice[],
): PbSystemSymbolRegistry {
    const entries = slices.flatMap(slice => slice.entries);

    return {
        slices,
        entries,
        indexes: buildSystemSymbolIndexes(entries),
    };
}

export const PB_SYSTEM_SYMBOL_REGISTRY = createSystemSymbolRegistry(
    PB_SYSTEM_SYMBOL_DATASET_SLICES,
);