import * as assert from 'assert/strict';
import {
  buildSystemSymbolLocalizationIndex,
  createDocumentationService,
  getDisplayDocumentation,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  getDisplayUsageNotes,
} from '../../../src/server/knowledge/system/localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import type { PbSystemSymbolLocalizationOverlay } from '../../../src/server/knowledge/system/localization';

suite('unit/documentationService (B372)', () => {
  test('prioriza overlay es y mantiene fallback en al texto original', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    assert.ok(absEntry);

    assert.equal(getDisplaySummary(absEntry!, 'es'), 'Calcula el valor absoluto de un numero.');
    assert.equal(getDisplaySummary(absEntry!, 'en'), 'Calculates the absolute value of a number.');
    assert.equal(
      getDisplayDocumentation(absEntry!, 'es'),
      'Usa Abs cuando necesites conservar el tipo numerico y obtener siempre la magnitud positiva del valor.',
    );
    assert.equal(
      getDisplayReturnDocumentation(absEntry!, 'es'),
      'Devuelve el mismo tipo de dato de n con su valor absoluto. Si n es null, devuelve null.',
    );
    assert.equal(
      getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'es'),
      'Numero del que quieres obtener el valor absoluto.',
    );
    assert.equal(
      getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'en'),
      'The number for which you want the absolute value',
    );
  });

  test('mantiene referencias de arrays en fallback y usa el overlay cuando existe', () => {
    const dayNameEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'DayName',
    );
    const fallbackEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated'
        && entry.domain === 'global-functions'
        && !['Abs', 'DayName', 'MessageBox'].includes(entry.name)
        && Array.isArray(entry.usageNotes)
        && entry.usageNotes.length > 0,
    );
    assert.ok(dayNameEntry);
    assert.ok(fallbackEntry);

    assert.strictEqual(getDisplayUsageNotes(dayNameEntry!, 'es'), getDisplayUsageNotes(dayNameEntry!, 'es'));
    assert.strictEqual(getDisplayUsageNotes(fallbackEntry!, 'es'), fallbackEntry!.usageNotes);
  });

  test('expone localization visible del slice built-in adicional sin tocar anchors tecnicos', () => {
    const lenEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Len',
    );
    assert.ok(lenEntry);

    assert.equal(getDisplaySummary(lenEntry!, 'es'), 'Devuelve la longitud de una cadena o blob.');
    assert.equal(
      getDisplayDocumentation(lenEntry!, 'es'),
      'Usa Len para medir texto visible o buffers binarios sin convertir el valor a otro datatype antes de inspeccionarlo.',
    );
    assert.deepEqual(getDisplayUsageNotes(lenEntry!, 'es'), [
      'En strings, Len cuenta caracteres y no incluye el terminador null.',
      'En blobs, el tamano reportado depende de como se haya dimensionado o poblado el valor.',
    ]);
    assert.equal(
      getDisplayParameterDocumentation(lenEntry!, 'Len ( stringorblob )', 'stringorblob', 'es'),
      'Cadena o blob cuya longitud quieres conocer.',
    );
    assert.equal(lenEntry!.name, 'Len');
    assert.equal(lenEntry!.signatures[0]?.label, 'Len ( stringorblob )');
    assert.equal(lenEntry!.signatures[0]?.parameters?.[0]?.label, 'stringorblob');
  });

  test('expone localization visible del slice DataWindow core sobre la entry canonicamente resuelta', () => {
    const setItemStatusEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.domain === 'datawindow-functions'
        && entry.name === 'SetItemStatus'
        && entry.ownerTypes?.includes('datastore'),
    );
    assert.ok(setItemStatusEntry);

    assert.equal(
      getDisplaySummary(setItemStatusEntry!, 'es'),
      'Cambia el estado de modificacion de una fila o de una columna dentro de una fila.',
    );
    assert.equal(
      getDisplayDocumentation(setItemStatusEntry!, 'es'),
      'Usa SetItemStatus para marcar filas o columnas con el estado que Update usara al generar INSERT, UPDATE o DELETE sobre la fila.',
    );
    assert.deepEqual(getDisplayUsageNotes(setItemStatusEntry!, 'es'), [
      'Usa 0 en column para cambiar el estado de toda la fila en lugar de una columna concreta.',
    ]);
    assert.equal(
      getDisplayReturnDocumentation(setItemStatusEntry!, 'es'),
      'Integer. Devuelve 1 si lo consigue y -1 si ocurre un error. Si alguno de los argumentos es null, el metodo devuelve null.',
    );
    assert.equal(
      getDisplayParameterDocumentation(
        setItemStatusEntry!,
        'integer dwcontrol.SetItemStatus ( long row, integer column, dwbuffer dwbuffer, dwitemstatus status )',
        'status',
        'es',
      ),
      'Valor DWItemStatus que determina como Update tratara la fila o la columna al generar SQL.',
    );
    assert.equal(setItemStatusEntry!.name, 'SetItemStatus');
    assert.equal(setItemStatusEntry!.signatures[0]?.label, 'SetItemStatus(row, column, dwbuffer, status)');
  });

  test('expone localization visible del slice enum sin traducir nombres reales ni valores con !', () => {
    const saveAsTypeEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'enumerated-types' && entry.name === 'SaveAsType',
    );
    const primaryValueEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'enumerated-values' && entry.name === 'Primary!',
    );
    assert.ok(saveAsTypeEntry);
    assert.ok(primaryValueEntry);

    assert.equal(getDisplaySummary(saveAsTypeEntry!, 'es'), 'Valores para especificar el formato de los datos que quieres guardar.');
    assert.equal(getDisplaySummary(saveAsTypeEntry!, 'en'), 'Values for specifying a format for data you want to save.');
    assert.equal(
      getDisplayDocumentation(saveAsTypeEntry!, 'es'),
      'Se usa en el metodo SaveAs para elegir el formato de salida al guardar datos de un DataWindow, un control grafico dentro de un DataWindow o un grafico PowerBuilder.',
    );
    assert.equal(getDisplaySummary(primaryValueEntry!, 'es'), 'Selecciona el buffer principal del DataWindow.');
    assert.equal(
      getDisplayDocumentation(primaryValueEntry!, 'es'),
      'Representa las filas activas del DataWindow, es decir, las que no han sido eliminadas ni filtradas, sin traducir el valor enumerado real Primary!.',
    );
    assert.equal(primaryValueEntry!.name, 'Primary!');
  });

  test('expone localization visible del slice system-object-datatypes sin traducir nombres reales', () => {
    const dataStoreEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'system-object-datatypes' && entry.name === 'DataStore',
    );
    const httpClientEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'system-object-datatypes' && entry.name === 'HTTPClient',
    );
    assert.ok(dataStoreEntry);
    assert.ok(httpClientEntry);

    assert.equal(getDisplaySummary(dataStoreEntry!, 'es'), 'DataStore es un control DataWindow no visual.');
    assert.equal(getDisplaySummary(dataStoreEntry!, 'en'), 'A DataStore is a nonvisual DataWindow control.');
    assert.equal(
      getDisplayDocumentation(dataStoreEntry!, 'es'),
      'Funciona como un DataWindow sin interfaz grafica. Comparte la mayor parte del comportamiento de DataWindow, pero muchas propiedades visuales no aplican y las funciones de graficos devuelven error o cadena vacia porque no existe un control grafico visual asociado.',
    );
    assert.equal(
      getDisplaySummary(httpClientEntry!, 'es'),
      'HTTPClient es un objeto base para enviar solicitudes HTTP y recibir respuestas HTTP desde un recurso identificado por una URI.',
    );
    assert.equal(
      getDisplayDocumentation(httpClientEntry!, 'es'),
      'Es mas facil de usar que Inet y soporta mas metodos HTTP y protocolos SSL/TLS. Frente a RESTClient maneja requests mas variados y respuestas jerarquicas, pero no es la mejor opcion para datos grandes si dejas AutoReadData habilitado, no soporta multithreading ni maneja automaticamente redirects HTTP 30X.',
    );
    assert.equal(httpClientEntry!.name, 'HTTPClient');
  });

  test('servicio inyectable cubre overlays por targetId y targetKey', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    const dayNameEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'DayName',
    );
    assert.ok(absEntry);
    assert.ok(dayNameEntry);

    const overlays: readonly PbSystemSymbolLocalizationOverlay[] = [
      {
        locale: 'es',
        reviewed: true,
        source: 'manual-curated',
        targetId: absEntry!.id,
        text: {
          summary: 'Resumen targetId.',
        },
        parameters: [
          {
            signatureLabel: 'Abs ( n )',
            parameterName: 'n',
            documentation: 'Parametro resuelto por targetId.',
          },
        ],
      },
      {
        locale: 'es',
        reviewed: true,
        source: 'manual-curated',
        targetKey: {
          domain: 'global-functions',
          kind: 'callable',
          namespace: 'powerscript',
          invocation: 'global',
          name: 'DayName',
        },
        text: {
          summary: 'Resumen targetKey.',
          usageNotes: ['Uso resuelto por targetKey.'],
        },
      },
    ];

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, overlays);
    const service = createDocumentationService((entryId, locale) => index.locales.get(locale)?.get(entryId));

    assert.equal(service.getDisplaySummary(absEntry!, 'es'), 'Resumen targetId.');
    assert.equal(
      service.getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'es'),
      'Parametro resuelto por targetId.',
    );
    assert.equal(service.getDisplaySummary(dayNameEntry!, 'es'), 'Resumen targetKey.');
    assert.deepEqual(service.getDisplayUsageNotes(dayNameEntry!, 'es'), ['Uso resuelto por targetKey.']);
  });

  test('la localización solo cambia documentación visible y preserva anchors técnicos', () => {
    const absEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(
      entry => entry.dataset === 'generated' && entry.domain === 'global-functions' && entry.name === 'Abs',
    );
    assert.ok(absEntry);

    const overlay: PbSystemSymbolLocalizationOverlay = {
      locale: 'es',
      reviewed: true,
      source: 'manual-curated',
      targetId: absEntry!.id,
      text: {
        summary: 'Resumen visible localizado.',
        documentation: 'Documentación visible localizada.',
        returnDocumentation: 'Retorno visible localizado.',
      },
      parameters: [
        {
          signatureLabel: 'Abs ( n )',
          parameterName: 'n',
          documentation: 'Parametro visible localizado.',
        },
      ],
    };

    const index = buildSystemSymbolLocalizationIndex(PB_SYSTEM_SYMBOL_REGISTRY.entries, [overlay]);
    const service = createDocumentationService((entryId, locale) => index.locales.get(locale)?.get(entryId));

    assert.equal(service.getDisplaySummary(absEntry!, 'es'), 'Resumen visible localizado.');
    assert.equal(service.getDisplayDocumentation(absEntry!, 'es'), 'Documentación visible localizada.');
    assert.equal(service.getDisplayReturnDocumentation(absEntry!, 'es'), 'Retorno visible localizado.');
    assert.equal(service.getDisplayParameterDocumentation(absEntry!, 'Abs ( n )', 'n', 'es'), 'Parametro visible localizado.');
    assert.equal(absEntry!.name, 'Abs');
    assert.equal(absEntry!.normalizedName, 'abs');
    assert.equal(absEntry!.signatures[0]?.label, 'Abs ( n )');
    assert.equal(absEntry!.signatures[0]?.parameters?.[0]?.label, 'n');
    assert.match(absEntry!.sourceUrl ?? '', /abs_func\.html$/);
  });
});