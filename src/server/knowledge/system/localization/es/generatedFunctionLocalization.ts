import type { PbSystemSymbolLocalizationOverlay } from '../types';

export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_GENERATED_FUNCTIONS = [
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'global-functions',
      kind: 'callable',
      namespace: 'powerscript',
      invocation: 'global',
      name: 'Abs',
    },
    text: {
      summary: 'Calcula el valor absoluto de un numero.',
      documentation: 'Usa Abs cuando necesites conservar el tipo numerico y obtener siempre la magnitud positiva del valor.',
      returnDocumentation: 'Devuelve el mismo tipo de dato de n con su valor absoluto. Si n es null, devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'Abs ( n )',
        parameterName: 'n',
        documentation: 'Numero del que quieres obtener el valor absoluto.',
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
      summary: 'Obtiene el nombre del dia de la semana a partir de una fecha.',
      documentation: 'Devuelve el nombre visible del dia correspondiente a la fecha indicada sin modificar el valor original.',
      usageNotes: [
        'El texto devuelto depende de los runtime files localizados disponibles en la maquina donde se ejecuta la aplicacion.',
        'Si no hay overlay visible para una feature, el plugin debe mantener el texto oficial original en ingles como fallback.',
      ],
      returnDocumentation: 'String. Devuelve el nombre del dia asociado a date. Si date es null, devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'DayName ( date )',
        parameterName: 'date',
        documentation: 'Fecha cuyo nombre de dia quieres obtener.',
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
      name: 'MessageBox',
    },
    text: {
      summary: 'Muestra un cuadro de mensaje del sistema con el titulo, texto, icono y botones indicados.',
      documentation: 'Utiliza MessageBox para interacciones bloqueantes y visibles del usuario; no cambia la semantica oficial del simbolo ni sus nombres reales.',
      usageNotes: [
        'Evita usarlo en rutas de cambio de foco sensibles porque la ventana captura la atencion del usuario.',
      ],
      limitations: [
        'La interfaz sigue siendo modal para el usuario mientras el cuadro de dialogo este abierto.',
      ],
      returnDocumentation: 'Integer. Devuelve el boton seleccionado si la llamada termina correctamente o -1 si ocurre un error.',
    },
    parameters: [
      {
        signatureLabel: 'MessageBox ( title, text {, icon {, button {, default } } } )',
        parameterName: 'title',
        documentation: 'Titulo visible en la barra del cuadro de mensaje.',
      },
    ],
  },
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];