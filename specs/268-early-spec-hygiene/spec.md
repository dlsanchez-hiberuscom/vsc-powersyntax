# Spec 268 - Early spec hygiene (B233)

**Estado:** cerrada y validada.

## 1. Resumen

Normalizar las specs tempranas incompletas para que el árbol `specs/` deje de mezclar trabajo vivo con carpetas históricas sin `spec.md`, `plan.md` o `tasks.md` mínimos.

## 2. Estado real actual

`B233` queda `Closed`: las carpetas tempranas `003-009` y `012` ya tienen la tríada mínima documental, su estado histórico queda explícito y `docs/spec-driven-development.md` explica cómo se permite esta normalización retroactiva.

## 3. Objetivo

Reducir la ambigüedad operativa del inventario `specs/` para que maintaineres y agentes no traten deuda histórica de plantilla como si fuera alcance activo.

## 4. Alcance

- inventariar specs tempranas con plantilla incompleta;
- añadir `spec.md`, `plan.md` y `tasks.md` mínimos donde faltaban;
- marcar cada carpeta afectada con estado histórico explícito;
- actualizar SDD, backlog, current-focus, done-log y roadmap.

## 5. Fuera de alcance

- reimplementar features históricas ya cerradas;
- reescribir todo el inventario `specs/` fuera del subconjunto incompleto detectado;
- usar esta higiene documental para cambiar el estado técnico real del producto.

## 6. Criterios de aceptación

- AC1. Ninguna spec temprana incompleta detectada en `001-020` queda sin `spec.md`, `plan.md` o `tasks.md`.
- AC2. Cada carpeta afectada declara un estado histórico explícito.
- AC3. `docs/spec-driven-development.md` deja clara la regla para normalización retroactiva.
- AC4. Backlog, done-log, current-focus y roadmap reflejan el cierre.
- AC5. El siguiente foco canónico pasa a `B216`.

## 7. Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/spec-driven-development.md`
- specs `003-009` y `012`

## 8. Validación requerida

- auditoría local del inventario `specs/001-020` comprobando plantilla mínima en las carpetas afectadas.

## 9. Cierre registrado

- `specs/003-workspace-discovery`, `004-incremental-pipeline`, `005-workspace-symbols-goto`, `006-hover-catalog`, `007-hierarchical-symbols`, `008-signature-help`, `009-completado-contextual` y `012-semantic-tokens` quedan normalizadas;
- `docs/spec-driven-development.md` incorpora la regla explícita para specs históricas reconstruidas retroactivamente;
- el foco operativo salta a `B216`.