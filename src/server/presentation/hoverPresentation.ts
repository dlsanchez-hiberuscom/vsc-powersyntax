import { Hover, MarkupKind } from 'vscode-languageserver/node';

import { buildCompactPayloadPolicy, type SymbolHoverViewModel } from './viewModels';

export function buildSymbolHoverViewModel(
  viewModel: Omit<SymbolHoverViewModel, 'feature' | 'payloadPolicy'>,
): SymbolHoverViewModel {
  return {
    feature: 'hover',
    payloadPolicy: buildCompactPayloadPolicy('hover', 4 * 1024),
    ...viewModel,
  };
}

export function formatSymbolHoverMarkdown(viewModel: SymbolHoverViewModel): string {
  if (viewModel.preformattedMarkdown) {
    return viewModel.preformattedMarkdown;
  }

  const lines: string[] = [];
  if (viewModel.title) {
    lines.push(viewModel.title);
  }

  if (viewModel.signature) {
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push('```powerbuilder');
    lines.push(viewModel.signature);
    lines.push('```');
  }

  if (viewModel.summary) {
    lines.push('');
    lines.push(viewModel.summary);
  }

  for (const block of viewModel.blocks) {
    if (block.lines.length === 0) {
      continue;
    }
    lines.push('');
    lines.push(...block.lines);
  }

  return lines.join('\n');
}

export function formatSymbolHoverViewModel(viewModel: SymbolHoverViewModel): Hover {
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: formatSymbolHoverMarkdown(viewModel),
    },
  };
}