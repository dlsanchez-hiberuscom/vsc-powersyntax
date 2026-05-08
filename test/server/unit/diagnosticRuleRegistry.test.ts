import * as assert from 'assert/strict';

import {
  collectUnregisteredDiagnosticCodes,
  DIAGNOSTIC_RULE_REGISTRY,
  DiagnosticRuleRegistry,
  type DiagnosticRuleMetadata,
} from '../../../src/server/features/diagnosticRuleRegistry';
import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';

suite('unit/diagnosticRuleRegistry', () => {
  suite('registro singleton', () => {
    test('contiene todas las reglas SD tier 1', () => {
      const tier1 = DIAGNOSTIC_RULE_REGISTRY.getByTier(1);
      const ids = tier1.map(r => r.id);
      assert.ok(ids.includes('SD7'), 'SD7 debe estar en tier 1');
      assert.ok(ids.includes('SD9'), 'SD9 debe estar en tier 1');
      assert.ok(ids.includes('SD10'), 'SD10 debe estar en tier 1');
      assert.ok(ids.includes('SD11'), 'SD11 debe estar en tier 1');
      assert.ok(ids.includes('SD12'), 'SD12 debe estar en tier 1');
      assert.ok(ids.includes('SD13'), 'SD13 debe estar en tier 1');
    });

    test('contiene todas las reglas SD tier 2', () => {
      const tier2 = DIAGNOSTIC_RULE_REGISTRY.getByTier(2);
      const ids = tier2.map(r => r.id);
      for (const id of ['SD2', 'SD3', 'SD4', 'SD5', 'SD6', 'SD8']) {
        assert.ok(ids.includes(id), `${id} debe estar en tier 2`);
      }
    });

    test('contiene reglas DataWindow en tier 2', () => {
      const tier2 = DIAGNOSTIC_RULE_REGISTRY.getByTier(2);
      const ids = tier2.map(r => r.id);
      for (const id of [
        'dataobject-not-found',
        'dataobject-ambiguous',
        'datawindow-expression-dependency-unresolved',
        'datawindow-property-path-unresolved',
        'retrieve-arity-mismatch',
      ]) {
        assert.ok(ids.includes(id), `${id} debe estar en tier 2 datawindow`);
      }
    });

    test('contiene regla native-dependency advisory en tier 2', () => {
      const rule = DIAGNOSTIC_RULE_REGISTRY.lookup('native-dependency');
      assert.ok(rule, 'native-dependency debe existir');
      assert.equal(rule.tier, 2);
      assert.equal(rule.domain, 'advisory');
      assert.equal(rule.advisory, true);
    });

    test('lookup retorna undefined para id desconocido', () => {
      const rule = DIAGNOSTIC_RULE_REGISTRY.lookup('no-existe');
      assert.equal(rule, undefined);
    });

    test('cubre todos los códigos emitidos por el pipeline de diagnostics', () => {
      const diagnostics = Object.values(DIAGNOSTIC_CODES).map((code) => ({ code, source: `PowerScript:${code}` }));
      assert.deepEqual(collectUnregisteredDiagnosticCodes(diagnostics), []);
    });
  });

  suite('DiagnosticRuleRegistry instancia aislada', () => {
    let registry: DiagnosticRuleRegistry;

    setup(() => {
      registry = new DiagnosticRuleRegistry();
    });

    test('registro y lookup básico', () => {
      const meta: DiagnosticRuleMetadata = {
        id: 'TEST-001',
        tier: 1,
        domain: 'syntactic',
        lane: 'immediate',
        budgetMs: 10,
      };
      registry.register(meta);
      const found = registry.lookup('TEST-001');
      assert.deepEqual(found, meta);
    });

    test('getAll retorna todos los registrados', () => {
      registry.register({ id: 'A', tier: 0, domain: 'structural', lane: 'immediate' });
      registry.register({ id: 'B', tier: 2, domain: 'semantic', lane: 'interactive' });
      const all = registry.getAll();
      assert.equal(all.length, 2);
    });

    test('getByTier filtra correctamente', () => {
      registry.register({ id: 'X1', tier: 1, domain: 'syntactic', lane: 'immediate' });
      registry.register({ id: 'X2', tier: 2, domain: 'semantic', lane: 'interactive' });
      registry.register({ id: 'X3', tier: 1, domain: 'structural', lane: 'immediate' });
      const tier1 = registry.getByTier(1);
      assert.equal(tier1.length, 2);
      assert.ok(tier1.every(r => r.tier === 1));
    });

    test('registro duplicado sobrescribe', () => {
      registry.register({ id: 'DUP', tier: 1, domain: 'syntactic', lane: 'immediate' });
      registry.register({ id: 'DUP', tier: 2, domain: 'semantic', lane: 'interactive' });
      const found = registry.lookup('DUP');
      assert.equal(found?.tier, 2);
    });
  });
});
