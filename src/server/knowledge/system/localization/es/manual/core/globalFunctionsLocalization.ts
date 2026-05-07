import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Spanish localization for manual core global functions.
 * Reviewed: false - Initial migration from canonical source.
 */
export const globalFunctionsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'MessageBox' },
        text: {
            summary: 'Muestra un cuadro de mensaje y devuelve el botón pulsado.',
        },
        parameters: [
            { signatureLabel: 'MessageBox(title, text, icon?, button?, default?)', parameterName: 'title', documentation: 'Título de la ventana de mensaje.' },
            { signatureLabel: 'MessageBox(title, text, icon?, button?, default?)', parameterName: 'text', documentation: 'Texto principal que se muestra al usuario.' },
            { signatureLabel: 'MessageBox(title, text, icon?, button?, default?)', parameterName: 'icon?', documentation: 'Icono opcional del cuadro de mensaje.' },
            { signatureLabel: 'MessageBox(title, text, icon?, button?, default?)', parameterName: 'button?', documentation: 'Conjunto opcional de botones.' },
            { signatureLabel: 'MessageBox(title, text, icon?, button?, default?)', parameterName: 'default?', documentation: 'Botón por defecto opcional.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Clipboard' },
        text: {
            summary: 'Obtiene o establece el texto del portapapeles.',
            documentation: 'Devuelve o sustituye el contenido textual del portapapeles.'
        },
        parameters: [
            { signatureLabel: 'Clipboard(text)', parameterName: 'text', documentation: 'Texto que se copiará al portapapeles.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Beep' },
        text: { summary: 'Emite el número de pitidos indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TriggerEvent' },
        text: {
            summary: 'Dispara un evento de forma síncrona sobre un objeto.',
        },
        parameters: [
            { signatureLabel: 'TriggerEvent(target, eventName, argumentList?)', parameterName: 'target', documentation: 'Objeto sobre el que se ejecuta el evento.' },
            { signatureLabel: 'TriggerEvent(target, eventName, argumentList?)', parameterName: 'eventName', documentation: 'Nombre del evento que se quiere disparar.' },
            { signatureLabel: 'TriggerEvent(target, eventName, argumentList?)', parameterName: 'argumentList?', documentation: 'Lista opcional de argumentos del evento.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PostEvent' },
        text: {
            summary: 'Encola un evento para ejecutarlo de forma asíncrona.',
        },
        parameters: [
            { signatureLabel: 'PostEvent(target, eventName, argumentList?)', parameterName: 'target', documentation: 'Objeto sobre el que se encola el evento.' },
            { signatureLabel: 'PostEvent(target, eventName, argumentList?)', parameterName: 'eventName', documentation: 'Nombre del evento que se quiere postear.' },
            { signatureLabel: 'PostEvent(target, eventName, argumentList?)', parameterName: 'argumentList?', documentation: 'Lista opcional de argumentos del evento.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsNull' },
        text: { summary: 'Devuelve TRUE si la variable es NULL.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsValid' },
        text: { summary: 'Devuelve TRUE si la variable de objeto referencia un objeto válido.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsNumber' },
        text: {
            summary: 'Determina si una cadena es un número válido.',
            documentation: 'Usa IsNumber para validar la entrada del usuario antes de realizar cálculos o conversiones numéricas.'
        },
        parameters: [{ signatureLabel: 'IsNumber(value)', parameterName: 'value', documentation: 'Cadena que se desea validar como número.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsDate' },
        text: {
            summary: 'Determina si una cadena contiene una fecha válida.',
            documentation: 'Usa IsDate para validar la entrada del usuario antes de intentar convertirla con la función Date().'
        },
        parameters: [{ signatureLabel: 'IsDate(datevalue)', parameterName: 'datevalue', documentation: 'Cadena que se desea validar como fecha.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsTime' },
        text: {
            summary: 'Determina si una cadena contiene una hora válida.',
            documentation: 'Usa IsTime para validar la entrada del usuario antes de intentar convertirla con la función Time().'
        },
        parameters: [{ signatureLabel: 'IsTime(timevalue)', parameterName: 'timevalue', documentation: 'Cadena que se desea validar como hora.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SetNull' },
        text: { summary: 'Asigna NULL a una variable.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Trim' },
        text: {
            summary: 'Elimina los espacios iniciales y finales de una cadena.',
            documentation: 'Usa Trim para limpiar la entrada de datos del usuario. Esta función maneja caracteres Unicode y es la preferida sobre TrimW.'
        },
        parameters: [{ signatureLabel: 'Trim(value)', parameterName: 'value', documentation: 'Cadena que se desea limpiar de espacios.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileReadEx' },
        text: { summary: 'Lee datos desde un archivo abierto y devuelve la cantidad de bytes leídos.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileWriteEx' },
        text: { summary: 'Escribe datos en un archivo abierto y devuelve la cantidad de bytes escritos.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileSeek' },
        text: { summary: 'Reposiciona el puntero de lectura o escritura de un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileSeek64' },
        text: { summary: 'Reposiciona el puntero de lectura o escritura para archivos grandes.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileLength64' },
        text: { summary: 'Devuelve el tamaño de un archivo como longlong.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileEncoding' },
        text: { summary: 'Detecta la codificación de texto de un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PointerX' },
        text: { summary: 'Devuelve la coordenada X actual del puntero del mouse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PointerY' },
        text: { summary: 'Devuelve la coordenada Y actual del puntero del mouse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SetPointer' },
        text: { summary: 'Cambia la forma actual del puntero del mouse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'WorkSpaceHeight' },
        text: { summary: 'Devuelve la altura del área de trabajo disponible en pantalla.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'WorkSpaceWidth' },
        text: { summary: 'Devuelve el ancho del área de trabajo disponible en pantalla.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'WorkSpaceX' },
        text: { summary: 'Devuelve la coordenada X de inicio del área de trabajo disponible en pantalla.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'WorkSpaceY' },
        text: { summary: 'Devuelve la coordenada Y de inicio del área de trabajo disponible en pantalla.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PixelsToUnits' },
        text: { summary: 'Convierte una medida en píxeles a unidades PowerBuilder.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'UnitsToPixels' },
        text: { summary: 'Convierte una medida en unidades PowerBuilder a píxeles.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ChooseColor' },
        text: { summary: 'Muestra el cuadro de diálogo estándar para seleccionar un color.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ShowHelp' },
        text: { summary: 'Muestra un tema de ayuda desde el archivo indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ShowPopupHelp' },
        text: { summary: 'Muestra ayuda contextual emergente en una posición de pantalla.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'OpenURL' },
        text: { summary: 'Abre una URL usando el manejador registrado en el sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceBegin' },
        text: { summary: 'Marca el inicio de una actividad dentro del rastro de ejecución.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceClose' },
        text: { summary: 'Cierra el archivo de tracing actualmente abierto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceDisableActivity' },
        text: { summary: 'Deshabilita el tracing para la actividad indicada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceEnableActivity' },
        text: { summary: 'Habilita el tracing para la actividad indicada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceEnd' },
        text: { summary: 'Marca el final de una actividad dentro del rastro de ejecución.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceError' },
        text: { summary: 'Escribe un mensaje de error en el rastro de ejecución.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceOpen' },
        text: { summary: 'Abre un archivo de tracing y configura el temporizador asociado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TraceUser' },
        text: { summary: 'Escribe un mensaje de usuario en el rastro de ejecución.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PBGetMenuString' },
        text: { summary: 'Recupera el texto de un elemento de menú nativo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Open' },
        text: { summary: 'Abre una ventana, con soporte opcional para un owner o contenedor padre.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Close' },
        text: { summary: 'Cierra la ventana indicada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetFileOpenName' },
        text: { summary: 'Muestra el cuadro de diálogo estándar para seleccionar el archivo que se va a abrir.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetFileSaveName' },
        text: { summary: 'Muestra el cuadro de diálogo estándar para seleccionar el archivo con el que se va a guardar.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetFolder' },
        text: { summary: 'Muestra el cuadro de diálogo estándar para seleccionar una carpeta.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ProfileInt' },
        text: { summary: 'Lee un valor entero de un archivo INI o del registro de Windows.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ProfileString' },
        text: { summary: 'Lee un valor de un archivo INI.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SetProfileString' },
        text: { summary: 'Escribe un valor en un archivo INI.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RGB' },
        text: { summary: 'Devuelve un long que representa un color.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'KeyDown' },
        text: { summary: 'Devuelve TRUE si la tecla indicada está pulsada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Idle' },
        text: { summary: 'Establece el tiempo antes de que se dispare el evento Idle.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Yield' },
        text: { summary: 'Permite que el sistema procese mensajes pendientes.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Run' },
        text: { summary: 'Ejecuta un programa externo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'OpenWithParm' },
        text: { summary: 'Abre una ventana pasando un parámetro inicial.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'CloseWithReturn' },
        text: { summary: 'Cierra una ventana devolviendo un valor al llamador.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Restart' },
        text: { summary: 'Reinicia la aplicación PowerBuilder.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Cpu' },
        text: { summary: 'Devuelve el tiempo de CPU usado por la aplicación en milisegundos.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DBHandle' },
        text: { summary: 'Devuelve el handle nativo asociado a una conexión de base de datos.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DebugBreak' },
        text: { summary: 'Fuerza una interrupción para depuración cuando hay un depurador disponible.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GarbageCollect' },
        text: { summary: 'Solicita la liberación de memoria de objetos no referenciados.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GarbageCollectGetTimeLimit' },
        text: { summary: 'Devuelve el límite de tiempo actual usado por el recolector de basura.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GarbageCollectSetTimeLimit' },
        text: { summary: 'Configura el límite de tiempo usado por el recolector de basura.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Sleep' },
        text: { summary: 'Suspende la ejecución durante el intervalo indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Timer' },
        text: { summary: 'Devuelve el valor actual del temporizador del sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'CommandParm' },
        text: { summary: 'Devuelve los parámetros de línea de comandos pasados a la aplicación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetEnvironment' },
        text: { summary: 'Carga información del sistema operativo, procesador y pantalla en un objeto Environment.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetInstalledRuntimes' },
        text: { summary: 'Devuelve las versiones de PowerBuilder Runtime instaladas en el equipo actual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IsRunningAsSolution' },
        text: { summary: 'Indica si la aplicación actual se está ejecutando como solución y no como workspace.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'AddToLibraryList' },
        text: { summary: 'Añade una biblioteca PBL o PBD a la library list activa de la aplicación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetLibraryList' },
        text: { summary: 'Devuelve la library list activa de la aplicación como una cadena separada por comas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SetLibraryList' },
        text: { summary: 'Sustituye la library list activa de la aplicación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RegistryDelete' },
        text: { summary: 'Elimina una clave o un valor de la rama indicada del registro de Windows.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RegistryGet' },
        text: { summary: 'Lee un valor del registro de Windows en una variable PowerBuilder compatible.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RegistryKeys' },
        text: { summary: 'Obtiene la lista de subclaves inmediatas bajo una clave del registro de Windows.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RegistrySet' },
        text: { summary: 'Escribe o actualiza un valor en el registro de Windows.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RegistryValues' },
        text: { summary: 'Obtiene la lista de nombres de valor definidos para una clave del registro de Windows.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TypeOf' },
        text: { summary: 'Devuelve el tipo de un objeto PowerBuilder.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ClassName' },
        text: { summary: 'Devuelve el nombre de clase del objeto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Handle' },
        text: { summary: 'Devuelve el handle nativo asociado al objeto visual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetApplication' },
        text: { summary: 'Devuelve una referencia al objeto Application.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetFocus' },
        text: { summary: 'Devuelve el objeto que tiene actualmente el foco.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PopulateError' },
        text: { summary: 'Rellena las propiedades del objeto Error.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SignalError' },
        text: { summary: 'Dispara el evento SystemError.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileOpen' },
        text: { summary: 'Abre un archivo y devuelve un descriptor.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileClose' },
        text: { summary: 'Cierra un archivo abierto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileRead' },
        text: { summary: 'Lee datos desde un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileWrite' },
        text: { summary: 'Escribe datos en un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileExists' },
        text: { summary: 'Devuelve TRUE si el archivo existe.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileCopy' },
        text: { summary: 'Copia un archivo a una nueva ubicación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileDelete' },
        text: { summary: 'Elimina un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileMove' },
        text: { summary: 'Mueve o renombra un archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FileLength' },
        text: { summary: 'Devuelve el tamaño de un archivo en bytes.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'GetCurrentDirectory' },
        text: { summary: 'Devuelve el directorio de trabajo actual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ChangeDirectory' },
        text: { summary: 'Cambia el directorio de trabajo actual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DirectoryExists' },
        text: { summary: 'Devuelve TRUE si el directorio existe.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'CreateDirectory' },
        text: { summary: 'Crea un directorio.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RemoveDirectory' },
        text: { summary: 'Elimina un directorio vacío.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Abs' },
        text: { summary: 'Devuelve el valor absoluto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ACos' },
        text: { summary: 'Devuelve el arcocoseno del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ASin' },
        text: { summary: 'Devuelve el arcoseno del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ATan' },
        text: { summary: 'Devuelve la arcotangente del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Ceiling' },
        text: { summary: 'Redondea un número hacia el entero inmediato superior.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Round' },
        text: { summary: 'Redondea un número al número de decimales indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Mod' },
        text: { summary: 'Devuelve el resto de una división.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Sqrt' },
        text: { summary: 'Devuelve la raíz cuadrada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Max' },
        text: { summary: 'Devuelve el mayor de dos números.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Min' },
        text: { summary: 'Devuelve el menor de dos números.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Log' },
        text: { summary: 'Devuelve el logaritmo natural del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LogTen' },
        text: { summary: 'Devuelve el logaritmo en base 10 del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Exp' },
        text: { summary: 'Devuelve la exponencial del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Fact' },
        text: { summary: 'Devuelve el factorial del número indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Sin' },
        text: { summary: 'Devuelve el seno del ángulo indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Cos' },
        text: { summary: 'Devuelve el coseno del ángulo indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Tan' },
        text: { summary: 'Devuelve la tangente del ángulo indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Sign' },
        text: { summary: 'Devuelve el signo del número indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Truncate' },
        text: { summary: 'Trunca un número sin redondearlo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Rand' },
        text: { summary: 'Devuelve un entero pseudoaleatorio.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Randomize' },
        text: { summary: 'Inicializa la semilla del generador pseudoaleatorio.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Pi' },
        text: { summary: 'Devuelve el valor de la constante pi.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Today' },
        text: { summary: 'Devuelve la fecha actual del sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Now' },
        text: { summary: 'Devuelve la fecha y hora actual del sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Year' },
        text: { summary: 'Devuelve el año de una fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Month' },
        text: { summary: 'Devuelve el mes de una fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Day' },
        text: { summary: 'Devuelve el día de una fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DayName' },
        text: { summary: 'Devuelve el nombre del día de la semana de una fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DayNumber' },
        text: { summary: 'Devuelve el número del día de la semana de una fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DaysAfter' },
        text: { summary: 'Devuelve los días transcurridos entre dos fechas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Hour' },
        text: { summary: 'Devuelve la hora de un valor temporal.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Minute' },
        text: { summary: 'Devuelve los minutos de un valor temporal.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Second' },
        text: { summary: 'Devuelve los segundos de un valor temporal.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'SecondsAfter' },
        text: { summary: 'Devuelve la diferencia en segundos entre dos valores temporales.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RelativeDate' },
        text: { summary: 'Devuelve una fecha desplazada un número de días respecto a otra fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RelativeTime' },
        text: { summary: 'Devuelve una hora desplazada un número de segundos respecto a otra hora.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'String' },
        text: {
            summary: 'Convierte un valor a su representación en cadena.',
            documentation: 'Usa String para convertir valores numéricos, fechas o blobs en texto formateado.',
            returnDocumentation: 'String. Devuelve el valor convertido o cadena vacía si falla.'
        },
        parameters: [
            { signatureLabel: 'String(value)', parameterName: 'value', documentation: 'Valor que se desea convertir.' },
            { signatureLabel: 'String(value, format)', parameterName: 'value', documentation: 'Valor que se desea convertir.' },
            { signatureLabel: 'String(value, format)', parameterName: 'format', documentation: 'Máscara de formato (opcional).' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Integer' },
        text: {
            summary: 'Convierte un valor a tipo Integer.',
            documentation: 'Usa Integer para convertir valores numéricos o de cadena a un entero de 16 bits.',
            returnDocumentation: 'Integer. Devuelve el valor convertido o 0 si falla.'
        },
        parameters: [{ signatureLabel: 'Integer(value)', parameterName: 'value', documentation: 'Valor que se desea convertir.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Long' },
        text: {
            summary: 'Convierte un valor a tipo Long.',
            documentation: 'Usa Long para convertir valores a un entero de 32 bits.',
            returnDocumentation: 'Long. Devuelve el valor convertido o 0 si falla.'
        },
        parameters: [{ signatureLabel: 'Long(value)', parameterName: 'value', documentation: 'Valor que se desea convertir.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Double' },
        text: {
            summary: 'Convierte un valor a tipo Double.',
            documentation: 'Usa Double cuando necesites trabajar con números de punto flotante de 64 bits.',
            returnDocumentation: 'Double. Devuelve el valor convertido o 0 si falla.'
        },
        parameters: [{ signatureLabel: 'Double(value)', parameterName: 'value', documentation: 'Valor que se desea convertir a Double.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Real' },
        text: {
            summary: 'Convierte un valor a tipo Real.',
            documentation: 'Usa Real cuando necesites trabajar con números de punto flotante de 32 bits.',
            returnDocumentation: 'Real. Devuelve el valor convertido o 0 si falla.'
        },
        parameters: [{ signatureLabel: 'Real(value)', parameterName: 'value', documentation: 'Valor que se desea convertir a Real.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Dec' },
        text: {
            summary: 'Convierte un valor a tipo Decimal.',
            documentation: 'Usa Dec para asegurar precisión decimal en cálculos financieros o conversiones de texto a moneda.',
            returnDocumentation: 'Decimal. Devuelve el valor convertido o 0 si falla.'
        },
        parameters: [{ signatureLabel: 'Dec(value)', parameterName: 'value', documentation: 'Valor que se desea convertir a Decimal.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Date' },
        text: {
            summary: 'Convierte un valor a tipo Date.',
            documentation: 'Usa Date para extraer la parte de fecha de un DateTime o para convertir una representación de texto válida en un objeto de fecha.',
            returnDocumentation: 'Date. Devuelve la fecha o 1900-01-01 si falla.'
        },
        parameters: [{ signatureLabel: 'Date(value)', parameterName: 'value', documentation: 'Cadena o DateTime que se desea convertir a fecha.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Time' },
        text: {
            summary: 'Convierte un valor a tipo Time.',
            documentation: 'Usa Time para extraer la parte de hora de un DateTime o para convertir una representación de texto de hora en un objeto de tiempo.',
            returnDocumentation: 'Time. Devuelve la hora o 00:00:00 si falla.'
        },
        parameters: [{ signatureLabel: 'Time(value)', parameterName: 'value', documentation: 'Cadena o DateTime que se desea convertir a hora.' }]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Blob' },
        text: { summary: 'Convierte un valor a blob.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'BlobMid' },
        text: { summary: 'Extrae una porción de un blob a partir de una posición dada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IntHigh' },
        text: { summary: 'Extrae la mitad alta de un valor entero compuesto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'IntLow' },
        text: { summary: 'Extrae la mitad baja de un valor entero compuesto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ToAnsi' },
        text: { summary: 'Convierte un valor textual a una representación ANSI.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ToUnicode' },
        text: { summary: 'Convierte un valor textual a una representación Unicode.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LeftTrim' },
        text: { summary: 'Elimina los espacios al inicio de una cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RightTrim' },
        text: { summary: 'Elimina los espacios al final de una cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Left' },
        text: { summary: 'Devuelve los caracteres más a la izquierda.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Right' },
        text: { summary: 'Devuelve los caracteres más a la derecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Mid' },
        text: { summary: 'Devuelve caracteres desde una posición intermedia.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Len' },
        text: { summary: 'Devuelve la longitud de una cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Pos' },
        text: { summary: 'Devuelve la posición de un fragmento dentro de una cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LastPos' },
        text: { summary: 'Devuelve la última aparición de una subcadena dentro de otra cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Match' },
        text: { summary: 'Comprueba si una cadena coincide con un patrón de texto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Upper' },
        text: { summary: 'Convierte el texto a mayúsculas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Lower' },
        text: { summary: 'Convierte el texto a minúsculas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'WordCap' },
        text: { summary: 'Convierte la primera letra de cada palabra a mayúscula y el resto a minúsculas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Replace' },
        text: { summary: 'Sustituye caracteres a partir de una posición dada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Space' },
        text: { summary: 'Devuelve una cadena compuesta por espacios.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Fill' },
        text: { summary: 'Construye una cadena de la longitud indicada repitiendo los caracteres dados.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Asc' },
        text: { summary: 'Devuelve el valor numérico del primer carácter.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Char' },
        text: { summary: 'Construye un carácter a partir de su código numérico.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Length' },
        text: { summary: 'Devuelve la longitud lógica del valor indicado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Reverse' },
        text: { summary: 'Invierte el orden de los caracteres de una cadena.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LenW' },
        text: { 
            summary: 'Versión heredada Unicode de Len.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LeftTrimW' },
        text: { 
            summary: 'Versión heredada Unicode de LeftTrim.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RightTrimW' },
        text: { 
            summary: 'Versión heredada Unicode de RightTrim.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LeftW' },
        text: { 
            summary: 'Versión heredada Unicode de Left.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'RightW' },
        text: { 
            summary: 'Versión heredada Unicode de Right.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'MidW' },
        text: { 
            summary: 'Versión heredada Unicode de Mid.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'PosW' },
        text: { 
            summary: 'Versión heredada Unicode de Pos.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'MatchW' },
        text: { 
            summary: 'Versión heredada Unicode de Match.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'FillW' },
        text: { 
            summary: 'Versión heredada Unicode de Fill.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'ReplaceW' },
        text: { 
            summary: 'Versión heredada Unicode de Replace.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'TrimW' },
        text: { 
            summary: 'Versión heredada Unicode de Trim.',
            obsoleteMessage: 'La familia *W quedó obsoleta en favor de las funciones Unicode estándar.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'UpperBound' },
        text: {
            summary: 'Devuelve el límite superior de la dimensión indicada de un array.',
            documentation: 'Usa UpperBound para conocer el tamaño actual de un array dinámico o el límite superior de uno fijo antes de iterar sobre él.'
        },
        parameters: [
            { signatureLabel: 'UpperBound(array, dimension?)', parameterName: 'array', documentation: 'El array del que quieres conocer el límite superior.' },
            { signatureLabel: 'UpperBound(array, dimension?)', parameterName: 'dimension?', documentation: 'La dimensión del array (por defecto 1).' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'LowerBound' },
        text: {
            summary: 'Devuelve el límite inferior de la dimensión indicada de un array.',
            documentation: 'Aunque la mayoría de los arrays en PowerBuilder comienzan en 1, LowerBound permite verificar el inicio real en arrays con límites personalizados.'
        },
        parameters: [
            { signatureLabel: 'LowerBound(array, dimension?)', parameterName: 'array', documentation: 'El array del que quieres conocer el límite inferior.' },
            { signatureLabel: 'LowerBound(array, dimension?)', parameterName: 'dimension?', documentation: 'La dimensión del array (por defecto 1).' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'DateTime' },
        text: {
            summary: 'Combina un valor Date y un valor Time en un valor de tipo DateTime.',
            documentation: 'Usa DateTime cuando necesites una estampa de tiempo completa que combine componentes de fecha y hora separados.'
        },
        parameters: [
            { signatureLabel: 'DateTime(date, time)', parameterName: 'date', documentation: 'La parte de fecha del nuevo DateTime.' },
            { signatureLabel: 'DateTime(date, time)', parameterName: 'time', documentation: 'La parte de hora del nuevo DateTime.' }
        ]
    }
];

