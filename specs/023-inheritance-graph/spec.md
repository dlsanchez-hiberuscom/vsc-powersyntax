# Spec 023 — InheritanceGraph robusto (B058)

## 1. Motivación

Para references (B023), refactors y diagnósticos navegando descendencia se
necesita el reverso del grafo: dado un tipo, conocer quién hereda de él.

## 2. Alcance

- Añadir a `InheritanceGraph`:
  - `getDirectDescendants(typeName: string): string[]`
  - `getDescendants(typeName: string): string[]` (transitivo).
  - `isDescendantOf(child: string, ancestor: string): boolean`.
- Cachés invalidadas vía `checkVersion`.

### Fuera de alcance

- Reescritura completa del grafo.

## 3. Criterios de aceptación

1. `getDirectDescendants('A')` devuelve `['B']` si `B` extiende `A`.
2. `getDescendants` es transitivo y deduplicado.
3. `isDescendantOf` consistente con el grafo.
4. Tests cubren cadena `C ← B ← A`.

## 4. Documentación

- `docs/architecture.md`, `docs/backlog.md` (B058).
