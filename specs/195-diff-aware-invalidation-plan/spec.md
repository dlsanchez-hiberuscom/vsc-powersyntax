# Spec 195 - Diff-aware invalidation plan (B170/B153/B154)

## 1. Resumen

Conectar el semantic diff al engine de invalidacion para distinguir cambios cosmeticos de cambios semanticos reales y resolver el conjunto impactado correcto.

## 2. Problema

El repositorio ya tenia snapshot diff, grafo inverso de dependencias e invalidation plan transitivo, pero el runtime seguia invalidando dependientes solo por `document changed`. Faltaba usar el diff para evitar flush innecesario y combinar impactos previos y siguientes cuando la superficie semantica si cambiaba.

## 3. Objetivo

Cerrar `B170` y terminar de materializar `B153` y `B154` sobre un plan de invalidacion explicito, central y soportado por diff semantico.

## 4. Alcance

- Hacer que `diffSemanticSnapshots()` ignore cambios puramente cosmeticos.
- Introducir helpers explicitos para invalidacion solo del documento, merge de planes y plan snapshot-aware.
- Usar ese plan en `server.ts` durante `onDidChangeContent`.
- Cubrir el contrato con tests unitarios de `semanticDiff` y `semanticInvalidation`.

## 5. Fuera de alcance

- Reescribir todavia todo el scheduler del indexador.
- Cambiar la semantica de invalidacion en cierre de documento o shutdown mas alla del engine actual.
- Cerrar aun las slices pendientes de `B151`, `B152`, `B122`, `B123`, `B124`, `B169`, `B125` o `B134`.

## 6. Requisitos

- R1. El runtime no debe invalidar dependientes por cambios cosmeticos del documento origen.
- R2. Cuando si haya cambio semantico, la invalidacion debe combinar impactos previos y siguientes para no perder dependientes afectados por remove/add.
- R3. El criterio de invalidacion debe vivir en helpers explicitos y testeables.

## 7. Criterios de aceptacion

- AC1. Un cambio de fingerprint sin cambio de exports/dependencias no marca diff semantico.
- AC2. `onDidChangeContent` invalida solo el documento origen cuando el diff semantico no cambia.
- AC3. `onDidChangeContent` combina impactos previos y siguientes cuando el diff semantico si cambia.
- AC4. `B170`, `B153` y `B154` pueden pasar a `Done` con cobertura ejecutable del area tocada.

## 8. Riesgos y notas

- El cambio se apoya en la KB snapshot-first para que el diff compare el contrato documental publicado y no estructuras parciales.
- Documentacion a revisar: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.