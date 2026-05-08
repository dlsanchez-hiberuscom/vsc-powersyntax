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
			summary: 'Estructura de control que selecciona una rama segun el valor de una expresion.',
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
			summary: 'Bucle contado que recorre un rango numerico y se cierra con NEXT.',
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