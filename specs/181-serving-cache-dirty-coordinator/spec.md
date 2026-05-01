# Spec 181 - Coordinador dirty para flush de ServingCache (B071B)

## 1. Resumen

Introducir un coordinador pequeño y puro para gestionar cuándo hace falta persistir la snapshot de ServingCache sin duplicar lógica ni solapar flushes.

## 2. Problema

El runtime ya necesita persistir ServingCache en más de un punto, pero no existe una abstracción que coordine estado dirty e in-flight de forma reutilizable.

## 3. Objetivo

Crear un coordinador de flush con dirty flag y coalescing básico para reutilizarlo en los siguientes pasos de B071B.

## 4. Alcance

- Añadir helper puro para marcar dirty y flushear si procede.
- Evitar flush cuando el estado esté limpio.
- Cubrir el helper con tests unitarios.

## 5. Fuera de alcance

- Cablear flushes desde el runtime.
- Decidir eventos concretos de persistencia.
- Cambiar el formato del snapshot.

## 6. Requisitos

- R1. Debe existir `markDirty()`.
- R2. Debe existir un `flushIfDirty()` coalescente.
- R3. Debe ser seguro si se marca dirty mientras un flush está en vuelo.

## 7. Criterios de aceptacion

- AC1. El coordinador no flushea cuando está limpio.
- AC2. El coordinador flushea cuando está dirty.
- AC3. Si se marca dirty durante un flush, puede ejecutar un segundo flush antes de quedar estable.

## 8. Riesgos y notas

- Duplicar lógica dirty en `server.ts` dificultaría pasos posteriores.
- Este slice debe quedarse puro y sin acoplarse aún al LSP.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.