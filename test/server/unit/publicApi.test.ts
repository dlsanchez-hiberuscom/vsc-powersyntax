import * as assert from 'assert/strict';
import {
  PUBLIC_API_EXTENSION_ID,
  PUBLIC_API_VERSION,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
  getTaskExecutionContractCatalog,
  isApiVersionCompatible,
  simulateTaskExecutionDryRun,
  toApiSymbol,
} from '../../../src/shared/publicApi';
import { loadFixture } from '../helpers/fixtureLoader';

interface LegacyPublicContractFixture {
  apiVersion: string;
  apiVersionMajor: number;
  extensionId: string;
  methods: Array<{
    name: string;
    responseSchema?: string;
  }>;
  schemas: Array<{
    name: string;
  }>;
  capabilities: {
    readOnlyMethods: string[];
    readOnlyTools: string[];
  };
}

interface LegacyReadOnlyToolBridgeFixture {
  schemaVersion: string;
  apiVersion: string;
  tools: Array<{
    name: string;
    responseSchema: string;
  }>;
}

function loadCompatibilityFixture<T>(fileName: string): T {
  return JSON.parse(loadFixture('compatibility', fileName)) as T;
}

suite('unit/publicApi (B109)', () => {
  test('versión exportada', () => {
    assert.match(PUBLIC_API_VERSION, /^\d+\.\d+\.\d+$/);
    assert.equal(PUBLIC_API_VERSION.split('.')[0], '2');
  });

  test('descriptor contractual v2 expone inventario estable', () => {
    const descriptor = getPublicApiContractDescriptor();

    assert.equal(descriptor.extensionId, PUBLIC_API_EXTENSION_ID);
    assert.equal(descriptor.apiVersion, PUBLIC_API_VERSION);
    assert.equal(descriptor.apiVersionMajor, 2);
    assert.equal(descriptor.exportedFrom, 'activate');
    assert.deepEqual(descriptor.capabilities.writeEnabledMethods, [
      'applySpecDrivenPblUpdate',
      'applySpecDrivenPblUpdateBatch'
    ]);
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('diffSemanticWorkspaceSnapshots'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('checkWorkspace'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('checkObject'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('explainDiagnostic'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('explainSystemSymbol'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getCrossProjectSymbolConflicts'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getBuildProfileMatrix'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getPowerBuilderCodeMetrics'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getPowerBuilderTechnicalDebtReport'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getDataWindowSqlLineage'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getPowerBuilderDependencyGraph'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getWorkspaceMigrationAssistant'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('invokeReadOnlyTool'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('exportSemanticWorkspaceSnapshot'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('cross-project-symbol-conflicts'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('workspace-check'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('object-check'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('explain-diagnostic'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('explain-system-symbol'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('build-profile-matrix'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('code-metrics'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('technical-debt-report'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('datawindow-sql-lineage'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('dependency-graph'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('semantic-workspace-manifest'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('semantic-snapshot-diff'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('workspace-migration-assistant'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getPublicContract'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getBuildProfileMatrix' && method.command === 'powerbuilder.buildProfileMatrix'));
    assert.ok(descriptor.methods.some((method) => method.name === 'checkWorkspace' && method.command === 'powerbuilder.checkWorkspace'));
    assert.ok(descriptor.methods.some((method) => method.name === 'checkObject' && method.command === 'powerbuilder.checkCurrentObject'));
    assert.ok(descriptor.methods.some((method) => method.name === 'explainDiagnostic' && method.command === 'powerbuilder.explainDiagnostic'));
    assert.ok(descriptor.methods.some((method) => method.name === 'explainSystemSymbol' && method.command === 'powerbuilder.explainSystemSymbol'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getPowerBuilderCodeMetrics' && method.command === 'powerbuilder.codeMetrics'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getPowerBuilderTechnicalDebtReport' && method.command === 'powerbuilder.technicalDebtReport'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getCrossProjectSymbolConflicts' && method.command === 'powerbuilder.crossProjectSymbolConflicts'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getDataWindowSqlLineage' && method.command === 'powerbuilder.dataWindowSqlLineage'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getPowerBuilderDependencyGraph' && method.command === 'powerbuilder.dependencyGraph'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getSemanticWorkspaceManifest' && method.command === 'powerbuilder.semanticWorkspaceManifest'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getWorkspaceMigrationAssistant' && method.command === 'powerbuilder.workspaceMigrationAssistant'));
    assert.ok(descriptor.methods.some((method) => method.name === 'diffSemanticWorkspaceSnapshots' && method.responseSchema === 'ApiSemanticWorkspaceSnapshotDiff'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiPublicContractDescriptor' && schema.version === PUBLIC_API_VERSION));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiTaskExecutionContractCatalog' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiBuildProfileMatrix' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiWorkspaceCheckReport' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiObjectCheckReport' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiExplainDiagnosticReport' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiExplainSystemSymbolReport' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiCrossProjectSymbolConflicts' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiDataWindowSqlLineage' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiPowerBuilderCodeMetrics' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiPowerBuilderTechnicalDebtReport' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiPowerBuilderDependencyGraph' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiSemanticWorkspaceSnapshot' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiSemanticWorkspaceSnapshotDiff' && schema.version === '1.0.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiWorkspaceMigrationAssistant' && schema.version === '1.0.0'));
  });

  test('descriptor contractual devuelve copias defensivas', () => {
    const first = getPublicApiContractDescriptor();
    first.methods[0]!.name = 'mutated';
    first.capabilities.readOnlyMethods.push('mutated');

    const second = getPublicApiContractDescriptor();
    assert.notEqual(second.methods[0]!.name, 'mutated');
    assert.ok(!second.capabilities.readOnlyMethods.includes('mutated'));
  });

  test('bridge read-only publica inventario estable', () => {
    const bridge = getReadOnlyToolBridgeDescriptor();

    assert.equal(bridge.schemaVersion, '1.0.0');
    assert.equal(bridge.apiVersion, PUBLIC_API_VERSION);
    assert.ok(bridge.tools.some((tool) => tool.name === 'contract' && tool.responseSchema === 'ApiPublicContractDescriptor'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'workspace-check' && tool.responseSchema === 'ApiWorkspaceCheckReport'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'object-check' && tool.responseSchema === 'ApiObjectCheckReport'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'explain-diagnostic' && tool.responseSchema === 'ApiExplainDiagnosticReport'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'explain-system-symbol' && tool.responseSchema === 'ApiExplainSystemSymbolReport'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'build-profile-matrix' && tool.responseSchema === 'ApiBuildProfileMatrix'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'code-metrics' && tool.responseSchema === 'ApiPowerBuilderCodeMetrics'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'technical-debt-report' && tool.responseSchema === 'ApiPowerBuilderTechnicalDebtReport'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'cross-project-symbol-conflicts' && tool.responseSchema === 'ApiCrossProjectSymbolConflicts'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'current-object-context' && tool.usesActiveEditorFallback));
    assert.ok(bridge.tools.some((tool) => tool.name === 'datawindow-sql-lineage' && tool.responseSchema === 'ApiDataWindowSqlLineage'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'dependency-graph' && tool.responseSchema === 'ApiPowerBuilderDependencyGraph'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'semantic-snapshot-diff' && tool.responseSchema === 'ApiSemanticWorkspaceSnapshotDiff'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'semantic-workspace-manifest' && tool.command === 'powerbuilder.semanticWorkspaceManifest'));
    assert.ok(bridge.tools.some((tool) => tool.name === 'workspace-migration-assistant' && tool.responseSchema === 'ApiWorkspaceMigrationAssistant'));
  });

  test('descriptor contractual v2 expone task execution contracts versionados', () => {
    const descriptor = getPublicApiContractDescriptor();
    const catalog = getTaskExecutionContractCatalog();

    assert.equal(catalog.schemaVersion, '1.0.0');
    assert.equal(catalog.apiVersion, PUBLIC_API_VERSION);
    assert.deepEqual(descriptor.taskExecutionCatalog, catalog);
    assert.deepEqual(
      descriptor.taskExecutionCatalog.contracts.map((contract) => contract.id),
      ['spec-driven-pbl-update', 'spec-driven-pbl-update-batch']
    );

    const single = descriptor.taskExecutionCatalog.contracts.find((contract) => contract.id === 'spec-driven-pbl-update');
    assert.equal(single?.method, 'applySpecDrivenPblUpdate');
    assert.equal(single?.dryRun.method, 'generateSafeEditPlan');
    assert.ok(single?.validationRequired.includes('safe-edit-plan'));
    assert.ok(single?.receipts.includes('journalUri'));
    assert.ok(single?.handoff.some((entry) => entry.includes('docs/spec-driven-development.md')));
  });

  test('descriptor contractual y bridge mantienen compatibilidad con fixtures versionados', () => {
    const descriptor = getPublicApiContractDescriptor();
    const bridge = getReadOnlyToolBridgeDescriptor();
    const legacyContract = loadCompatibilityFixture<LegacyPublicContractFixture>('public-contract.v2.11.0.json');
    const legacyBridge = loadCompatibilityFixture<LegacyReadOnlyToolBridgeFixture>('read-only-tool-bridge.v1.json');

    assert.equal(isApiVersionCompatible(legacyContract.apiVersion), true);
    assert.equal(descriptor.extensionId, legacyContract.extensionId);
    assert.equal(descriptor.apiVersionMajor, legacyContract.apiVersionMajor);
    assert.ok(legacyContract.capabilities.readOnlyMethods.every((method) => descriptor.capabilities.readOnlyMethods.includes(method)));
    assert.ok(legacyContract.capabilities.readOnlyTools.every((tool) => descriptor.capabilities.readOnlyTools.some((current) => current === tool)));
    assert.ok(legacyContract.methods.every((method) => descriptor.methods.some((current) => current.name === method.name && current.responseSchema === method.responseSchema)));
    assert.ok(legacyContract.schemas.every((schema) => descriptor.schemas.some((current) => current.name === schema.name)));

    assert.equal(bridge.schemaVersion, legacyBridge.schemaVersion);
    assert.equal(isApiVersionCompatible(legacyBridge.apiVersion), true);
    assert.ok(legacyBridge.tools.every((tool) => bridge.tools.some((current) => current.name === tool.name && current.responseSchema === tool.responseSchema)));
    assert.deepEqual(JSON.parse(JSON.stringify(descriptor)), descriptor);
    assert.deepEqual(JSON.parse(JSON.stringify(bridge)), bridge);
  });

  test('descriptor contractual publica observabilidad local versionada sin telemetría externa', () => {
    const descriptor = getPublicApiContractDescriptor();
    const requiredDomains = [
      'readiness',
      'indexing',
      'cache',
      'memory',
      'latency',
      'build',
      'orca',
      'diagnostics',
      'query-trace',
      'support-bundle',
      'health',
    ];

    assert.equal(descriptor.observability.schemaVersion, '1.0.0');
    assert.equal(descriptor.observability.apiVersion, PUBLIC_API_VERSION);
    assert.equal(descriptor.observability.privacy.externalTelemetry, false);
    assert.equal(descriptor.observability.privacy.localOnly, true);
    assert.equal(descriptor.observability.privacy.offlineExportRequiresExplicitUserAction, true);
    assert.ok(requiredDomains.every((domain) => descriptor.observability.surfaces.some((surface) => surface.domain === domain)));
    assert.ok(
      descriptor.observability.surfaces.some((surface) => surface.domain === 'support-bundle'
        && surface.exposure === 'offline-export'
        && surface.command === 'vscPowerSyntax.exportSupportBundle'
        && surface.redaction === 'sanitized')
    );
    assert.ok(
      descriptor.observability.surfaces.some((surface) => surface.domain === 'health'
        && surface.schema === 'ApiRuntimeHealthReport'
        && surface.fieldPath === 'health'
        && surface.method === 'getServerStats')
    );
    assert.ok(
      descriptor.observability.surfaces.some((surface) => surface.domain === 'query-trace'
        && surface.fieldPath === 'lastQueryTrace'
        && surface.tool === 'server-stats')
    );
  });

  test('simula dry-run de task execution sin ejecutar writes', () => {
    const single = simulateTaskExecutionDryRun('spec-driven-pbl-update');
    assert.equal(single.strategy, 'single-read-only-companion');
    assert.equal(single.steps[0]?.method, 'generateSafeEditPlan');
    assert.equal(single.steps[0]?.simulatedCalls, 1);

    const batch = simulateTaskExecutionDryRun('spec-driven-pbl-update-batch', { requestCount: 3 });
    assert.equal(batch.strategy, 'repeat-read-only-companion-per-item');
    assert.equal(batch.steps[0]?.method, 'generateSafeEditPlan');
    assert.equal(batch.steps[0]?.simulatedCalls, 3);
    assert.match(batch.steps[0]?.description ?? '', /per-item/i);
  });

  test('major igual ⇒ compatible', () => {
    const major = PUBLIC_API_VERSION.split('.')[0];
    assert.equal(isApiVersionCompatible(`${major}.0.0`), true);
    assert.equal(isApiVersionCompatible(`${major}.99.7`), true);
  });

  test('major distinto ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('99.0.0'), false);
  });

  test('valor inválido ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('abc'), false);
  });

  test('toApiSymbol preserva lineage mínimo estable', () => {
    const symbol = toApiSymbol({
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'workspace-ws_objects',
        authority: 'derived',
        phase: 'implementation',
        confidence: 'direct'
      }
    });

    assert.deepEqual(symbol, {
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'workspace-ws_objects',
        authority: 'derived',
        phase: 'implementation',
        confidence: 'direct'
      }
    });
  });

  test('toApiSymbol omite lineage vacío', () => {
    const symbol = toApiSymbol({
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {}
    });

    assert.deepEqual(symbol, {
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4
    });
  });
});
