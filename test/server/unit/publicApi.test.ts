import * as assert from 'assert/strict';
import {
  PUBLIC_API_EXTENSION_ID,
  PUBLIC_API_VERSION,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
  isApiVersionCompatible,
  toApiSymbol,
} from '../../../src/shared/publicApi';

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
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('invokeReadOnlyTool'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('exportSemanticWorkspaceSnapshot'));
    assert.ok(descriptor.capabilities.readOnlyTools.includes('semantic-workspace-manifest'));
    assert.ok(descriptor.capabilities.readOnlyMethods.includes('getPublicContract'));
    assert.ok(descriptor.methods.some((method) => method.name === 'getSemanticWorkspaceManifest' && method.command === 'powerbuilder.semanticWorkspaceManifest'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiPublicContractDescriptor' && schema.version === '2.2.0'));
    assert.ok(descriptor.schemas.some((schema) => schema.name === 'ApiSemanticWorkspaceSnapshot' && schema.version === '1.0.0'));
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
    assert.ok(bridge.tools.some((tool) => tool.name === 'current-object-context' && tool.usesActiveEditorFallback));
    assert.ok(bridge.tools.some((tool) => tool.name === 'semantic-workspace-manifest' && tool.command === 'powerbuilder.semanticWorkspaceManifest'));
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
