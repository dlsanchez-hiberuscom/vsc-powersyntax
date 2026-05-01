# Spec 177 - Restore y persist de ServingCache en runtime (B071B)

## 1. Resumen

Conectar la snapshot persistente de ServingCache al runtime del servidor para restaurar y persistir la caché de serving entre sesiones.

## 2. Problema

`Spec 176` ya deja un snapshot persistente en cacheStore, pero el servidor todavía no lo carga ni lo guarda. El valor de B071B sigue siendo potencial, no operativo.

## 3. Objetivo

Introducir un helper de persist/restore para ServingCache y conectarlo al arranque y al punto de persistencia estable del servidor.

## 4. Alcance

- Helper reutilizable para exportar ServingCache al store.
- Helper reutilizable para restaurar ServingCache desde el store.
- Wiring mínimo en server para cargar tras warm resume y persistir en readiness estable.

## 5. Fuera de alcance

- Particionado por proyecto del snapshot de serving.
- Filtros por feature o gates de seguridad.
- Invalidación persistente por URI.

## 6. Requisitos

- R1. El restore no debe lanzar si no hay store o snapshot.
- R2. La integración debe mantenerse pequeña y testeable fuera de server.ts.
- R3. Deben existir tests unitarios del helper.
- R4. La documentación debe reflejar el avance real de B071B.

## 7. Criterios de aceptacion

- AC1. Existe helper para restaurar ServingCache desde cacheStore.
- AC2. Existe helper para persistir ServingCache en cacheStore.
- AC3. server.ts usa el helper en arranque y persistencia estable.
- AC4. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Restaurar snapshot cuando la KB no es compatible podría crear hits inútiles; el slice debe apoyarse en la semántica ya restaurada.
- El wiring debe evitar acoplar server.ts a detalles del formato persistido.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.