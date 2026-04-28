import * as assert from 'assert';
import {
    getPublicContractSchemaDescriptor,
    getPublicContractSchemaDescriptors,
    validatePublicContractPayload,
} from '../../powerbuilder/contracts/publicContractSchemas';

suite('PublicContractSchemas', () => {
    test('publica un catálogo versionado para la surface exportable actual', () => {
        const descriptors = getPublicContractSchemaDescriptors();

        assert.ok(descriptors.length >= 15);
        assert.ok(descriptors.some(descriptor => descriptor.payloadKind === 'powerbuilder-workspace-manifest'));
        assert.ok(descriptors.some(descriptor => descriptor.payloadKind === 'powerbuilder-public-contract-catalog'));
        assert.ok(descriptors.every(descriptor => descriptor.relativePath.startsWith('contracts/schemas/')));
        assert.ok(descriptors.every(descriptor => descriptor.schema.$id?.includes('/schemas/')));
    });

    test('valida un release report mínimo y rechaza contratos incompletos', () => {
        const descriptor = getPublicContractSchemaDescriptor('powerbuilder-release-validation-report');

        assert.ok(descriptor);

        const validPayload = {
            kind: 'powerbuilder-release-validation-report',
            schemaVersion: 1,
            generatedAt: '2026-04-26T00:00:00.000Z',
            benchmarkEnabled: false,
            dryRun: true,
            reportFile: 'docs/generated/powerbuilder/exports/release/release-validation-report.json',
            summary: {
                stepCount: 1,
                passedCount: 0,
                failedCount: 0,
                skippedCount: 1,
                finalStatus: 'dry-run',
            },
            steps: [
                {
                    label: 'compile',
                    command: 'npm',
                    args: ['run', 'compile'],
                    startedAt: '2026-04-26T00:00:00.000Z',
                    finishedAt: '2026-04-26T00:00:00.000Z',
                    durationMs: 0,
                    status: 'skipped-dry-run',
                    exitCode: 0,
                },
            ],
        };
        const invalidPayload = {
            kind: 'powerbuilder-release-validation-report',
            schemaVersion: 1,
            benchmarkEnabled: false,
        };
        const valid = validatePublicContractPayload(descriptor!.schema, validPayload);
        const invalid = validatePublicContractPayload(descriptor!.schema, invalidPayload);

        assert.strictEqual(valid.valid, true, valid.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
        assert.strictEqual(invalid.valid, false);
        assert.ok(invalid.issues.some(issue => issue.path === '$.generatedAt'));
        assert.ok(invalid.issues.some(issue => issue.path === '$.steps'));
    });

    test('valida el contrato mínimo enriquecido del runtime catalog', () => {
        const descriptor = getPublicContractSchemaDescriptor('powerbuilder-runtime-catalog');

        assert.ok(descriptor);

        const validPayload = {
            kind: 'powerbuilder-runtime-catalog',
            schemaVersion: 2,
            generatedAt: '2026-04-26T00:00:00.000Z',
            summary: {
                sliceCount: 2,
                entryCount: 3,
            },
            typing: {
                overloadedEntryCount: 1,
                entryCountWithParameterLabels: 2,
                entryCountWithExplicitParameterMetadata: 1,
                entryCountWithDerivedReturnType: 1,
                obsoleteWithReplacementCount: 1,
                ownerKinds: {
                    global: 1,
                    'typed-owner': 2,
                },
                callableKinds: {
                    'global-function': 1,
                    'system-event': 2,
                },
            },
            coverage: {
                totalEntries: 3,
                families: [],
                metadata: {
                    obsoleteCount: 1,
                    replacementCount: 1,
                    aliasCount: 0,
                    sourceUrlCount: 3,
                    provenanceVersionCount: 3,
                    generatedAtCount: 1,
                },
            },
            consistency: {
                validation: {
                    ok: true,
                    issueCount: 0,
                    byCode: {},
                },
                slices: [],
                provenance: {
                    byKind: {},
                    byAuthority: {},
                    withVersion: 3,
                    withGeneratedAt: 1,
                    missingGeneratedAt: 0,
                },
                overlaps: {
                    exactIdentityAcrossDatasets: 0,
                    sharedNamesAcrossDatasets: 0,
                    sharedNamesByDomain: {},
                },
            },
            indexes: {
                domains: [],
                ownerTypes: [],
                returnTypes: [],
            },
            slices: [],
            entries: [],
        };
        const invalidPayload = {
            kind: 'powerbuilder-runtime-catalog',
            schemaVersion: 2,
            generatedAt: '2026-04-26T00:00:00.000Z',
            summary: {
                sliceCount: 1,
                entryCount: 1,
            },
            slices: [],
            entries: [],
        };
        const valid = validatePublicContractPayload(descriptor!.schema, validPayload);
        const invalid = validatePublicContractPayload(descriptor!.schema, invalidPayload);

        assert.strictEqual(valid.valid, true, valid.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
        assert.strictEqual(invalid.valid, false);
        assert.ok(invalid.issues.some(issue => issue.path === '$.typing'));
        assert.ok(invalid.issues.some(issue => issue.path === '$.indexes'));
    });

    test('valida un automation replay mínimo y rechaza payloads incompletos', () => {
        const descriptor = getPublicContractSchemaDescriptor('powerbuilder-automation-replay');

        assert.ok(descriptor);

        const validPayload = {
            kind: 'powerbuilder-automation-replay',
            schemaVersion: 1,
            generatedAt: '2026-04-26T00:00:00.000Z',
            summary: {
                stepCount: 2,
                commandStepCount: 1,
                languageModelToolStepCount: 1,
                completedCount: 2,
                failedCount: 0,
                skippedCount: 0,
                generatedFileCount: 1,
                structuredResultCount: 1,
                stoppedEarly: false,
            },
            manifest: {
                automationSurfaceRelativePath: 'docs/generated/powerbuilder/exports/automation/automation-surface.json',
                automationSurfaceGeneratedAt: '2026-04-26T00:00:00.000Z',
            },
            steps: [],
        };
        const invalidPayload = {
            kind: 'powerbuilder-automation-replay',
            schemaVersion: 1,
            generatedAt: '2026-04-26T00:00:00.000Z',
            summary: {
                stepCount: 1,
            },
        };
        const valid = validatePublicContractPayload(descriptor!.schema, validPayload);
        const invalid = validatePublicContractPayload(descriptor!.schema, invalidPayload);

        assert.strictEqual(valid.valid, true, valid.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
        assert.strictEqual(invalid.valid, false);
        assert.ok(invalid.issues.some(issue => issue.path === '$.manifest'));
        assert.ok(invalid.issues.some(issue => issue.path === '$.steps'));
    });
});