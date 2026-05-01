# Spec 197 - Semantic result immutability (B174)

## 1. Resumen

Blindar las lecturas y escrituras publicas de `KnowledgeBase`, `DocumentCache` y `HotContextCache` con copias defensivas para que snapshots, scopes y resultados publicados no puedan mutarse accidentalmente desde consumers.

## 2. Problema

`Specs 159-160` ya habian endurecido export/restore y parte del payload persistente, pero seguian existiendo lecturas vivas en memoria: un consumer podia modificar el resultado de `findDefinition()`, `getDocumentSnapshot()`, `DocumentCache.get()` o `HotContextCache.getActiveEntities()` y contaminar el estado publicado del motor.

## 3. Objetivo

Cerrar `B174` asegurando que los resultados semanticos publicados se tratan como inmutables en los boundaries internos relevantes.

## 4. Alcance

- aplicar copias defensivas al entrar y salir de `KnowledgeBase`;
- aplicar copias defensivas al entrar y salir de `DocumentCache`;
- aplicar copias defensivas al entrar y salir de `HotContextCache`;
- añadir tests unitarios contra mutacion accidental por input y por lectura.

## 5. Fuera de alcance

- introducir estructuras persistentemente inmutables o `Object.freeze()` profundo en todo el runtime;
- optimizaciones de memoria como interning o compactacion (`B164`);
- unificar todavia todas las features sobre el query engine (`B156`) o el snapshot-first end-to-end (`B151`).

## 6. Criterios de aceptacion

- AC1. Mutar el payload entregado a `KnowledgeBase.upsertDocument()` no altera el estado publicado.
- AC2. Mutar resultados leidos desde `KnowledgeBase` no altera snapshots, scopes ni entidades publicadas.
- AC3. Mutar entradas leidas o entregadas a `DocumentCache` no altera la cache almacenada.
- AC4. Mutar entidades leidas o entregadas a `HotContextCache` no altera el cache caliente.
- AC5. `B174` puede pasar a `Done` con compilacion y tests unitarios focalizados verdes.

## 7. Riesgos y notas

- El cambio endurece seguridad interna, pero aumenta el coste de copia en hot paths; cualquier optimizacion posterior debe preservar el boundary inmutable.
- Documentacion a revisar: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.