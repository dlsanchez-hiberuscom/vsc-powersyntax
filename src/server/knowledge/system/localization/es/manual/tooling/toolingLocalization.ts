import type { PbSystemSymbolLocalizationOverlay } from '../../../../types';

export const toolingLocalization: PbSystemSymbolLocalizationOverlay[] = [
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'PBAutoBuild',
		},
		text: {
			summary: 'Ejecutable moderno de build de PowerBuilder consumido por build files JSON y export de helper CI.',
			documentation: 'Surface read-only para troubleshooting/build: identifica el ejecutable de build moderno sin contaminar resolución PowerScript interactiva.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'PB_AUTOBUILD_PATH',
		},
		text: {
			summary: 'Variable de entorno usada para localizar PBAutoBuild cuando no hay path configurado.',
			documentation: 'Se consume fuera del hot path semántico como pista de entorno para build health, troubleshooting y support bundle.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'vscPowerSyntax.build.pbAutoBuildPath',
		},
		text: {
			summary: 'Setting de la extensión que fija la ruta explícita de PBAutoBuild.',
			documentation: 'Se usa para surfaces de build/health y debe mantenerse fuera de la query semántica interactiva.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'ORCA',
		},
		text: {
			summary: 'Ejecutable legacy ORCA para scripts, export/import staging y operaciones de rebuild controladas.',
			documentation: 'Surface read-only para tooling legacy; no representa semántica PowerScript y no debe competir con el catálogo del lenguaje.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'PB_ORCA_PATH',
		},
		text: {
			summary: 'Variable de entorno usada para localizar el ejecutable ORCA.',
			documentation: 'Se consulta sólo para detección de capability ORCA y troubleshooting de entorno.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'PB_ORCA_DLL',
		},
		text: {
			summary: 'Variable de entorno usada para resolver la DLL de sesión ORCA.',
			documentation: 'Se utiliza en export/import legacy para localizar la session DLL sin inferir semántica del workspace.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'vscPowerSyntax.legacy.orcaPath',
		},
		text: {
			summary: 'Setting de la extensión que fija la ruta explícita del ejecutable ORCA.',
			documentation: 'Se usa para capability detection, comandos legacy y health/support surfaces.',
		},
	},
	{
		locale: 'es',
		reviewed: true,
		source: 'manual-curated',
		targetKey: {
			domain: 'tooling-symbols',
			kind: 'constant',
			namespace: 'powerbuilder-tooling',
			invocation: 'global',
			name: 'vscPowerSyntax.legacy.orcaSessionDll',
		},
		text: {
			summary: 'Setting de la extensión que fija la DLL de sesión ORCA.',
			documentation: 'Se usa por el rail legacy ORCA al preparar export/import/rebuild sin abrir un segundo motor semántico.',
		},
	},
];
