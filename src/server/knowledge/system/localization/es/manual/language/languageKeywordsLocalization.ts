import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para palabras clave del lenguaje.
 */
export const languageKeywordsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'IF' },
        text: { summary: 'Evaluación condicional. Requiere THEN y END IF.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'THEN' },
        text: { summary: 'Marca el bloque verdadero de un IF.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'ELSE' },
        text: { summary: 'Bloque alternativo de un IF.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'ELSEIF' },
        text: { summary: 'Condición alternativa encadenada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CHOOSE' },
        text: { summary: 'Inicio de estructura CHOOSE CASE.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CASE' },
        text: { summary: 'Rama dentro de un CHOOSE CASE.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'FOR' },
        text: { summary: 'Bucle contado. Requiere NEXT.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'TO' },
        text: { summary: 'Límite superior de un FOR.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'STEP' },
        text: { summary: 'Incremento de un FOR.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'NEXT' },
        text: { summary: 'Cierre de un bucle FOR.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'DO' },
        text: { summary: 'Bucle DO ... WHILE/UNTIL ... LOOP.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'WHILE' },
        text: { summary: 'Condición de continuación de un DO.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'UNTIL' },
        text: { summary: 'Condición de salida de un DO.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'LOOP' },
        text: { summary: 'Cierre de un bucle DO.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'RETURN' },
        text: { summary: 'Retorna de una función o subroutine.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'EXIT' },
        text: { summary: 'Sale del bucle más interno.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CONTINUE' },
        text: { summary: 'Salta a la siguiente iteración del bucle.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'GOTO' },
        text: { summary: 'Salto incondicional a una etiqueta.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'FUNCTION' },
        text: { summary: 'Declara o define una función con valor de retorno.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'SUBROUTINE' },
        text: { summary: 'Declara o define una subroutine (sin retorno).' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'EVENT' },
        text: { summary: 'Declara o define un evento.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'ON' },
        text: { summary: 'Implementa un on-handler de evento.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'TYPE' },
        text: { summary: 'Declara un tipo (clase) o un bloque de tipo anidado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'FROM' },
        text: { summary: 'Especifica el ancestro de un TYPE.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'WITHIN' },
        text: { summary: 'Especifica el contenedor de un TYPE anidado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'AUTOINSTANTIATE' },
        text: { summary: 'Modificador de tipo: instanciación automática.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'FORWARD' },
        text: { summary: 'Bloque de declaraciones forward.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'PROTOTYPES' },
        text: { summary: 'Bloque de prototipos de funciones/subroutines.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'VARIABLES' },
        text: { summary: 'Bloque de variables de tipo o globales.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'END' },
        text: { summary: 'Cierre de bloque (IF, FOR, FUNCTION, etc.).' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CALL' },
        text: { summary: 'Invoca un evento ancestro explícitamente.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'DYNAMIC' },
        text: { summary: 'Invocación dinámica (late-bound).' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'POST' },
        text: { summary: 'Envía un evento de forma asíncrona.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'TRIGGER' },
        text: { summary: 'Dispara un evento de forma síncrona.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CREATE' },
        text: { summary: 'Instancia un objeto.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'DESTROY' },
        text: { summary: 'Destruye una instancia de objeto.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'OPEN' },
        text: { summary: 'Abre una ventana u hoja.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CLOSE' },
        text: { summary: 'Cierra una ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'TRY' },
        text: { summary: 'Inicio de bloque de manejo de excepciones.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'CATCH' },
        text: { summary: 'Captura una excepción lanzada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'FINALLY' },
        text: { summary: 'Bloque de limpieza ejecutado siempre.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'THROW' },
        text: { summary: 'Lanza una excepción.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'keywords', kind: 'keyword', namespace: 'powerscript', invocation: 'global', name: 'THROWS' },
        text: { summary: 'Declara que una función puede lanzar excepciones.' },
    },
];
