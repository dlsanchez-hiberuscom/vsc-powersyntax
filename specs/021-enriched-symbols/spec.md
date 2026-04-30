# Spec 021 — Enriched symbol model (B064)

## 1. Motivación

Habilitar visibility (B059), owner resolution (B060), references (B023) y
diagnósticos semánticos requiere que `Entity` exponga metadatos hoy
infrautilizados o ausentes.

## 2. Alcance

- Extender `src/server/knowledge/types.ts`/`Entity` con campos opcionales:
  - `containerKind?: 'window'|'userobject'|'datawindow'|'menu'|'function'|'global'|...`
  - `implementationKind?: 'function'|'event'|'subroutine'|'property'|'instance-var'`
  - `parameterCount?: number`
  - `returnType?: string`
  - `ownerName?: string` (alias estable de `containerName` para owner resolution)
  - `isExternal?: boolean`
  - `externalLibraryName?: string`
- Helper `enrichEntity` opcional aplicado al insertar en KB que rellena
  `parameterCount`, `ownerName`, `implementationKind` desde campos ya
  presentes.

### Fuera de alcance

- Cambiar la API pública.
- Reemplazar `containerName`.

## 3. Criterios de aceptación

1. Compila sin breaking changes (campos opcionales).
2. Helper `enrichEntity` deriva `parameterCount`/`ownerName`/`implementationKind`.
3. Tests unitarios cubren el helper.

## 4. Documentación

- `docs/architecture.md` (mención del modelo enriquecido).
- `docs/backlog.md` (B064 cerrada).
