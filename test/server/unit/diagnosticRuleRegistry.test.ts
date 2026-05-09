import * as assert from 'assert/strict';

import { DiagnosticSeverity, Range } from 'vscode-languageserver/node';

import {
  collectUnregisteredDiagnosticCodes,
  DIAGNOSTIC_RULE_REGISTRY,
  DiagnosticRuleRegistry,
  filterDiagnosticsByRegistryMetadata,
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

    test('covers all codes emitted by the diagnostics pipeline', () => {
      const diagnostics = Object.values(DIAGNOSTIC_CODES).map((code) => ({ code, source: `PowerScript:${code}` }));
      assert.deepEqual(collectUnregisteredDiagnosticCodes(diagnostics), []);
    });

    test('todas las reglas registradas tienen tier y lane válidos', () => {
      for (const rule of DIAGNOSTIC_RULE_REGISTRY.getAll()) {
        assert.ok([0, 1, 2, 3, 4].includes(rule.tier), `${rule.id} debe declarar tier válido`);
        assert.ok(rule.lane.length > 0, `${rule.id} debe declarar lane`);
      }
    });

    test('las reglas advisory registradas están marcadas como advisory', () => {
      const advisoryRules = DIAGNOSTIC_RULE_REGISTRY.getAll().filter((rule) => rule.domain === 'advisory' || rule.id.includes('dynamic'));
      assert.ok(advisoryRules.length > 0, 'Debe existir al menos una regla advisory');
      assert.ok(advisoryRules.every((rule) => rule.advisory === true), 'Las reglas advisory deben marcar advisory=true');
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

    test('filterDiagnosticsByRegistryMetadata filtra por tier y aplica cap por regla', () => {
      registry.register({ id: 'TEST-CAP', tier: 2, domain: 'semantic', lane: 'interactive', cap: 1 });
      registry.register({ id: 'TEST-TIER1', tier: 1, domain: 'syntactic', lane: 'immediate' });

      const diagnostics = [
        {
          code: 'TEST-CAP',
          severity: DiagnosticSeverity.Warning,
          range: Range.create(0, 0, 0, 1),
          message: 'cap-1',
          source: 'PowerScript:TEST-CAP',
        },
        {
          code: 'TEST-CAP',
          severity: DiagnosticSeverity.Warning,
          range: Range.create(1, 0, 1, 1),
          message: 'cap-2',
          source: 'PowerScript:TEST-CAP',
        },
        {
          code: 'TEST-TIER1',
          severity: DiagnosticSeverity.Warning,
          range: Range.create(2, 0, 2, 1),
          message: 'tier-1',
          source: 'PowerScript:TEST-TIER1',
        },
      ];

      const filtered = filterDiagnosticsByRegistryMetadata(diagnostics, (tier) => tier >= 2, { registry });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].message, 'cap-1');
    });

    test('filterDiagnosticsByRegistryMetadata rechaza severidad warning/error para reglas advisory', () => {
      registry.register({ id: 'TEST-ADVISORY', tier: 2, domain: 'advisory', lane: 'interactive', advisory: true });

      assert.throws(() => {
        filterDiagnosticsByRegistryMetadata([
          {
            code: 'TEST-ADVISORY',
            severity: DiagnosticSeverity.Warning,
            range: Range.create(0, 0, 0, 1),
            message: 'advisory-warning',
            source: 'PowerScript:TEST-ADVISORY',
          },
        ], (tier) => tier >= 2, { registry });
      }, /advisory/i);
    });

    test('filterDiagnosticsByRegistryMetadata permite códigos no registrados solo si están allowlisted', () => {
      const diagnostics = [
        {
          code: 'ALLOWLISTED',
          severity: DiagnosticSeverity.Information,
          range: Range.create(0, 0, 0, 1),
          message: 'allowlisted',
          source: 'PowerScript:ALLOWLISTED',
        },
      ];

      const filtered = filterDiagnosticsByRegistryMetadata(diagnostics, () => true, {
        registry,
        allowUnregisteredCodes: ['ALLOWLISTED'],
      });

      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].message, 'allowlisted');
    });
  });
});
