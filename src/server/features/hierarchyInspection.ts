import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { EntityKind, type Entity, type Scope } from '../knowledge/types';
import type { MemberClosureEntry } from '../knowledge/resolution/InheritanceGraph';
import { buildHierarchyTree, type HierarchyNode } from './hierarchyTree';
import { resolveAncestorDescriptor } from './ancestorDescriptor';
import type { ApiCurrentObjectAncestor } from '../../shared/publicApi';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';

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

export interface HierarchyLifecyclePhase {
  phase: 'create' | 'destroy';
  declaredIn: string | null;
  callsAncestor: boolean;
  triggersHook: 'constructor' | 'destructor' | null;
  hookResolved: boolean;
  hookDeclaredIn: string | null;
  warnings: string[];
}

export interface HierarchyInspection {
  focusType: string | null;
  immediateAncestor: string | null;
  ancestorChain: string[];
  immediateAncestorDescriptor: ApiCurrentObjectAncestor | null;
  ancestorDescriptors: ApiCurrentObjectAncestor[];
  hierarchyTree: HierarchyNode | null;
  overriddenMembers: HierarchyOverrideInfo[];
  closureSummary: HierarchyInspectionSummary;
  lifecycle: HierarchyLifecyclePhase[];
  lifecycleWarnings: string[];
}

export interface HierarchyInspectionGraph {
  getAncestors(typeName: string): string[];
  getDirectDescendants(typeName: string): string[];
  getMemberClosure(typeName: string): MemberClosureEntry[];
}

export interface HierarchyInspectionKnowledge {
  findAllDefinitions(symbolName: string): Entity[];
  getDocumentSnapshot(uri: string): SemanticDocumentSnapshot | null;
}

function normalizeTypeName(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function visitScopes(scopes: Scope[], visitor: (scope: Scope) => Scope | undefined): Scope | undefined {
  for (const scope of scopes) {
    const matched = visitor(scope);
    if (matched) {
      return matched;
    }

    const child = visitScopes(scope.children, visitor);
    if (child) {
      return child;
    }
  }

  return undefined;
}

function findEventScope(snapshot: SemanticDocumentSnapshot, ownerName: string, eventName: 'create' | 'destroy'): Scope | undefined {
  const wantedScopeId = `${normalizeTypeName(ownerName)}.${eventName}`;
  return visitScopes(snapshot.scopes, (scope) => {
    if (scope.id.toLowerCase() === wantedScopeId) {
      return scope;
    }
    return undefined;
  });
}

function findEffectiveEvent(
  closure: MemberClosureEntry[],
  eventName: 'create' | 'destroy' | 'constructor' | 'destructor'
): MemberClosureEntry | undefined {
  return closure.find((entry) =>
    entry.entity.kind === EntityKind.Event
    && entry.entity.name.toLowerCase() === eventName
    && !entry.overriddenByCurrentType
  );
}

function isImplicitLifecycleHook(hook: 'constructor' | 'destructor'): boolean {
  return hook === 'constructor' || hook === 'destructor';
}

function isLifecycleDefinitionBoilerplate(
  body: string,
  phase: 'create' | 'destroy',
  hook: 'constructor' | 'destructor'
): boolean {
  if (!body.trim()) {
    return false;
  }

  const triggerRegex = new RegExp(`\\bTriggerEvent\\s*\\(\\s*this\\s*,\\s*["']${hook}["']\\s*\\)`, 'ig');
  const superRegex = new RegExp(`\\bcall\\s+super\\s*::\\s*${phase}\\b`, 'ig');
  const stripped = body
    .replace(triggerRegex, '')
    .replace(superRegex, '')
    .replace(/[;\s]/g, '');

  return stripped.length === 0;
}

function buildLifecycleInspection(
  focusType: string,
  ancestorChain: string[],
  closure: MemberClosureEntry[],
  knowledge: HierarchyInspectionKnowledge
): HierarchyLifecyclePhase[] {
  const phases: Array<{ phase: 'create' | 'destroy'; hook: 'constructor' | 'destructor' }> = [
    { phase: 'create', hook: 'constructor' },
    { phase: 'destroy', hook: 'destructor' }
  ];

  return phases.flatMap(({ phase, hook }) => {
    const lifecycleEvent = findEffectiveEvent(closure, phase);
    if (!lifecycleEvent) {
      return [];
    }

    const declaredIn = lifecycleEvent.declaredIn ?? lifecycleEvent.entity.containerName ?? null;
    const snapshot = knowledge.getDocumentSnapshot(lifecycleEvent.entity.uri);
    const scope = snapshot && declaredIn ? findEventScope(snapshot, declaredIn, phase) : undefined;
    const body = scope && snapshot
      ? snapshot.maskedText.lines.slice(scope.startLine + 1, scope.endLine).join('\n')
      : '';

    const callsAncestor = new RegExp(`\\bcall\\s+super\\s*::\\s*${phase}\\b`, 'i').test(body);
    const triggerRegex = new RegExp(`\\bTriggerEvent\\s*\\(\\s*this\\s*,\\s*["']${hook}["']\\s*\\)`, 'i');
    const triggersHook = triggerRegex.test(body) ? hook : null;
    const hookEvent = findEffectiveEvent(closure, hook);
    const explicitHookDeclaredIn = hookEvent?.declaredIn ?? hookEvent?.entity.containerName ?? null;
    const hookResolved = triggersHook !== null && (Boolean(hookEvent) || isImplicitLifecycleHook(hook));
    const hookDeclaredIn = explicitHookDeclaredIn ?? (triggersHook !== null && hookResolved ? focusType : null);
    const warnings: string[] = [];
    const ownsLifecycleEvent = normalizeTypeName(declaredIn) === normalizeTypeName(focusType);
    const ownsHook = normalizeTypeName(explicitHookDeclaredIn) === normalizeTypeName(focusType);
    const isDefinitionBoilerplate = !ownsHook && isLifecycleDefinitionBoilerplate(body, phase, hook);

    if (!isDefinitionBoilerplate && ancestorChain.length > 0 && ownsLifecycleEvent && !callsAncestor) {
      warnings.push(`missing-super-${phase}`);
    }

    if (!isDefinitionBoilerplate && triggersHook !== null && !hookResolved) {
      warnings.push(`unresolved-${hook}`);
    }

    if (!isDefinitionBoilerplate && triggersHook === null && ownsLifecycleEvent && ownsHook) {
      warnings.push(`missing-trigger-${hook}`);
    }

    return [{
      phase,
      declaredIn,
      callsAncestor,
      triggersHook,
      hookResolved,
      hookDeclaredIn,
      warnings
    } satisfies HierarchyLifecyclePhase];
  });
}

export function buildHierarchyInspection(
  focusType: string | null,
  graph: HierarchyInspectionGraph,
  knowledge?: HierarchyInspectionKnowledge,
  systemCatalog?: SystemCatalog
): HierarchyInspection {
  if (!focusType) {
    return {
      focusType: null,
      immediateAncestor: null,
      ancestorChain: [],
      immediateAncestorDescriptor: null,
      ancestorDescriptors: [],
      hierarchyTree: null,
      overriddenMembers: [],
      closureSummary: {
        own: 0,
        inherited: 0,
        override: 0,
        inaccessible: 0
      },
      lifecycle: [],
      lifecycleWarnings: []
    };
  }

  const ancestorChain = graph.getAncestors(focusType);
  const ancestorDescriptors = knowledge
    ? ancestorChain.map((name) => resolveAncestorDescriptor(name, knowledge, systemCatalog))
    : ancestorChain.map((name) => ({ name }));
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
  const lifecycle = knowledge ? buildLifecycleInspection(focusType, ancestorChain, closure, knowledge) : [];

  return {
    focusType,
    immediateAncestor: ancestorChain[0] ?? null,
    ancestorChain,
    immediateAncestorDescriptor: ancestorDescriptors[0] ?? null,
    ancestorDescriptors,
    hierarchyTree: buildHierarchyTree(focusType, (typeName) => graph.getDirectDescendants(typeName)),
    overriddenMembers,
    closureSummary: summary,
    lifecycle,
    lifecycleWarnings: lifecycle.flatMap((entry) => entry.warnings)
  };
}