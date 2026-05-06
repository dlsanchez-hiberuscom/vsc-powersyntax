import type { PbSystemSymbolLocalizationOverlay } from '../types';

export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_GENERATED_STATEMENTS = [
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'statements',
			kind: 'statement',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'IF...THEN',
		},
		text: {
			summary: 'Estructura de control que ejecuta una accion cuando una condicion indicada es verdadera.',
			documentation: 'Usa la sintaxis de una sola linea para decisiones breves y la multilinea cuando necesites varias instrucciones o ramas ELSE/ELSEIF. El flujo entra en la primera rama cuya condicion resulte verdadera.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'statements',
			kind: 'statement',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'CHOOSE CASE',
		},
		text: {
			summary: 'Estructura de control que dirige la ejecucion segun el valor de una expresion de prueba.',
			documentation: 'Conviene cuando varias ramas dependen del mismo valor y quieres evitar cadenas largas de IF...ELSEIF. CASE ELSE actua como fallback cuando ningun CASE coincide.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'statements',
			kind: 'statement',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'FOR...NEXT',
		},
		text: {
			summary: 'Iteracion numerica que ejecuta uno o mas statements un numero determinado de veces.',
			documentation: 'Usa FOR...NEXT cuando conoces el rango y el paso de iteracion. STEP controla el incremento o decremento y EXIT o CONTINUE permiten alterar el flujo dentro del bucle.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'keywords',
			kind: 'keyword',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'IF',
		},
		text: {
			summary: 'Keyword oficial que inicia una condicion en PowerScript.',
			documentation: 'Aparece en IF...THEN y marca el comienzo de una decision condicional. El lexema IF debe permanecer intacto; la semantica completa vive en el statement correspondiente.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'keywords',
			kind: 'keyword',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'FOR',
		},
		text: {
			summary: 'Keyword oficial que inicia una iteracion numerica en PowerScript.',
			documentation: 'Aparece en FOR...NEXT y marca el inicio del bloque iterativo. El lexema FOR debe permanecer intacto; la semantica completa vive en el statement correspondiente.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'reserved-words',
			kind: 'reserved-word',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'TRUE',
		},
		text: {
			summary: 'Literal booleano reservado que representa verdadero.',
			documentation: 'Usalo para expresar una condicion afirmativa explicita o devolver un resultado booleano verdadero sin sustituirlo por equivalentes numericos o de texto.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'reserved-words',
			kind: 'reserved-word',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'FALSE',
		},
		text: {
			summary: 'Literal booleano reservado que representa falso.',
			documentation: 'Usalo para expresar una condicion negativa explicita o devolver un resultado booleano falso sin sustituirlo por equivalentes numericos o de texto.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'reserved-words',
			kind: 'reserved-word',
			namespace: 'powerscript',
			invocation: 'global',
			name: 'NOT',
		},
		text: {
			summary: 'Operador logico reservado que invierte una condicion booleana.',
			documentation: 'Se aplica a expresiones booleanas para negar su resultado. Mantiene el lexema NOT intacto y conviene revisar la precedencia cuando se combina con otros operadores logicos.',
		},
	},
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];