import { SemanticTokens, SemanticTokensBuilder, SemanticTokensDelta } from 'vscode-languageserver/node';

import { buildCompactPayloadPolicy, type SemanticTokenViewModelEntry, type SemanticTokensViewModel } from './viewModels';

export function buildSemanticTokensViewModel(tokens: readonly SemanticTokenViewModelEntry[]): SemanticTokensViewModel {
  const sorted = [...tokens].sort((left, right) => {
    if (left.line !== right.line) {
      return left.line - right.line;
    }
    return left.char - right.char;
  });

  const deduped: SemanticTokenViewModelEntry[] = [];
  for (const token of sorted) {
    const last = deduped[deduped.length - 1];
    if (last && last.line === token.line && last.char === token.char) {
      continue;
    }
    deduped.push(token);
  }

  return {
    feature: 'semanticTokens',
    tokens: deduped,
    payloadPolicy: buildCompactPayloadPolicy('semanticTokens', 256 * 1024),
  };
}

export function formatSemanticTokensViewModel(
  viewModel: SemanticTokensViewModel,
  builder: SemanticTokensBuilder = new SemanticTokensBuilder(),
  previousResultId?: string
): SemanticTokens | SemanticTokensDelta {
  if (previousResultId) {
    builder.previousResult(previousResultId);
  }
  for (const token of viewModel.tokens) {
    builder.push(token.line, token.char, token.length, token.tokenType, token.tokenModifiers);
  }
  if (previousResultId && builder.canBuildEdits()) {
    return builder.buildEdits();
  }
  return builder.build();
}