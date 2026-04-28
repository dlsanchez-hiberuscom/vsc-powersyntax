import { normalizeSystemSymbolName } from '../normalization';
import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from '../registry/datasets';
import {
    PbSystemSymbolDatasetSlice,
    PbSystemSymbolEntry,
} from '../types';

export type PbSystemSymbolValidationIssueCode =
    | 'duplicate-id'
    | 'alias-conflict'
    | 'missing-signature'
    | 'invalid-owner-types'
    | 'missing-source-url'
    | 'missing-provenance'
    | 'invalid-provenance'
    | 'invalid-category'
    | 'invalid-shape'
    | 'slice-metadata-mismatch';

export interface PbSystemSymbolValidationIssue {
    code: PbSystemSymbolValidationIssueCode;
    message: string;
    entryId?: string;
}

export interface PbSystemSymbolValidationResult {
    ok: boolean;
    issues: readonly PbSystemSymbolValidationIssue[];
}

function collectEntries(
    slices: readonly PbSystemSymbolDatasetSlice[],
): PbSystemSymbolEntry[] {
    return slices.flatMap(slice => slice.entries);
}

function pushIssue(
    issues: PbSystemSymbolValidationIssue[],
    code: PbSystemSymbolValidationIssueCode,
    message: string,
    entryId?: string,
): void {
    issues.push({ code, message, entryId });
}

function validateSliceMetadata(
    slices: readonly PbSystemSymbolDatasetSlice[],
    issues: PbSystemSymbolValidationIssue[],
): void {
    for (const slice of slices) {
        for (const entry of slice.entries) {
            if (entry.dataset !== slice.dataset || entry.domain !== slice.domain) {
                pushIssue(
                    issues,
                    'slice-metadata-mismatch',
                    `La entrada ${entry.name} no coincide con el slice ${slice.dataset}/${slice.domain}.`,
                    entry.id,
                );
            }

            if (slice.allowedCategories && !slice.allowedCategories.includes(entry.category)) {
                pushIssue(
                    issues,
                    'invalid-category',
                    `La categoría ${entry.category} no está permitida en ${slice.dataset}/${slice.domain}.`,
                    entry.id,
                );
            }

            if (slice.requireSourceUrl && !entry.sourceUrl) {
                pushIssue(
                    issues,
                    'missing-source-url',
                    `La entrada ${entry.name} requiere sourceUrl en ${slice.dataset}/${slice.domain}.`,
                    entry.id,
                );
            }

            if (slice.allowedOwnerTypes) {
                for (const ownerType of entry.ownerTypes ?? []) {
                    if (!slice.allowedOwnerTypes.includes(ownerType)) {
                        pushIssue(
                            issues,
                            'invalid-owner-types',
                            `El ownerType ${ownerType} no está permitido en ${slice.dataset}/${slice.domain}.`,
                            entry.id,
                        );
                    }
                }
            }
        }
    }
}

function validateShape(
    entries: readonly PbSystemSymbolEntry[],
    issues: PbSystemSymbolValidationIssue[],
): void {
    const ids = new Map<string, PbSystemSymbolEntry[]>();

    for (const entry of entries) {
        const duplicates = ids.get(entry.id) ?? [];
        duplicates.push(entry);
        ids.set(entry.id, duplicates);

        if (!entry.name.trim() || !entry.category.trim() || !entry.summary.trim() || !entry.source.trim()) {
            pushIssue(
                issues,
                'invalid-shape',
                `La entrada ${entry.id} contiene campos de texto vacíos.`,
                entry.id,
            );
        }

        if (entry.lookupKeys.length === 0 || !entry.normalizedName) {
            pushIssue(
                issues,
                'invalid-shape',
                `La entrada ${entry.id} no generó claves de lookup válidas.`,
                entry.id,
            );
        }

        if (entry.signatures.length === 0 || entry.signatures.some(signature => !signature.label.trim())) {
            pushIssue(
                issues,
                'missing-signature',
                `La entrada ${entry.name} no define firmas válidas.`,
                entry.id,
            );
        }

        if (entry.invocation === 'global' && (entry.ownerTypes?.length ?? 0) > 0) {
            pushIssue(
                issues,
                'invalid-owner-types',
                `La entrada global ${entry.name} no debe declarar ownerTypes.`,
                entry.id,
            );
        }

        if (!entry.provenance?.source.trim()) {
            pushIssue(
                issues,
                'missing-provenance',
                `La entrada ${entry.name} no declara provenance.source.`,
                entry.id,
            );
        }

        if (entry.provenance.source !== entry.source) {
            pushIssue(
                issues,
                'invalid-provenance',
                `La provenance.source de ${entry.name} no coincide con source.`,
                entry.id,
            );
        }

        if ((entry.provenance.sourceUrl ?? undefined) !== (entry.sourceUrl ?? undefined)) {
            pushIssue(
                issues,
                'invalid-provenance',
                `La provenance.sourceUrl de ${entry.name} no coincide con sourceUrl.`,
                entry.id,
            );
        }

        if ((entry.dataset === 'generated' || entry.dataset === 'manual-core') && !entry.provenance.version?.trim()) {
            pushIssue(
                issues,
                'missing-provenance',
                `La entrada ${entry.name} no declara provenance.version para ${entry.dataset}.`,
                entry.id,
            );
        }

        if (entry.dataset === 'generated' && entry.provenance.kind !== 'generated') {
            pushIssue(
                issues,
                'invalid-provenance',
                `La entrada ${entry.name} debe declarar provenance.kind=generated.`,
                entry.id,
            );
        }

        if (entry.dataset === 'manual-core' && entry.provenance.kind !== 'manual') {
            pushIssue(
                issues,
                'invalid-provenance',
                `La entrada ${entry.name} debe declarar provenance.kind=manual.`,
                entry.id,
            );
        }

        for (const ownerType of entry.ownerTypes ?? []) {
            if (normalizeSystemSymbolName(ownerType) !== ownerType) {
                pushIssue(
                    issues,
                    'invalid-owner-types',
                    `La entrada ${entry.name} contiene ownerTypes no normalizados.`,
                    entry.id,
                );
                break;
            }
        }
    }

    for (const [id, duplicateEntries] of ids.entries()) {
        if (duplicateEntries.length > 1) {
            pushIssue(
                issues,
                'duplicate-id',
                `El id ${id} se repite ${duplicateEntries.length} veces.`,
                id,
            );
        }
    }
}

function validateAliasConflicts(
    entries: readonly PbSystemSymbolEntry[],
    issues: PbSystemSymbolValidationIssue[],
): void {
    const declarations = new Map<string, Set<string>>();

    for (const entry of entries) {
        const scopeKey = [entry.domain, entry.kind, entry.namespace, entry.invocation].join('|');
        const keys = [entry.normalizedName, ...(entry.lookupAliases ?? [])];

        for (const key of keys) {
            const bucketKey = `${scopeKey}|${key}`;
            const canonicalNames = declarations.get(bucketKey) ?? new Set<string>();
            canonicalNames.add(entry.normalizedName);
            declarations.set(bucketKey, canonicalNames);
        }
    }

    for (const entry of entries) {
        const scopeKey = [entry.domain, entry.kind, entry.namespace, entry.invocation].join('|');

        for (const lookupAlias of entry.lookupAliases ?? []) {
            const bucketKey = `${scopeKey}|${lookupAlias}`;
            const canonicalNames = declarations.get(bucketKey);

            if (canonicalNames && canonicalNames.size > 1) {
                pushIssue(
                    issues,
                    'alias-conflict',
                    `El alias ${lookupAlias} es ambiguo en el scope ${scopeKey}.`,
                    entry.id,
                );
            }
        }
    }
}

export function validateSystemSymbolCatalog(
    slices: readonly PbSystemSymbolDatasetSlice[] = PB_SYSTEM_SYMBOL_DATASET_SLICES,
): PbSystemSymbolValidationResult {
    const issues: PbSystemSymbolValidationIssue[] = [];
    const entries = collectEntries(slices);

    validateSliceMetadata(slices, issues);
    validateShape(entries, issues);
    validateAliasConflicts(entries, issues);

    return {
        ok: issues.length === 0,
        issues,
    };
}
