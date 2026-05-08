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
        signatureLabel: 'DayName(date)',
        parameterName: 'date',
        documentation: 'Fecha de la que quieres conocer el nombre del día.',
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
      summary: 'Muestra un cuadro de mensaje y devuelve el botón pulsado.',
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
        signatureLabel: 'MessageBox(title, text, icon, button, default)',
        parameterName: 'title',
        documentation: 'Título de la ventana de mensaje.',
      },
      {
        signatureLabel: 'MessageBox(title, text, icon, button, default)',
        parameterName: 'text',
        documentation: 'Texto principal que se muestra al usuario.',
      },
      {
        signatureLabel: 'MessageBox(title, text, icon, button, default)',
        parameterName: 'icon',
        documentation: 'Icono opcional del cuadro de mensaje.',
      },
      {
        signatureLabel: 'MessageBox(title, text, icon, button, default)',
        parameterName: 'button',
        documentation: 'Conjunto opcional de botones.',
      },
      {
        signatureLabel: 'MessageBox(title, text, icon, button, default)',
        parameterName: 'default',
        documentation: 'Botón por defecto opcional.',
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
      name: 'IsNull',
    },
    text: {
      summary: 'Indica si una variable o expresion contiene null.',
      documentation: 'Usa IsNull para validar entradas del usuario, resultados recuperados o valores intermedios antes de seguir con logica que no acepta null.',
      usageNotes: [
        'En validaciones de datos recuperados, IsNull evita tratar null como si fuera un valor real.',
        'Para asignar null de forma explicita a una variable, usa SetNull antes de volver a evaluarla con IsNull.',
      ],
      returnDocumentation: 'Boolean. Devuelve true si any es null y false en caso contrario.',
    },
    parameters: [
      {
        signatureLabel: 'IsNull ( any )',
        parameterName: 'any',
        documentation: 'Variable o expresion que quieres verificar si es NULL.',
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
      name: 'SetNull',
    },
    text: {
      summary: 'Asigna null a una variable compatible.',
      documentation: 'Usa SetNull cuando necesites propagar un null real hacia validaciones, DataWindow o persistencia sin inventar valores centinela.',
      usageNotes: [
        'PowerBuilder no inicializa las variables a null por defecto; SetNull hace explicita esa intencion.',
        'Si la variable es Any, el valor queda en null pero conserva el tipo subyacente que ya tenia asignado.',
      ],
      returnDocumentation: 'Integer. Devuelve 1 si lo consigue y -1 si ocurre un error. Si anyvariable es null, SetNull devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'SetNull(anyvariable)',
        parameterName: 'anyvariable',
        documentation: 'Variable compatible que quieres dejar explicitamente en null.',
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
      name: 'Len',
    },
    text: {
      summary: 'Devuelve la longitud de una cadena o blob.',
      documentation: 'Usa Len para medir texto visible o buffers binarios sin convertir el valor a otro datatype antes de inspeccionarlo.',
      usageNotes: [
        'En strings, Len cuenta caracteres y no incluye el terminador null.',
        'En blobs, el tamano reportado depende de como se haya dimensionado o poblado el valor.',
      ],
      returnDocumentation: 'Long. Devuelve la longitud de stringorblob o -1 si ocurre un error. Si stringorblob es null, Len devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'Len ( stringorblob )',
        parameterName: 'stringorblob',
        documentation: 'Cadena o blob cuya longitud quieres conocer.',
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
      name: 'Lower',
    },
    text: {
      summary: 'Convierte todos los caracteres de una cadena a minusculas.',
      documentation: 'Usa Lower para normalizar comparaciones o busquedas sin cambiar el valor original salvo por el casing devuelto.',
      returnDocumentation: 'String. Devuelve string con las letras mayusculas convertidas a minusculas. Si string es null, Lower devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'Lower(value)',
        parameterName: 'value',
        documentation: 'Cadena que quieres convertir a minúsculas.',
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
      name: 'Upper',
    },
    text: {
      summary: 'Convierte todos los caracteres de una cadena a mayusculas.',
      documentation: 'Usa Upper para normalizar comparaciones o salidas visibles cuando necesitas una representacion estable en mayusculas.',
      returnDocumentation: 'String. Devuelve string con las letras minusculas convertidas a mayusculas. Si string es null, Upper devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'Upper(value)',
        parameterName: 'value',
        documentation: 'Cadena que quieres convertir a mayúsculas.',
      },
    ],
  },
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];