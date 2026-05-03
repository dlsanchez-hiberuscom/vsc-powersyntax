import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_INTEGRATION_DOTNET_CATEGORIES = [
  '.NET interop',
] as const;

export const PB_MANUAL_CORE_INTEGRATION_DOTNET_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'DotNetAssembly', category: '.NET interop', summary: 'Assembly .NET cargado desde PowerBuilder.' }),
  systemObjectDatatype({ name: 'DotNetObject', category: '.NET interop', summary: 'Objeto .NET interoperable desde PowerBuilder.' }),
];