import * as assert from 'assert/strict';
import {
  PB_SYSTEM_SYMBOL_LOCALIZATION_RESERVED_SCHEMA_FIELDS,
  PB_SYSTEM_SYMBOL_LOCALIZATION_SCHEMA_VERSION,
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

  test('slice visible de built-ins globales amplia coverage sin romper anchors tecnicos', () => {
    const isNullEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'IsNull',
    );
    assert.ok(isNullEntry);

    const overlay = getSystemSymbolLocalizationOverlay(isNullEntry!.id, 'es');
    assert.ok(overlay);
    assert.equal(isNullEntry!.summary, 'Reports whether the value of a variable or expression is null.');
    assert.equal(overlay?.text?.summary, 'Indica si una variable o expresion contiene null.');
    assert.equal(overlay?.parameters?.[0]?.signatureLabel, 'IsNull ( any )');
    assert.equal(overlay?.parameters?.[0]?.parameterName, 'any');
  });

  test('slice visible DataWindow amplia coverage con targetKey member-scoped y anchors intactos', () => {
    const retrieveEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.domain === 'datawindow-functions'
        && entry.name === 'Retrieve'
        && entry.ownerTypes?.includes('datastore'),
    );
    assert.ok(retrieveEntry);

    const overlay = getSystemSymbolLocalizationOverlay(retrieveEntry!.id, 'es');
    assert.ok(overlay);
    assert.equal(
      overlay?.text?.summary,
      'Recupera filas desde la fuente de datos usando los retrieve arguments definidos y un transaction binding valido.',
    );
    assert.equal(overlay?.parameters?.[0]?.signatureLabel, 'Retrieve(argument...)');
    assert.equal(overlay?.parameters?.[0]?.parameterName, 'argument...');
  });

  test('slice visible de enums amplia coverage con targetKey runtime y sin traducir valores reales', () => {
    const saveAsTypeEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'enumerated-types' && entry.name === 'SaveAsType',
    );
    const primaryValueEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'enumerated-values' && entry.name === 'Primary!',
    );
    assert.ok(saveAsTypeEntry);
    assert.ok(primaryValueEntry);

    const saveAsTypeOverlay = getSystemSymbolLocalizationOverlay(saveAsTypeEntry!.id, 'es');
    const primaryValueOverlay = getSystemSymbolLocalizationOverlay(primaryValueEntry!.id, 'es');

    assert.ok(saveAsTypeOverlay);
    assert.ok(primaryValueOverlay);
    assert.equal(saveAsTypeEntry!.summary, 'Values for specifying a format for data you want to save.');
    assert.equal(saveAsTypeOverlay?.text?.summary, 'Valores para especificar el formato de los datos que quieres guardar.');
    assert.equal(primaryValueOverlay?.text?.summary, 'Selecciona el buffer principal del DataWindow.');
    assert.equal(primaryValueEntry!.name, 'Primary!');
  });

  test('slice visible de system-object-datatypes amplia coverage sin traducir nombres reales', () => {
    const dataStoreEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'system-object-datatypes' && entry.name === 'DataStore',
    );
    const httpClientEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'system-object-datatypes' && entry.name === 'HTTPClient',
    );
    assert.ok(dataStoreEntry);
    assert.ok(httpClientEntry);

    const dataStoreOverlay = getSystemSymbolLocalizationOverlay(dataStoreEntry!.id, 'es');
    const httpClientOverlay = getSystemSymbolLocalizationOverlay(httpClientEntry!.id, 'es');

    assert.ok(dataStoreOverlay);
    assert.ok(httpClientOverlay);
    assert.equal(dataStoreEntry!.summary, 'A DataStore is a nonvisual DataWindow control.');
    assert.equal(dataStoreOverlay?.text?.summary, 'DataStore es un control DataWindow no visual.');
    assert.equal(httpClientOverlay?.text?.summary, 'HTTPClient es un objeto base para enviar solicitudes HTTP y recibir respuestas HTTP desde un recurso identificado por una URI.');
    assert.equal(httpClientEntry!.name, 'HTTPClient');
  });

  test('slice visible de statements, keywords y reserved words amplia coverage sin traducir lexemas', () => {
    const ifThenEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'statements' && entry.name === 'IF...THEN',
    );
    const forKeywordEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'keywords' && entry.name === 'FOR',
    );
    const trueReservedEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'reserved-words' && entry.name === 'TRUE',
    );
    assert.ok(ifThenEntry);
    assert.ok(forKeywordEntry);
    assert.ok(trueReservedEntry);

    const ifThenOverlay = getSystemSymbolLocalizationOverlay(ifThenEntry!.id, 'es');
    const forKeywordOverlay = getSystemSymbolLocalizationOverlay(forKeywordEntry!.id, 'es');
    const trueReservedOverlay = getSystemSymbolLocalizationOverlay(trueReservedEntry!.id, 'es');

    assert.ok(ifThenOverlay);
    assert.ok(forKeywordOverlay);
    assert.ok(trueReservedOverlay);
    assert.equal(ifThenEntry!.summary, 'A control structure used to cause a script to perform a specified action if a stated condition is true. Syntax 1 uses a single-line format, and Syntax 2 uses a multiline format.');
    assert.equal(ifThenOverlay?.text?.summary, 'Estructura de control que ejecuta una accion cuando una condicion indicada es verdadera.');
    assert.equal(forKeywordOverlay?.text?.summary, 'Keyword oficial que inicia una iteracion numerica en PowerScript.');
    assert.equal(trueReservedOverlay?.text?.summary, 'Literal booleano reservado que representa verdadero.');
    assert.equal(forKeywordEntry!.name, 'FOR');
    assert.equal(trueReservedEntry!.name, 'TRUE');
  });

  test('reporte live de localizacion publica overlays es sin huerfanos', () => {
    const report = getSystemSymbolLocalizationCatalogReport();

    assert.equal(report.schemaVersion, PB_SYSTEM_SYMBOL_LOCALIZATION_SCHEMA_VERSION);
    assert.ok((report.locales.es?.overlayCount ?? 0) >= 31);
    assert.ok((report.domainCoverage.es?.['global-functions']?.localizedTargetCount ?? 0) >= 8);
    assert.ok((report.domainCoverage.es?.['datawindow-functions']?.localizedTargetCount ?? 0) >= 5);
    assert.ok((report.domainCoverage.es?.['enumerated-types']?.localizedTargetCount ?? 0) >= 3);
    assert.ok((report.domainCoverage.es?.['enumerated-values']?.localizedTargetCount ?? 0) >= 2);
    assert.ok((report.domainCoverage.es?.['system-object-datatypes']?.localizedTargetCount ?? 0) >= 5);
    assert.ok((report.domainCoverage.es?.['statements']?.localizedTargetCount ?? 0) >= 3);
    assert.ok((report.domainCoverage.es?.['keywords']?.localizedTargetCount ?? 0) >= 2);
    assert.ok((report.domainCoverage.es?.['reserved-words']?.localizedTargetCount ?? 0) >= 3);
    assert.equal(report.incompleteOverlays.length, 0);
    assert.equal(report.missingFieldsByDomain.length, 0);
    assert.equal(report.invalidParameterTargets.length, 0);
    assert.equal(report.recoveredTargetIds.length, 0);
    assert.equal(report.schemaIssues.length, 0);
    assert.equal(report.orphanOverlays.length, 0);
  });

  test('resolver detecta overlays huerfanos por targetKey inexistente y acepta targetId directo', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        reviewed: false,
        source: 'manual-curated',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen de prueba por targetId.',
        },
      },
      {
        locale: 'es',
        reviewed: false,
        source: 'manual-curated',
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
        reviewed: false,
        source: 'manual-curated',
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
        reviewed: false,
        source: 'manual-curated',
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

  test('resolver recupera overlays cuando targetId queda obsoleto pero targetKey sigue resolviendo', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        reviewed: false,
        source: 'manual-curated',
        targetId: `${absEntry!.id}:stale`,
        targetKey: {
          domain: 'global-functions',
          kind: 'callable',
          namespace: 'powerscript',
          invocation: 'global',
          name: 'Abs',
        },
        text: {
          summary: 'Calcula el valor absoluto de un numero.',
          returnDocumentation: 'Devuelve el valor absoluto.',
        },
        parameters: [
          {
            signatureLabel: 'Abs ( n )',
            parameterName: 'n',
            documentation: 'Numero del que quieres obtener el valor absoluto.',
          },
        ],
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);

    assert.equal(index.orphanOverlays.length, 0);
    assert.equal(index.recoveredTargetIds.length, 1);
    assert.equal(index.recoveredTargetIds[0]?.previousTargetId, `${absEntry!.id}:stale`);
    assert.equal(index.recoveredTargetIds[0]?.targetEntryId, absEntry!.id);
    assert.equal(index.locales.get('es')?.get(absEntry!.id)?.text?.summary, 'Calcula el valor absoluto de un numero.');
  });

  test('schema estricta exige source y reviewed explícitos incluso ante input inválido', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const malformedOverlay = {
      locale: 'es',
      targetId: absEntry!.id,
      text: {
        summary: 'Overlay sin metadata de schema.',
      },
    } as unknown as PbSystemSymbolLocalizationOverlay;

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, [malformedOverlay]);

    assert.deepEqual(index.schemaIssues.map(issue => issue.code), ['missing-reviewed', 'missing-source']);
    assert.ok(PB_SYSTEM_SYMBOL_LOCALIZATION_RESERVED_SCHEMA_FIELDS.includes('examples'));
    assert.ok(PB_SYSTEM_SYMBOL_LOCALIZATION_RESERVED_SCHEMA_FIELDS.includes('provenanceMetadata'));
  });

  test('reviewed true implica sin issues y el reporte agrega missing fields por dominio', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(entry => entry.domain === 'global-functions' && entry.name === 'Abs');
    assert.ok(absEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        reviewed: true,
        source: 'manual-curated',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen revisado pero incompleto.',
        },
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);

    assert.equal(index.incompleteOverlays.length, 1);
    assert.equal(index.schemaIssues.length, 1);
    assert.equal(index.schemaIssues[0]?.code, 'reviewed-with-issues');
    assert.deepEqual(index.missingFieldsByDomain, [
      {
        locale: 'es',
        domain: 'global-functions',
        fieldCounts: {
          parameterDocumentation: 1,
          returnDocumentation: 1,
        },
      },
    ]);
  });
});