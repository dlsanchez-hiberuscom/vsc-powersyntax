import type { PbSystemSymbolEntry } from '../../types';
import { toolingSymbol } from '../common';

export const PB_MANUAL_CORE_TOOLING_SYMBOLS: readonly PbSystemSymbolEntry[] = [
    toolingSymbol({
        name: 'PBAutoBuild',
        category: 'Build automation',
        summary: 'Modern PowerBuilder build executable consumed por build files JSON y export de helper CI.',
        documentation: 'Surface read-only para troubleshooting/build: identifica el ejecutable de build moderno sin contaminar resolución PowerScript interactiva.',
        lookupAliases: ['pbautobuild250.exe', 'pb auto build'],
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_AUTOBUILD_PATH',
        category: 'Tooling environment',
        summary: 'Variable de entorno usada para localizar PBAutoBuild cuando no hay path configurado.',
        documentation: 'Se consume fuera del hot path semántico como pista de entorno para build health, troubleshooting y support bundle.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.build.pbAutoBuildPath',
        category: 'Extension setting',
        summary: 'Setting de la extensión que fija la ruta explícita de PBAutoBuild.',
        documentation: 'Se usa para surfaces de build/health y debe mantenerse fuera de la query semántica interactiva.',
    }),
    toolingSymbol({
        name: 'ORCA',
        category: 'Legacy ORCA',
        summary: 'Ejecutable legacy ORCA para scripts, export/import staging y operaciones de rebuild controladas.',
        documentation: 'Surface read-only para tooling legacy; no representa semántica PowerScript y no debe competir con el catálogo del lenguaje.',
        lookupAliases: ['orca.exe', 'appeon orca'],
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_ORCA_PATH',
        category: 'Tooling environment',
        summary: 'Variable de entorno usada para localizar el ejecutable ORCA.',
        documentation: 'Se consulta sólo para detección de capability ORCA y troubleshooting de entorno.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_ORCA_DLL',
        category: 'Tooling environment',
        summary: 'Variable de entorno usada para resolver la DLL de sesión ORCA.',
        documentation: 'Se utiliza en export/import legacy para localizar la session DLL sin inferir semántica del workspace.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.legacy.orcaPath',
        category: 'Extension setting',
        summary: 'Setting de la extensión que fija la ruta explícita del ejecutable ORCA.',
        documentation: 'Se usa para capability detection, comandos legacy y health/support surfaces.',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.legacy.orcaSessionDll',
        category: 'Extension setting',
        summary: 'Setting de la extensión que fija la DLL de sesión ORCA.',
        documentation: 'Se usa por el rail legacy ORCA al preparar export/import/rebuild sin abrir un segundo motor semántico.',
    }),
];

export const PB_MANUAL_CORE_TOOLING_SYMBOL_CATEGORIES: readonly string[] = [
    ...new Set(PB_MANUAL_CORE_TOOLING_SYMBOLS.map((entry) => entry.category)),
];