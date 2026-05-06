import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_DOTNET_CATEGORIES = [
  '.NET interop',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_DOTNET_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({
    name: 'DotNetAssembly',
    category: '.NET interop',
    summary: '.NET assembly loaded from PowerBuilder.',
    manualOverlay: { mode: 'override', reason: 'Hardening DotNetAssembly documentation.', evidence: ['manual-core:integration:dotnet:dotnetassembly'] },
  }),
  systemObjectDatatype({
    name: 'DotNetObject',
    category: '.NET interop',
    summary: 'Interoperable .NET object from PowerBuilder.',
    manualOverlay: { mode: 'override', reason: 'Hardening DotNetObject documentation.', evidence: ['manual-core:integration:dotnet:dotnetobject'] },
  }),
];