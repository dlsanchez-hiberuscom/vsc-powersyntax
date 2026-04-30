# Spec 025 — Find references (B023)

## 1. Motivación

`Find All References` desbloquea refactor seguro y diagnósticos basados en
uso (B034 unused, B035 shadowing). Es la última pieza P1.

## 2. Alcance

- Nuevo módulo `src/server/features/references.ts`:
  - `provideReferences(document, position, kb, sources): Location[]`.
  - `sources` es un iterable de `{ uri, content }` (ya cargados/abiertos).
  - Localiza el identificador en `position` y devuelve:
    - Las definiciones desde la KB cuyo nombre case (case-insensitive).
    - Las ocurrencias textuales con `\b<word>\b` en cada `sources[i].content`.
- Wiring en `server.ts`:
  - `referencesProvider: true` en capabilities.
  - `connection.onReferences(...)` que pasa los documentos abiertos como `sources`.
- Tests `test/server/unit/references.test.ts`.

### Fuera de alcance

- Filtrado por visibility/herencia (P2).
- Scan de archivos en disco no abiertos (P2; el indexer puede preconstruir un index).

## 3. Criterios de aceptación

1. Identificador con definición en KB + varios usos en sources → devuelve todas las posiciones.
2. Identificador inexistente → devuelve `[]`.
3. Coincidencias respetan word boundary (no falsos positivos sub-string).

## 4. Documentación

- `docs/architecture.md`, `docs/backlog.md` (B023), `README.md` (feature visible).
