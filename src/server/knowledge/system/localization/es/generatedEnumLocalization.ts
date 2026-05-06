import type { PbSystemSymbolLocalizationOverlay } from '../types';

export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES_GENERATED_ENUMS = [
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'enumerated-types',
			kind: 'enumerated-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'SaveAsType',
		},
		text: {
			summary: 'Valores para especificar el formato de los datos que quieres guardar.',
			documentation: 'Se usa en el metodo SaveAs para elegir el formato de salida al guardar datos de un DataWindow, un control grafico dentro de un DataWindow o un grafico PowerBuilder.',
			obsoleteMessage: 'Marcada como obsoleta en la referencia oficial de Appeon.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'enumerated-types',
			kind: 'enumerated-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'FillPattern',
		},
		text: {
			summary: 'Valores para el patron de relleno de formas, por ejemplo barras o porciones de un grafico.',
			documentation: 'Se usa en los metodos Get/SetSeriesStyle y Get/SetDataStyle para controles graficos en un DataWindow o en graficos PowerBuilder.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'enumerated-types',
			kind: 'enumerated-type',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'SecureProtocol',
		},
		text: {
			summary: 'Tipo enumerado que define el protocolo de seguridad usado por la propiedad SecureProtocol.',
			documentation: 'Los valores admitidos van de 0 a 6: 0 detecta y usa automaticamente el mejor protocolo disponible; 1 a 6 seleccionan SSL 2.0, SSL 3.0 o TLS 1.0 a 1.3. El soporte de TLS 1.3 depende del sistema operativo y en aplicaciones nativas C/S requiere Windows 11 o Windows Server 2022.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'enumerated-values',
			kind: 'enumerated-value',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'Text!',
		},
		text: {
			summary: 'Exporta el contenido del DataWindow como texto plano.',
			documentation: 'Selecciona el formato de texto plano en operaciones SaveAs y mantiene intacto el valor enumerado real Text! en codigo y firmas.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'enumerated-values',
			kind: 'enumerated-value',
			namespace: 'powerbuilder-runtime',
			invocation: 'global',
			name: 'Primary!',
		},
		text: {
			summary: 'Selecciona el buffer principal del DataWindow.',
			documentation: 'Representa las filas activas del DataWindow, es decir, las que no han sido eliminadas ni filtradas, sin traducir el valor enumerado real Primary!.',
		},
	},
] as const satisfies readonly PbSystemSymbolLocalizationOverlay[];