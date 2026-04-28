import * as assert from 'assert';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../powerbuilder/knowledge/registry/registry';
import { getSystemSymbolHoverPayload } from '../../powerbuilder/knowledge/services/presentation';
import {
    findApplicableEventsForOwnerType,
    findApplicableMembersForOwnerType,
    findSystemSymbolsByLookupKey,
    findSystemSymbolsByName,
    listSystemSymbolsByDataset,
    listSystemSymbolsByNamespace,
    resolveSystemGlobalFunction,
} from '../../powerbuilder/knowledge/services/queryService';
import { getSystemSignaturePayload } from '../../powerbuilder/knowledge/services/signatureService';
import { buildSystemSymbolConsistencyReport } from '../../powerbuilder/knowledge/validation/buildConsistencyReport';
import { buildSystemSymbolCoverageReport } from '../../powerbuilder/knowledge/validation/buildCoverageReport';
import { validateSystemSymbolCatalog } from '../../powerbuilder/knowledge/validation/validateSystemSymbolCatalog';

suite('KnowledgeLayer', () => {
    test('centraliza slices e índices reutilizables del catálogo', () => {
        assert.ok(PB_SYSTEM_SYMBOL_REGISTRY.slices.length >= 10);
        assert.ok(PB_SYSTEM_SYMBOL_REGISTRY.entries.length >= 90);
        assert.ok((PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDataset.get('manual-core')?.length ?? 0) >= 90);
        assert.ok((PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomain.get('datawindow-events')?.length ?? 0) >= 12);
    });

    test('separa lookup canónico y lookup por alias', () => {
        assert.strictEqual(findSystemSymbolsByName('halt close').length, 0);

        const aliases = findSystemSymbolsByLookupKey('halt close');

        assert.strictEqual(aliases.length, 1);
        assert.strictEqual(aliases[0].name, 'HALT');
    });

    test('expone servicios owner-aware para members y eventos', () => {
        const objectMembers = findApplicableMembersForOwnerType(['singlelineedit']);
        const dataWindowEvents = findApplicableEventsForOwnerType(['datawindow']);

        assert.ok(objectMembers.some(entry => entry.name === 'SetFocus'));
        assert.ok(!objectMembers.some(entry => entry.name === 'Retrieve'));
        assert.ok(dataWindowEvents.some(entry => entry.name === 'ItemChanged'));
        assert.ok(dataWindowEvents.some(entry => entry.name === 'Clicked'));
    });

    test('genera payloads reutilizables para hover y firma', () => {
        const clipboard = resolveSystemGlobalFunction('Clipboard');

        assert.ok(clipboard);

        const hover = getSystemSymbolHoverPayload(clipboard!);
        const signature = getSystemSignaturePayload(clipboard!, 1, true);

        assert.ok(hover.markdown.includes('**Clipboard**'));
        assert.strictEqual(signature.activeSignatureIndex, 1);
    });

    test('expone provenance estructurada para manual-core y generated', () => {
        const manualEntry = resolveSystemGlobalFunction('Clipboard');
        const generatedEntry = listSystemSymbolsByDataset('generated')
            .find(entry => entry.name === 'ApplyTheme');

        assert.ok(manualEntry);
        assert.strictEqual(manualEntry!.provenance.kind, 'manual');
        assert.strictEqual(manualEntry!.provenance.authority, 'curated');
        assert.strictEqual(manualEntry!.provenance.version, 'PowerBuilder 2025');

        assert.ok(generatedEntry);
        assert.strictEqual(generatedEntry!.provenance.kind, 'generated');
        assert.strictEqual(generatedEntry!.provenance.authority, 'official');
        assert.strictEqual(generatedEntry!.provenance.version, 'PowerBuilder 2025');
        assert.ok(generatedEntry!.provenance.generatedAt);
    });

    test('mantiene consultas por dataset y namespace desde la knowledge layer', () => {
        const manualCoreEntries = listSystemSymbolsByDataset('manual-core');
        const dataWindowEntries = listSystemSymbolsByNamespace('datawindow');

        assert.ok(manualCoreEntries.length >= 90);
        assert.ok(dataWindowEntries.some(entry => entry.domain === 'datawindow-functions'));
        assert.ok(dataWindowEntries.some(entry => entry.domain === 'datawindow-events'));
    });

    test('deriva un coverage report coherente desde el catálogo vivo', () => {
        const report = buildSystemSymbolCoverageReport();
        const familyTotal = report.families.reduce((total, family) => total + family.integratedCount, 0);
        const systemEvents = report.families.find(family => family.domain === 'system-events');
        const statements = report.families.find(family => family.domain === 'statements');

        assert.strictEqual(report.totalEntries, PB_SYSTEM_SYMBOL_REGISTRY.entries.length);
        assert.strictEqual(report.totalEntries, familyTotal);
        assert.strictEqual(report.combinedEventCount, report.objectEventCount + report.dataWindowEventCount);
        assert.strictEqual(systemEvents?.officialCoverage?.missingCount, 0);
        assert.strictEqual(statements?.officialCoverage?.missingCount, 0);

        for (const family of report.families) {
            const datasetTotal = Object.values(family.byDataset)
                .reduce((total, value) => total + value, 0);

            assert.strictEqual(family.integratedCount, datasetTotal);
        }
    });

    test('deriva un consistency report con provenance y overlaps trazables', () => {
        const report = buildSystemSymbolConsistencyReport();

        assert.strictEqual(report.validation.ok, true);
        assert.ok(report.provenance.byKind.manual > 0);
        assert.ok(report.provenance.byKind.generated > 0);
        assert.strictEqual(report.provenance.withVersion, PB_SYSTEM_SYMBOL_REGISTRY.entries.length);
        assert.ok(report.overlaps.sharedNamesAcrossDatasets >= report.overlaps.exactIdentityAcrossDatasets);
    });

    test('valida la integridad del catálogo sin incidencias', () => {
        const validation = validateSystemSymbolCatalog();

        assert.strictEqual(
            validation.ok,
            true,
            validation.issues.map(issue => `${issue.code}: ${issue.message}`).join('\n'),
        );
        assert.strictEqual(validation.issues.length, 0);
    });
});
