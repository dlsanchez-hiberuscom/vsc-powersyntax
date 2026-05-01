# Spec 176 - Snapshot persistente de ServingCache en cacheStore (B071B)

## 1. Resumen

Extender cacheStore con un puerto persistente para snapshots serializados de ServingCache como base inmediata del cache persistente de queries.

## 2. Problema

`Spec 175` ya permite exportar y restaurar ServingCache en memoria, pero cacheStore todavía no ofrece ningún lugar estable donde persistir ese snapshot entre sesiones.

## 3. Objetivo

Persistir y cargar snapshots de ServingCache desde cacheStore con validación segura y sin acoplar todavía el server a una feature concreta.

## 4. Alcance

- Añadir a cacheStore métodos de persistencia y carga de snapshot de ServingCache.
- Mantener esquema simple, versionado y seguro ante payload inválido.
- Cubrir la ruta con test unitario del store.

## 5. Fuera de alcance

- Wiring con hover/definition/signatureHelp/completion.
- Particionado por proyecto del snapshot de serving.
- Invalidación selectiva del cache persistente.

## 6. Requisitos

- R1. cacheStore debe devolver snapshot vacío si el payload es inexistente o inválido.
- R2. El formato persistido debe poder serializar entradas genéricas de ServingCache.
- R3. La validación debe quedar cubierta por tests unitarios.
- R4. La documentación debe reflejar el avance real de B071B.

## 7. Criterios de aceptacion

- AC1. cacheStore persiste snapshots de ServingCache en disco.
- AC2. cacheStore restaura snapshots válidos y degrada con seguridad si no lo son.
- AC3. El slice compila y sus tests quedan en verde.

## 8. Riesgos y notas

- Persistir payload arbitrario sin validar podría romper warm resume.
- El slice debe quedarse en el puerto de persistencia y no abrir todavía wiring en server.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.