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
import { formatSymbolHoverMarkdown } from '../presentation/hoverPresentation';
import { getPresentationTerm } from '../presentation/terminology';

export type { HoverResolutionSummary } from './hoverViewModel';

export function formatLineageHover(lineage?: EntityLineage): string | null {
  if (!lineage?.inheritedFrom) {
    return null;
  }

  return `**${getPresentationTerm('inherited-from-label', 'en')}:** \`${lineage.inheritedFrom}\``;
}

export function formatHoverViewModel(viewModel: HoverViewModel): string {
  return formatSymbolHoverMarkdown(viewModel);
}

export function formatUserHover(entity: Entity, resolution?: HoverResolutionSummary): string {
  return formatHoverViewModel(buildUserHoverViewModel(entity, resolution));
}
