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
        documentation: 'Variable o expresion cuyo valor quieres comprobar para saber si es null.',
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
        signatureLabel: 'SetNull ( anyvariable )',
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
        signatureLabel: 'Lower ( string )',
        parameterName: 'string',
        documentation: 'Cadena que quieres convertir a minusculas.',
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
        signatureLabel: 'Upper ( string )',
        parameterName: 'string',
        documentation: 'Cadena que quieres convertir a mayusculas.',
      },
    ],
  },
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'datawindow-functions',
      kind: 'callable',
      namespace: 'datawindow',
      invocation: 'member',
      name: 'Describe',
      ownerTypes: ['datastore', 'datawindow', 'datawindowchild'],
    },
    text: {
      summary: 'Lee propiedades del DataWindow y puede evaluar expresiones painter cuando la property list es literal y defendible.',
      documentation: 'Usa Describe para inspeccionar metadata, property paths o expresiones Evaluate(...) sin modificar el objeto; cuando la property list es literal, el plugin puede enlazarla con evidencia del DataWindow.',
      usageNotes: [
        'Si algun item de propertylist es invalido, Describe devuelve ! para ese item e ignora el resto de la lista.',
        'Si una propiedad no tiene valor, Describe devuelve ?; cuando el valor real contiene ! o ?, PowerBuilder lo devuelve entre comillas.',
      ],
      returnDocumentation: 'String. Devuelve un valor por cada propiedad o Evaluate(...) solicitado, separado por saltos de linea. Si propertylist es null, Describe devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'string dwcontrol.Describe ( string propertylist )',
        parameterName: 'propertylist',
        documentation: 'Lista separada por espacios de propiedades o expresiones Evaluate(...) que quieres consultar.',
      },
    ],
  },
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'datawindow-functions',
      kind: 'callable',
      namespace: 'datawindow',
      invocation: 'member',
      name: 'Retrieve',
      ownerTypes: ['datastore', 'datawindow', 'datawindowchild'],
    },
    text: {
      summary: 'Recupera filas desde la fuente de datos usando los retrieve arguments definidos y un transaction binding valido.',
      documentation: 'Usa Retrieve para poblar el buffer primario del DataWindow, DataStore o DataWindowChild con los argumentos declarados por el DataObject y el transaction binding activo.',
      usageNotes: [
        'Si el DataWindow no tiene DataObject asignado, Retrieve devuelve -1.',
        'Si la fuente de datos es External, Retrieve devuelve -1 y debes poblar el objeto con otro mecanismo.',
      ],
      returnDocumentation: 'Long. Devuelve el numero de filas visibles en el buffer primario si la llamada tiene exito o -1 si falla.',
    },
    parameters: [
      {
        signatureLabel: 'Retrieve(argument...)',
        parameterName: 'argument...',
        documentation: 'Valores que satisfacen los retrieve arguments declarados por el DataWindow, DataStore o DataWindowChild.',
      },
    ],
  },
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'datawindow-functions',
      kind: 'callable',
      namespace: 'datawindow',
      invocation: 'member',
      name: 'SetItemStatus',
      ownerTypes: ['datastore', 'datawindow', 'datawindowchild'],
    },
    text: {
      summary: 'Cambia el estado de modificacion de una fila o de una columna dentro de una fila.',
      documentation: 'Usa SetItemStatus para marcar filas o columnas con el estado que Update usara al generar INSERT, UPDATE o DELETE sobre la fila.',
      usageNotes: [
        'Usa 0 en column para cambiar el estado de toda la fila en lugar de una columna concreta.',
      ],
      returnDocumentation: 'Integer. Devuelve 1 si lo consigue y -1 si ocurre un error. Si alguno de los argumentos es null, el metodo devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, integer column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'row',
        documentation: 'Fila cuyo estado quieres ajustar dentro del DataWindow, DataStore o DataWindowChild.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, integer column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'column',
        documentation: 'Columna cuyo estado quieres cambiar; usa 0 para aplicar el estado a toda la fila.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, integer column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'dwbuffer',
        documentation: 'Buffer que contiene la fila cuyo estado quieres modificar.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, integer column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'status',
        documentation: 'Valor DWItemStatus que determina como Update tratara la fila o la columna al generar SQL.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, string column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'row',
        documentation: 'Fila cuyo estado quieres ajustar dentro del DataWindow, DataStore o DataWindowChild.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, string column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'column',
        documentation: 'Columna cuyo estado quieres cambiar; usa 0 para aplicar el estado a toda la fila.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, string column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'dwbuffer',
        documentation: 'Buffer que contiene la fila cuyo estado quieres modificar.',
      },
      {
        signatureLabel: 'integer dwcontrol.SetItemStatus ( long row, string column, dwbuffer dwbuffer, dwitemstatus status )',
        parameterName: 'status',
        documentation: 'Valor DWItemStatus que determina como Update tratara la fila o la columna al generar SQL.',
      },
    ],
  },
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'datawindow-functions',
      kind: 'callable',
      namespace: 'datawindow',
      invocation: 'member',
      name: 'SetTransObject',
      ownerTypes: ['datastore', 'datawindow', 'datawindowchild'],
    },
    text: {
      summary: 'Asocia un transaction object explicito para que el codigo llamador controle CONNECT, COMMIT y ROLLBACK.',
      documentation: 'Usa SetTransObject cuando quieras que el DataWindow, DataStore o DataWindowChild reutilice un transaction object administrado por tu codigo en lugar del interno.',
      usageNotes: [
        'Tras llamar a SetTransObject, el codigo llamador sigue siendo responsable de CONNECT, COMMIT y ROLLBACK sobre ese transaction object.',
      ],
      returnDocumentation: 'Integer. Devuelve 1 si la asociacion se realiza correctamente y -1 si ocurre un error. Si transaction es null, el metodo devuelve null.',
    },
    parameters: [
      {
        signatureLabel: 'integer dwcontrol.SetTransObject ( transaction transaction )',
        parameterName: 'transaction',
        documentation: 'Transaction object que quieres reutilizar para Retrieve y Update con control transaccional explicito.',
      },
    ],
  },
  {
    locale: 'es',
    reviewed: true,
    source: 'manual-curated',
    targetKey: {
      domain: 'datawindow-functions',
      kind: 'callable',
      namespace: 'datawindow',
      invocation: 'member',
      name: 'Update',
      ownerTypes: ['datastore', 'datawindow', 'datawindowchild'],
    },
    text: {
      summary: 'Envia a la base de datos los cambios acumulados en el DataWindow y depende del transaction binding activo.',
      documentation: 'Usa Update para persistir los cambios acumulados en el DataWindow, DataStore o DataWindowChild con el transaction binding activo y la politica de AcceptText elegida.',
      usageNotes: [
        'Si accept es true, PowerBuilder ejecuta AcceptText antes del update.',
        'Si resetflag es false, las marcas de update se conservan para escenarios con commit o rollback manual.',
      ],
      returnDocumentation: 'Integer. Devuelve 1 si la actualizacion termina correctamente y -1 si ocurre un error. Si no hay DataWindow object asignado al control o DataStore, Update devuelve 1.',
    },
    parameters: [
      {
        signatureLabel: 'Update(accept?, resetflag?)',
        parameterName: 'accept?',
        documentation: 'True ejecuta AcceptText antes del update; False deja ese paso bajo control explicito del caller.',
      },
      {
        signatureLabel: 'Update(accept?, resetflag?)',
        parameterName: 'resetflag?',
        documentation: 'True limpia las marcas de update despues de persistir; False las conserva para flujos de commit o rollback manual.',
      },
    ],
  },
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];