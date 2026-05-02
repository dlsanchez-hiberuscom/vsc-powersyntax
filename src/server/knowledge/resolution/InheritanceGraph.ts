import { KnowledgeBase } from '../KnowledgeBase';
import { getNativeAncestorChain } from '../system/nativeAncestors';
import { Entity, EntityKind } from '../types';
import { isAccessibleFrom } from '../visibility';

export interface MemberClosureEntry {
  entity: Entity;
  declaredIn: string | null;
  distance: number;
  relation: 'own' | 'inherited' | 'override';
  accessible: boolean;
  overriddenByCurrentType: boolean;
}

const VARIABLE_SCOPE_PRIORITY = new Map<NonNullable<Entity['scope']>, number>([
  ['Compartida', 0],
  ['Global', 1],
  ['Instancia', 2],
  ['Argumento', 3],
  ['Local', 4],
]);

function compareMemberPriority(left: MemberClosureEntry, right: MemberClosureEntry): number {
  if (left.distance !== right.distance) {
    return left.distance - right.distance;
  }

  if (left.entity.kind === EntityKind.Variable && right.entity.kind === EntityKind.Variable) {
    const leftPriority = VARIABLE_SCOPE_PRIORITY.get(left.entity.scope ?? 'Instancia') ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = VARIABLE_SCOPE_PRIORITY.get(right.entity.scope ?? 'Instancia') ?? Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
  }

  return left.entity.line - right.entity.line;
}

export class InheritanceGraph {
  private lastVersion = -1;
  private readonly ancestorCache = new Map<string, string[]>();
  private readonly hierarchyCache = new Map<string, string[]>();
  private readonly memberClosureCache = new Map<string, MemberClosureEntry[]>();
  private readonly memberCache = new Map<string, Entity[]>();
  private readonly directDescendantsCache = new Map<string, string[]>();
  private readonly descendantsCache = new Map<string, string[]>();

  constructor(private readonly kb: KnowledgeBase) {}

  /**
   * Limpia las cachés internas si la versión de la KnowledgeBase ha cambiado.
   */
  private checkVersion(): void {
    const currentVersion = this.kb.version;
    if (this.lastVersion !== currentVersion) {
      this.ancestorCache.clear();
      this.hierarchyCache.clear();
      this.memberClosureCache.clear();
      this.memberCache.clear();
      this.directDescendantsCache.clear();
      this.descendantsCache.clear();
      this.lastVersion = currentVersion;
    }
  }

  /**
   * Obtiene todos los ancestros de un tipo, resolviendo la jerarquía hacia arriba.
   * La lista devuelta está ordenada desde el ancestro más cercano hasta el más lejano.
   */
  getAncestors(typeName: string): string[] {
    this.checkVersion();
    const normalizedName = typeName.trim().toLowerCase();
    
    if (!normalizedName) return [];

    const cached = this.ancestorCache.get(normalizedName);
    if (cached) return [...cached];

    const ancestors: string[] = [];
    const seen = new Set<string>();
    
    const initialTypes = this.kb.findAllDefinitions(normalizedName).filter(e => e.kind === EntityKind.Type);
    const queue = initialTypes
      .map(t => t.baseTypeName)
      .filter((b): b is string => !!b && b.trim() !== '');

    if (queue.length === 0) {
      for (const nativeAncestor of getNativeAncestorChain(normalizedName)) {
        if (!seen.has(nativeAncestor)) {
          seen.add(nativeAncestor);
          ancestors.push(nativeAncestor);
        }
      }

      this.ancestorCache.set(normalizedName, ancestors);
      return [...ancestors];
    }

    while (queue.length > 0) {
      const current = queue.shift()!.trim();
      const currentNormalized = current.toLowerCase();

      if (!currentNormalized || seen.has(currentNormalized)) {
        continue;
      }

      seen.add(currentNormalized);
      ancestors.push(current);

      const parents = this.kb.findAllDefinitions(currentNormalized).filter(e => e.kind === EntityKind.Type);
      let hasWorkspaceParent = false;
      for (const parent of parents) {
        if (parent.baseTypeName && parent.baseTypeName.trim() !== '') {
          hasWorkspaceParent = true;
          queue.push(parent.baseTypeName);
        }
      }

      if (!hasWorkspaceParent) {
        for (const nativeAncestor of getNativeAncestorChain(currentNormalized)) {
          if (!seen.has(nativeAncestor)) {
            queue.push(nativeAncestor);
          }
        }
      }
    }

    this.ancestorCache.set(normalizedName, ancestors);
    return [...ancestors];
  }

  /**
   * Obtiene la jerarquía completa de un tipo, incluyéndolo a sí mismo y a todos sus ancestros.
   */
  getTypeHierarchy(typeName: string): string[] {
    this.checkVersion();
    const normalizedName = typeName.trim().toLowerCase();
    
    if (!normalizedName) return [];

    const cached = this.hierarchyCache.get(normalizedName);
    if (cached) return [...cached];

    const hierarchy = [typeName, ...this.getAncestors(typeName)];
    this.hierarchyCache.set(normalizedName, hierarchy);
    return [...hierarchy];
  }

  /**
   * Calcula la distancia semántica entre dos tipos en la jerarquía.
   * Devuelve 0 si son el mismo tipo.
   * Devuelve 1 si target es el ancestro directo, etc.
   * Devuelve Number.POSITIVE_INFINITY si targetTypeName no está en la jerarquía.
   */
  getTypeDistance(fromTypeName: string, targetTypeName: string): number {
    const targetNormalized = targetTypeName.trim().toLowerCase();
    if (!targetNormalized) return Number.POSITIVE_INFINITY;

    const hierarchy = this.getTypeHierarchy(fromTypeName);

    for (let i = 0; i < hierarchy.length; i++) {
      if (hierarchy[i].toLowerCase() === targetNormalized) {
        return i;
      }
    }

    return Number.POSITIVE_INFINITY;
  }

  /**
   * Precalcula la closure de miembros accesibles y heredados para un tipo dado.
   */
  getMemberClosure(typeName: string): MemberClosureEntry[] {
    this.checkVersion();
    const normalizedName = typeName.trim().toLowerCase();

    if (!normalizedName) return [];

    const cached = this.memberClosureCache.get(normalizedName);
    if (cached) return [...cached];

    const hierarchy = this.getTypeHierarchy(typeName);
    const hierarchySet = new Set(hierarchy.map((name) => name.toLowerCase()));
    const currentTypeMembers = new Set<string>();
    const ancestorMembers = new Set<string>();
    const collected: Entity[] = [];

    for (const entity of this.kb.getAllEntities()) {
      if (entity.kind === EntityKind.Type || !entity.containerName) {
        continue;
      }

      const owner = entity.containerName.trim().toLowerCase();
      if (!hierarchySet.has(owner)) {
        continue;
      }

      collected.push(entity);
      const key = `${entity.kind}:${entity.name.toLowerCase()}`;
      if (owner === normalizedName) {
        currentTypeMembers.add(key);
      } else {
        ancestorMembers.add(key);
      }
    }

    const closure = collected.map((entity) => {
      const declaredIn = entity.containerName ?? entity.ownerName ?? null;
      const declaredInNormalized = declaredIn?.trim().toLowerCase() ?? '';
      const key = `${entity.kind}:${entity.name.toLowerCase()}`;
      const relation = declaredInNormalized === normalizedName
        ? (ancestorMembers.has(key) ? 'override' : 'own')
        : 'inherited';

      return {
        entity,
        declaredIn,
        distance: declaredIn ? this.getTypeDistance(typeName, declaredIn) : Number.POSITIVE_INFINITY,
        relation,
        accessible: isAccessibleFrom(entity, {
          contextOwner: typeName,
          isDescendant: (child, ancestor) => this.isDescendantOf(child, ancestor)
        }),
        overriddenByCurrentType: declaredInNormalized !== normalizedName && currentTypeMembers.has(key)
      } satisfies MemberClosureEntry;
    });

    closure.sort(compareMemberPriority);
    this.memberClosureCache.set(normalizedName, closure);
    this.memberCache.set(normalizedName, closure.map((entry) => entry.entity));
    return [...closure];
  }

  /**
   * Obtiene todos los miembros (funciones, variables, eventos) disponibles en la jerarquía de un tipo.
   * No incluye los propios tipos/clases, sino solo lo que contienen.
   */
  getMembers(typeName: string): Entity[] {
    this.checkVersion();
    const normalizedName = typeName.trim().toLowerCase();
    
    if (!normalizedName) return [];

    const cached = this.memberCache.get(normalizedName);
    if (cached) return [...cached];

    return this.getMemberClosure(typeName).map((entry) => entry.entity);
  }

  /**
   * Devuelve los nombres de los tipos que heredan directamente de `typeName`.
   * (Spec 023 / B058)
   */
  getDirectDescendants(typeName: string): string[] {
    this.checkVersion();
    const normalized = typeName.trim().toLowerCase();
    if (!normalized) return [];

    const cached = this.directDescendantsCache.get(normalized);
    if (cached) return [...cached];

    const result: string[] = [];
    const seen = new Set<string>();
    for (const entity of this.kb.getAllEntities()) {
      if (entity.kind !== EntityKind.Type) continue;
      const base = entity.baseTypeName?.trim().toLowerCase();
      if (!base || base !== normalized) continue;
      const childNorm = entity.name.trim().toLowerCase();
      if (childNorm && !seen.has(childNorm)) {
        seen.add(childNorm);
        result.push(entity.name);
      }
    }
    this.directDescendantsCache.set(normalized, result);
    return [...result];
  }

  /**
   * Devuelve todos los descendientes (transitivos, sin duplicados, sin incluir el tipo).
   * (Spec 023 / B058)
   */
  getDescendants(typeName: string): string[] {
    this.checkVersion();
    const normalized = typeName.trim().toLowerCase();
    if (!normalized) return [];

    const cached = this.descendantsCache.get(normalized);
    if (cached) return [...cached];

    const collected: string[] = [];
    const seen = new Set<string>();
    const queue = [...this.getDirectDescendants(typeName)];
    while (queue.length > 0) {
      const next = queue.shift()!;
      const norm = next.trim().toLowerCase();
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      collected.push(next);
      queue.push(...this.getDirectDescendants(next));
    }
    this.descendantsCache.set(normalized, collected);
    return [...collected];
  }

  /**
   * Indica si `child` desciende (directa o transitivamente) de `ancestor`.
   * (Spec 023 / B058)
   */
  isDescendantOf(child: string, ancestor: string): boolean {
    if (!child || !ancestor) return false;
    const childN = child.trim().toLowerCase();
    const ancestorN = ancestor.trim().toLowerCase();
    if (!childN || !ancestorN || childN === ancestorN) return false;
    const ancestors = this.getAncestors(child);
    return ancestors.some((a) => a.trim().toLowerCase() === ancestorN);
  }
}
