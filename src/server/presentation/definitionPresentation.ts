import { Location } from 'vscode-languageserver/node';

import { toResolvedSymbolModel } from '../knowledge/resolution/resolvedSemanticModels';
import type { ResolvedTargetInfo } from '../knowledge/resolution/semanticQueryService';
import type { DefinitionViewModel } from './viewModels';

export function buildDefinitionViewModel(
  locations: readonly Location[],
  source: DefinitionViewModel['source'],
  resolved?: ResolvedTargetInfo | null,
): DefinitionViewModel {
  return {
    feature: 'definition',
    source,
    locations: locations.map((location) => ({ uri: location.uri, range: location.range })),
    confidence: resolved?.confidence ?? (locations.length > 0 ? 'high' : 'unknown'),
    reasonCodes: resolved?.reasonCodes ?? [],
    ...(resolved?.targets[0] ? {
      resolvedSymbol: toResolvedSymbolModel(resolved.targets[0], resolved),
    } : {}),
  };
}

export function formatDefinitionViewModel(viewModel: DefinitionViewModel): Location | Location[] | null {
  const locations = viewModel.locations.map((location) => Location.create(location.uri, location.range));
  if (locations.length === 0) {
    return null;
  }
  return locations.length === 1 ? locations[0] : locations;
}