import type { PbSystemSymbolEntry } from '../../types';
import { toolingSymbol } from '../common';

export const PB_MANUAL_CORE_TOOLING_SYMBOLS: readonly PbSystemSymbolEntry[] = [
    toolingSymbol({
        name: 'PBAutoBuild',
        category: 'Build automation',
        summary: 'Modern PowerBuilder build executable consumed by JSON build files and CI helper export.',
        documentation: 'Read-only surface for troubleshooting/build: identifies the modern build executable without polluting interactive PowerScript resolution.',
        lookupAliases: ['pbautobuild250.exe', 'pb auto build'],
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_AUTOBUILD_PATH',
        category: 'Tooling environment',
        summary: 'Environment variable used to locate PBAutoBuild when no explicit path is configured.',
        documentation: 'Consumed outside the semantic hot path as an environment hint for build health, troubleshooting and support bundle.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.build.pbAutoBuildPath',
        category: 'Extension setting',
        summary: 'Extension setting that specifies the explicit PBAutoBuild path.',
        documentation: 'Used for build/health surfaces and must be kept outside interactive semantic queries.',
    }),
    toolingSymbol({
        name: 'ORCA',
        category: 'Legacy ORCA',
        summary: 'Legacy ORCA executable for scripts, export/import staging and controlled rebuild operations.',
        documentation: 'Read-only surface for legacy tooling; does not represent PowerScript semantics and must not compete with the language catalog.',
        lookupAliases: ['orca.exe', 'appeon orca'],
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_ORCA_PATH',
        category: 'Tooling environment',
        summary: 'Environment variable used to locate the ORCA executable.',
        documentation: 'Queried only for ORCA capability detection and environment troubleshooting.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'PB_ORCA_DLL',
        category: 'Tooling environment',
        summary: 'Environment variable used to resolve the ORCA session DLL.',
        documentation: 'Used in legacy export/import to locate the session DLL without inferring workspace semantics.',
        risk: 'external',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.legacy.orcaPath',
        category: 'Extension setting',
        summary: 'Extension setting that specifies the explicit ORCA executable path.',
        documentation: 'Used for capability detection, legacy commands and health/support surfaces.',
    }),
    toolingSymbol({
        name: 'vscPowerSyntax.legacy.orcaSessionDll',
        category: 'Extension setting',
        summary: 'Extension setting that specifies the ORCA session DLL.',
        documentation: 'Used by the legacy ORCA rail when preparing export/import/rebuild without opening a second semantic engine.',
    }),
];

export const PB_MANUAL_CORE_TOOLING_SYMBOL_CATEGORIES: readonly string[] = [
    ...new Set(PB_MANUAL_CORE_TOOLING_SYMBOLS.map((entry) => entry.category)),
];