/**
 * Hover formatter (Spec 037 / B103 / Hover UX).
 *
 * Renderiza un HoverViewModel compacto a Markdown LSP sin volver a resolver
 * semántica ni duplicar documentación fuera del modelo visible.
 *
 * @module features/hoverFormat
 */

import type { EntityLineage, Entity } from '../knowledge/types';
import { buildUserHoverViewModel, type HoverResolutionSummary, type HoverViewModel } from './hoverViewModel';

export type { HoverResolutionSummary } from './hoverViewModel';

export function formatLineageHover(lineage?: EntityLineage): string | null {
  if (!lineage?.inheritedFrom) {
    return null;
  }

  return `**Inherited from:** \`${lineage.inheritedFrom}\``;
}

export function formatHoverViewModel(viewModel: HoverViewModel): string {
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

export function formatUserHover(entity: Entity, resolution?: HoverResolutionSummary): string {
  return formatHoverViewModel(buildUserHoverViewModel(entity, resolution));
}
