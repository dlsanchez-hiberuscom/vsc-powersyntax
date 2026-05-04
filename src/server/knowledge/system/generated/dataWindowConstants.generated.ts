import { PbSystemSymbolEntry } from '../types';
import { generatedDataWindowConstant } from './common';
import { PB_GENERATED_ENUMERATED_TYPES } from './enumeratedTypes.generated';
import { PB_GENERATED_ENUMERATED_VALUES } from './enumeratedValues.generated';

function isOfficialDataWindowReferenceEntry(entry: PbSystemSymbolEntry): boolean {
    return entry.sourceUrl?.includes('/datawindow_reference/') ?? false;
}

function toDataWindowConstant(entry: PbSystemSymbolEntry): PbSystemSymbolEntry {
    return generatedDataWindowConstant({
        name: entry.name,
        category: entry.category,
        summary: entry.summary,
        documentation: entry.documentation,
        baseType: entry.baseType,
        properties: entry.properties,
        functions: entry.functions,
        events: entry.events,
        lookupAliases: entry.lookupAliases,
        signatures: entry.signatures,
        sourceUrl: entry.sourceUrl,
        obsolete: entry.obsolete,
        obsoleteMessage: entry.obsoleteMessage,
        replacement: entry.replacement,
        risk: entry.risk,
        enumValues: entry.enumValues,
        enumValueOf: entry.enumValueOf,
        enumNumericValue: entry.enumNumericValue,
        enumValueMeaning: entry.enumValueMeaning,
        allowedOnOwners: entry.allowedOnOwners,
        allowedOnProperties: entry.allowedOnProperties,
        allowedInParameters: entry.allowedInParameters,
    });
}

export const PB_GENERATED_DATAWINDOW_CONSTANTS: readonly PbSystemSymbolEntry[] = [
    ...PB_GENERATED_ENUMERATED_TYPES
        .filter(isOfficialDataWindowReferenceEntry)
        .map(toDataWindowConstant),
    ...PB_GENERATED_ENUMERATED_VALUES
        .filter(isOfficialDataWindowReferenceEntry)
        .map(toDataWindowConstant),
];