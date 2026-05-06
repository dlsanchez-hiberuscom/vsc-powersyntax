import type { PbSystemSymbolLocalizationOverlay } from '../types';

export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_GENERATED_DATATYPES = [
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'system-object-datatypes',
			kind: 'system-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'DataStore',
		},
		text: {
			summary: 'DataStore es un control DataWindow no visual.',
			documentation: 'Funciona como un DataWindow sin interfaz grafica. Comparte la mayor parte del comportamiento de DataWindow, pero muchas propiedades visuales no aplican y las funciones de graficos devuelven error o cadena vacia porque no existe un control grafico visual asociado.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'system-object-datatypes',
			kind: 'system-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'DataWindowChild',
		},
		text: {
			summary: 'DataWindowChild es un reporte anidado o un DropDownDataWindow dentro de un objeto DataWindow.',
			documentation: 'Se usa para acceder de forma independiente a un DataWindow anidado o a un DropDownDataWindow. Hereda de Structure para disponer de almacenamiento y autoinstanciacion, no tiene eventos y varias funciones historicas estan marcadas como obsoletas aunque sigan funcionando en esta version.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'system-object-datatypes',
			kind: 'system-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'Transaction',
		},
		text: {
			summary: 'Transaction especifica los parametros que PowerBuilder usa para conectarse a una base de datos.',
			documentation: 'Puedes personalizar tu propia version definiendo un user object heredado del built-in Transaction object. Se usa como base del trabajo con conexiones de base de datos dentro de la aplicacion.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'system-object-datatypes',
			kind: 'system-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'HTTPClient',
		},
		text: {
			summary: 'HTTPClient es un objeto base para enviar solicitudes HTTP y recibir respuestas HTTP desde un recurso identificado por una URI.',
			documentation: 'Es mas facil de usar que Inet y soporta mas metodos HTTP y protocolos SSL/TLS. Frente a RESTClient maneja requests mas variados y respuestas jerarquicas, pero no es la mejor opcion para datos grandes si dejas AutoReadData habilitado, no soporta multithreading ni maneja automaticamente redirects HTTP 30X.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'system-object-datatypes',
			kind: 'system-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'RESTClient',
		},
		text: {
			summary: 'RESTClient esta construido sobre HTTPClient y ofrece un cliente simple para APIs RESTful con respuestas planas.',
			documentation: 'Sirve para requests a RESTful Web Service APIs y puede cargar el JSON devuelto por la API dentro de un DataWindow. Tiene menos capacidades avanzadas que HTTPClient, no soporta multithreading ni maneja automaticamente redirects HTTP 30X.',
		},
	},
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];