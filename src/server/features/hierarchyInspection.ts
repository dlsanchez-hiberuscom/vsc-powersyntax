import type { EntityKind } from '../knowledge/types';
import type { MemberClosureEntry } from '../knowledge/resolution/InheritanceGraph';
import { buildHierarchyTree, type HierarchyNode } from './hierarchyTree';

export interface HierarchyOverrideInfo {
  name: string;
  kind: EntityKind;
  inheritedFrom: string | null;
  inaccessible: boolean;
}

export interface HierarchyInspectionSummary {
  own: number;
  inherited: number;
  override: number;
  inaccessible: number;
}

export interface HierarchyInspection {
  focusType: string | null;
  immediateAncestor: string | null;
  ancestorChain: string[];
  hierarchyTree: HierarchyNode | null;
  overriddenMembers: HierarchyOverrideInfo[];
  closureSummary: HierarchyInspectionSummary;
}

export interface HierarchyInspectionGraph {
  getAncestors(typeName: string): string[];
  getDirectDescendants(typeName: string): string[];
  getMemberClosure(typeName: string): MemberClosureEntry[];
}

export function buildHierarchyInspection(
  focusType: string | null,
  graph: HierarchyInspectionGraph
): HierarchyInspection {
  if (!focusType) {
    return {
      focusType: null,
      immediateAncestor: null,
      ancestorChain: [],
      hierarchyTree: null,
      overriddenMembers: [],
      closureSummary: {
        own: 0,
        inherited: 0,
        override: 0,
        inaccessible: 0
      }
    };
  }

  const ancestorChain = graph.getAncestors(focusType);
  const closure = graph.getMemberClosure(focusType);
  const inheritedByKey = new Map<string, MemberClosureEntry[]>();
  const summary: HierarchyInspectionSummary = {
    own: 0,
    inherited: 0,
    override: 0,
    inaccessible: 0
  };

  for (const entry of closure) {
    summary[entry.relation]++;
    if (!entry.accessible) {
      summary.inaccessible++;
    }
    if (entry.relation === 'inherited') {
      const key = `${entry.entity.kind}:${entry.entity.name.toLowerCase()}`;
      const siblings = inheritedByKey.get(key) ?? [];
      siblings.push(entry);
      siblings.sort((left, right) => left.distance - right.distance);
      inheritedByKey.set(key, siblings);
    }
  }

  const overriddenMembers = closure
    .filter((entry) => entry.relation === 'override')
    .map((entry) => {
      const key = `${entry.entity.kind}:${entry.entity.name.toLowerCase()}`;
      const inheritedFrom = inheritedByKey.get(key)?.[0]?.declaredIn ?? ancestorChain[0] ?? null;
      return {
        name: entry.entity.name,
        kind: entry.entity.kind,
        inheritedFrom,
        inaccessible: !entry.accessible
      };
    });

  return {
    focusType,
    immediateAncestor: ancestorChain[0] ?? null,
    ancestorChain,
    hierarchyTree: buildHierarchyTree(focusType, (typeName) => graph.getDirectDescendants(typeName)),
    overriddenMembers,
    closureSummary: summary
  };
}