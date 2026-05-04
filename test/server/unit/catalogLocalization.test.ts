import * as assert from 'assert/strict';
import {
  buildSystemSymbolLocalizationIndex,
  getSystemSymbolLocalizationCatalogReport,
  getSystemSymbolLocalizationOverlay,
} from '../../../src/server/knowledge/system/localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import type { PbSystemSymbolLocalizationOverlay } from '../../../src/server/knowledge/system/localization';

suite('unit/catalogLocalization (B371)', () => {
  test('overlay espanol parcial resuelve por targetKey sin mutar el summary oficial', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    assert.ok(absEntry);

    const overlay = getSystemSymbolLocalizationOverlay(absEntry!.id, 'es');
    assert.ok(overlay);
    assert.equal(absEntry!.summary, 'Calculates the absolute value of a number.');
    assert.equal(overlay?.text?.summary, 'Calcula el valor absoluto de un numero.');
    assert.equal(overlay?.parameters?.[0]?.parameterName, 'n');
  });

  test('reporte live de localizacion publica overlays es sin huerfanos', () => {
    const report = getSystemSymbolLocalizationCatalogReport();

    assert.ok((report.locales.es?.overlayCount ?? 0) >= 3);
    assert.ok((report.domainCoverage.es?.['global-functions']?.localizedTargetCount ?? 0) >= 3);
    assert.equal(report.incompleteOverlays.length, 0);
    assert.equal(report.invalidParameterTargets.length, 0);
    assert.equal(report.orphanOverlays.length, 0);
  });

  test('resolver detecta overlays huerfanos por targetKey inexistente y acepta targetId directo', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen de prueba por targetId.',
        },
      },
      {
        locale: 'es',
        targetKey: {
          domain: 'global-functions',
          kind: 'callable',
          namespace: 'powerscript',
          invocation: 'global',
          name: 'DefinitelyMissingFunction',
        },
        text: {
          summary: 'Overlay invalido.',
        },
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);

    assert.equal(index.overlayCount, 2);
    assert.equal(index.locales.get('es')?.get(absEntry!.id)?.text?.summary, 'Resumen de prueba por targetId.');
    assert.equal(index.orphanOverlays.length, 1);
    assert.equal(index.orphanOverlays[0]?.reason, 'missing-target-key');
  });

  test('resolver detecta overlays incompletos cuando faltan campos documentales presentes en el target', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen parcial.',
        },
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);

    assert.equal(index.incompleteOverlays.length, 1);
    assert.deepEqual(index.incompleteOverlays[0]?.missingFields, [
      'returnDocumentation',
      'parameterDocumentation',
    ]);
  });

  test('resolver detecta parametros localizados que intentan traducir nombres tecnicos o signatures', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        targetId: absEntry!.id,
        text: {
          summary: 'Calcula el valor absoluto.',
          documentation: 'Mantiene el nombre tecnico intacto.',
          returnDocumentation: 'Devuelve el valor absoluto.',
        },
        parameters: [
          {
            signatureLabel: 'Abs ( numero )',
            parameterName: 'numero',
            documentation: 'Parametro mal anclado.',
          },
        ],
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);

    assert.equal(index.invalidParameterTargets.length, 1);
    assert.equal(index.invalidParameterTargets[0]?.parameterName, 'numero');
    assert.equal(index.invalidParameterTargets[0]?.signatureLabel, 'Abs ( numero )');
  });
});