import { PbSystemSymbolEntry } from '../types';
import { languageKeyword } from './common';

export const PB_MANUAL_CORE_KEYWORD_CATEGORIES = [
    'Control de flujo',
    'Declaración',
    'Bloque',
    'Invocación',
    'Manejo de errores',
] as const;

export const PB_MANUAL_CORE_KEYWORDS: readonly PbSystemSymbolEntry[] = [
    // — Control de flujo —
    languageKeyword({ name: 'IF', category: 'Control de flujo', summary: 'Evaluación condicional. Requiere THEN y END IF.' }),
    languageKeyword({ name: 'THEN', category: 'Control de flujo', summary: 'Marca el bloque verdadero de un IF.' }),
    languageKeyword({ name: 'ELSE', category: 'Control de flujo', summary: 'Bloque alternativo de un IF.' }),
    languageKeyword({ name: 'ELSEIF', category: 'Control de flujo', summary: 'Condición alternativa encadenada.' }),
    languageKeyword({ name: 'CHOOSE', category: 'Control de flujo', summary: 'Inicio de estructura CHOOSE CASE.', lookupAliases: ['choose case'] }),
    languageKeyword({ name: 'CASE', category: 'Control de flujo', summary: 'Rama dentro de un CHOOSE CASE.' }),
    languageKeyword({ name: 'FOR', category: 'Control de flujo', summary: 'Bucle contado. Requiere NEXT.', lookupAliases: ['for to', 'for to step'] }),
    languageKeyword({ name: 'TO', category: 'Control de flujo', summary: 'Límite superior de un FOR.' }),
    languageKeyword({ name: 'STEP', category: 'Control de flujo', summary: 'Incremento de un FOR.' }),
    languageKeyword({ name: 'NEXT', category: 'Control de flujo', summary: 'Cierre de un bucle FOR.' }),
    languageKeyword({ name: 'DO', category: 'Control de flujo', summary: 'Bucle DO ... WHILE/UNTIL ... LOOP.' }),
    languageKeyword({ name: 'WHILE', category: 'Control de flujo', summary: 'Condición de continuación de un DO.' }),
    languageKeyword({ name: 'UNTIL', category: 'Control de flujo', summary: 'Condición de salida de un DO.' }),
    languageKeyword({ name: 'LOOP', category: 'Control de flujo', summary: 'Cierre de un bucle DO.' }),
    languageKeyword({ name: 'RETURN', category: 'Control de flujo', summary: 'Retorna de una función o subroutine.' }),
    languageKeyword({ name: 'EXIT', category: 'Control de flujo', summary: 'Sale del bucle más interno.' }),
    languageKeyword({ name: 'CONTINUE', category: 'Control de flujo', summary: 'Salta a la siguiente iteración del bucle.' }),
    languageKeyword({ name: 'GOTO', category: 'Control de flujo', summary: 'Salto incondicional a una etiqueta.' }),

    // — Declaración —
    languageKeyword({ name: 'FUNCTION', category: 'Declaración', summary: 'Declara o define una función con valor de retorno.' }),
    languageKeyword({ name: 'SUBROUTINE', category: 'Declaración', summary: 'Declara o define una subroutine (sin retorno).' }),
    languageKeyword({ name: 'EVENT', category: 'Declaración', summary: 'Declara o define un evento.' }),
    languageKeyword({ name: 'ON', category: 'Declaración', summary: 'Implementa un on-handler de evento.' }),
    languageKeyword({ name: 'TYPE', category: 'Declaración', summary: 'Declara un tipo (clase) o un bloque de tipo anidado.' }),
    languageKeyword({ name: 'FROM', category: 'Declaración', summary: 'Especifica el ancestro de un TYPE.' }),
    languageKeyword({ name: 'WITHIN', category: 'Declaración', summary: 'Especifica el contenedor de un TYPE anidado.' }),
    languageKeyword({ name: 'AUTOINSTANTIATE', category: 'Declaración', summary: 'Modificador de tipo: instanciación automática.' }),

    // — Bloque —
    languageKeyword({ name: 'FORWARD', category: 'Bloque', summary: 'Bloque de declaraciones forward.' }),
    languageKeyword({ name: 'PROTOTYPES', category: 'Bloque', summary: 'Bloque de prototipos de funciones/subroutines.' }),
    languageKeyword({ name: 'VARIABLES', category: 'Bloque', summary: 'Bloque de variables de tipo o globales.' }),
    languageKeyword({ name: 'END', category: 'Bloque', summary: 'Cierre de bloque (IF, FOR, FUNCTION, etc.).' }),

    // — Invocación —
    languageKeyword({ name: 'CALL', category: 'Invocación', summary: 'Invoca un evento ancestro explícitamente.' }),
    languageKeyword({ name: 'DYNAMIC', category: 'Invocación', summary: 'Invocación dinámica (late-bound).' }),
    languageKeyword({ name: 'POST', category: 'Invocación', summary: 'Envía un evento de forma asíncrona.' }),
    languageKeyword({ name: 'TRIGGER', category: 'Invocación', summary: 'Dispara un evento de forma síncrona.' }),
    languageKeyword({ name: 'CREATE', category: 'Invocación', summary: 'Instancia un objeto.' }),
    languageKeyword({ name: 'DESTROY', category: 'Invocación', summary: 'Destruye una instancia de objeto.' }),
    languageKeyword({ name: 'OPEN', category: 'Invocación', summary: 'Abre una ventana u hoja.' }),
    languageKeyword({ name: 'CLOSE', category: 'Invocación', summary: 'Cierra una ventana.' }),

    // — Manejo de errores —
    languageKeyword({ name: 'TRY', category: 'Manejo de errores', summary: 'Inicio de bloque de manejo de excepciones.' }),
    languageKeyword({ name: 'CATCH', category: 'Manejo de errores', summary: 'Captura una excepción lanzada.' }),
    languageKeyword({ name: 'FINALLY', category: 'Manejo de errores', summary: 'Bloque de limpieza ejecutado siempre.' }),
    languageKeyword({ name: 'THROW', category: 'Manejo de errores', summary: 'Lanza una excepción.' }),
    languageKeyword({ name: 'THROWS', category: 'Manejo de errores', summary: 'Declara que una función puede lanzar excepciones.' }),
];
