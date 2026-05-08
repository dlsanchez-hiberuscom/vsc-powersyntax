import * as assert from 'assert/strict';

import {
  PROVIDER_ADAPTER_CONTRACTS,
  validateProviderAdapterContract,
  getProviderContract,
  type ProviderFeature,
} from '../../../src/server/serving/providerAdapterContract';

const ALL_FEATURES: ProviderFeature[] = [
  'hover', 'completion', 'completion-resolve', 'signatureHelp',
  'definition', 'references', 'documentSymbols', 'semanticTokens',
  'rename', 'linkedEditing', 'codeActions', 'codeLens', 'workspaceSymbols',
];

suite('unit/providerAdapterContract', () => {
  test('PROVIDER_ADAPTER_CONTRACTS cubre todas las features', () => {
    for (const feature of ALL_FEATURES) {
      assert.ok(
        PROVIDER_ADAPTER_CONTRACTS[feature],
        `Debe existir contrato para feature '${feature}'`
      );
    }
  });

  test('todos los contratos tienen allowsFullScan === false', () => {
    for (const feature of ALL_FEATURES) {
      const contract = PROVIDER_ADAPTER_CONTRACTS[feature];
      assert.equal(
        contract.allowsFullScan,
        false,
        `allowsFullScan debe ser false en '${feature}'`
      );
    }
  });

  test('todos los contratos tienen budgetMs positivo', () => {
    for (const feature of ALL_FEATURES) {
      const contract = PROVIDER_ADAPTER_CONTRACTS[feature];
      assert.ok(
        contract.budgetMs > 0,
        `budgetMs debe ser positivo en '${feature}'`
      );
    }
  });

  test('todos los contratos declaran cachePolicy y sourceScope coherentes', () => {
    for (const feature of ALL_FEATURES) {
      const contract = PROVIDER_ADAPTER_CONTRACTS[feature];
      assert.ok(contract.cachePolicy === 'none' || contract.cachePolicy === 'keyed');
      assert.ok(contract.sourceScope === 'document' || contract.sourceScope === 'project' || contract.sourceScope === 'workspace');
      if (contract.cachePolicy === 'none') {
        assert.equal(contract.cacheFeature, undefined, `cacheFeature debe omitirse en '${feature}'`);
      } else {
        assert.ok(contract.cacheFeature, `cacheFeature debe existir en '${feature}'`);
      }
    }
  });

  test('validateProviderAdapterContract no retorna errores para contratos válidos', () => {
    for (const feature of ALL_FEATURES) {
      const errors = validateProviderAdapterContract(PROVIDER_ADAPTER_CONTRACTS[feature]);
      assert.deepEqual(errors, [], `contrato '${feature}' no debe tener errores de validación`);
    }
  });

  test('getProviderContract retorna el contrato correcto', () => {
    const contract = getProviderContract('hover');
    assert.equal(contract.feature, 'hover');
    assert.equal(contract.allowsFullScan, false);
  });

  test('getProviderContract lanza para feature desconocida', () => {
    assert.throws(
      () => getProviderContract('unknown-feature' as ProviderFeature),
      /contrato/
    );
  });

  suite('contratos de features específicas', () => {
    test('hover es interactive con staleGuard', () => {
      const c = PROVIDER_ADAPTER_CONTRACTS['hover'];
      assert.equal(c.lane, 'interactive');
      assert.ok(c.staleGuard);
      assert.ok(c.requiresFacade);
    });

    test('references es near lane', () => {
      const c = PROVIDER_ADAPTER_CONTRACTS['references'];
      assert.equal(c.lane, 'near');
    });

    test('codeLens es background lane', () => {
      const c = PROVIDER_ADAPTER_CONTRACTS['codeLens'];
      assert.equal(c.lane, 'background');
    });

    test('documentSymbols no requiere staleGuard', () => {
      const c = PROVIDER_ADAPTER_CONTRACTS['documentSymbols'];
      assert.ok(!c.staleGuard);
    });
  });
});
