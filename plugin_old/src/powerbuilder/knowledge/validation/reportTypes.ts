import { PbSystemSymbolDomain } from '../types';

export interface PbSystemSymbolOfficialCoverageReport {
    measurement: 'name' | 'name-owner';
    officialCount: number;
    coveredCount: number;
    missingCount: number;
    missingUnits?: readonly string[];
}

export interface PbSystemSymbolCoverageFamilyReport {
    domain: PbSystemSymbolDomain;
    integratedCount: number;
    byDataset: Record<string, number>;
    officialCoverage?: PbSystemSymbolOfficialCoverageReport;
}

export interface PbSystemSymbolCoverageMetadataReport {
    obsoleteCount: number;
    replacementCount: number;
    aliasCount: number;
    sourceUrlCount: number;
    provenanceVersionCount: number;
    generatedAtCount: number;
}

export interface PbSystemSymbolCoverageReport {
    generatedAt: string;
    totalEntries: number;
    totalByDataset: Record<string, number>;
    totalByNamespace: Record<string, number>;
    families: readonly PbSystemSymbolCoverageFamilyReport[];
    objectEventCount: number;
    dataWindowEventCount: number;
    combinedEventCount: number;
    ownerTypeUniverseCount: number;
    ownerTypeUniverseByDataset: Record<string, number>;
    metadata: PbSystemSymbolCoverageMetadataReport;
}

export interface PbSystemSymbolConsistencyReport {
    generatedAt: string;
    validation: {
        ok: boolean;
        issueCount: number;
        byCode: Record<string, number>;
    };
    slices: readonly {
        key: string;
        count: number;
    }[];
    provenance: {
        byKind: Record<string, number>;
        byAuthority: Record<string, number>;
        withVersion: number;
        withGeneratedAt: number;
        missingGeneratedAt: number;
    };
    overlaps: {
        exactIdentityAcrossDatasets: number;
        sharedNamesAcrossDatasets: number;
        sharedNamesByDomain: Record<string, number>;
    };
}