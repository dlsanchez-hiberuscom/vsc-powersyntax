/**
 * Library order resolver (B087).
 *
 * Reordena candidatos de definición priorizando:
 * 1. Proyecto del archivo activo (si lo hay).
 * 2. Índice de library dentro del target/proyecto correspondiente.
 *
 * @module knowledge/resolution/libraryOrder
 */

import type { Entity } from '../types';
import type { WorkspaceState } from '../../workspace/workspaceState';

interface RankInput {
  activeUri: string | null;
  state: WorkspaceState;
}

function getLibraryIndexForUri(uri: string, state: WorkspaceState): { project: string | null; libIndex: number } {
  const registry = state.getProjectRegistry();
  const project = registry?.getProjectForFile(uri) ?? null;
  if (!project) return { project: null, libIndex: Number.POSITIVE_INFINITY };

  const topology = state.getTopology();
  const target = topology.targets.find((t) => t.uri === project);
  const proj = topology.projects.find((p) => p.uri === project);
  const libs = (target?.libraries ?? proj?.libraries ?? []) as string[];

  for (let i = 0; i < libs.length; i++) {
    const libDir = libs[i].endsWith('/') ? libs[i] : libs[i] + '/';
    if (uri.startsWith(libDir)) return { project, libIndex: i };
  }
  return { project, libIndex: Number.POSITIVE_INFINITY };
}

export function resolveByLibraryOrder(
  candidates: Entity[],
  input: RankInput
): Entity[] {
  if (candidates.length <= 1) return candidates;
  const { activeUri, state } = input;
  const activeProject = activeUri
    ? state.getProjectRegistry()?.getProjectForFile(activeUri) ?? null
    : null;

  const ranked = candidates.map((entity, idx) => {
    const { project, libIndex } = getLibraryIndexForUri(entity.uri, state);
    const projectMatch = activeProject && project === activeProject ? 0 : 1;
    return { entity, projectMatch, libIndex, idx };
  });

  ranked.sort((a, b) => {
    if (a.projectMatch !== b.projectMatch) return a.projectMatch - b.projectMatch;
    if (a.libIndex !== b.libIndex) return a.libIndex - b.libIndex;
    return a.idx - b.idx; // estabilidad
  });

  return ranked.map((r) => r.entity);
}
