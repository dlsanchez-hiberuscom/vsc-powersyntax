# Spec 183 - Flush tras invalidación y shutdown de ServingCache (B071B)

## 1. Resumen

Persistir de vuelta la snapshot de ServingCache cuando la caché se invalida por cambios/cierre de documento y al apagar el servidor.

## 2. Problema

La snapshot persistente ya se refresca al poblar nuevas entradas, pero puede quedarse desalineada cuando se invalidan URIs o al cerrar el servidor.

## 3. Objetivo

Encadenar `invalidate + markDirty + flushIfDirty` para invalidaciones del runtime y asegurar un flush final en shutdown.

## 4. Alcance

- Añadir helper runtime de invalidación con flush oportuno.
- Reutilizarlo en `onDidChangeContent` y `onDidClose`.
- Asegurar un flush final durante `onShutdown`.

## 5. Fuera de alcance

- Telemetría de hits reutilizados.
- Cambiar heurísticas de invalidación semántica.
- Reescribir el shutdown del servidor completo.

## 6. Requisitos

- R1. El helper debe invalidar las URIs indicadas o la caché completa.
- R2. Si hay coordinador, debe marcar dirty y pedir flush.
- R3. El shutdown debe esperar a que el flush final termine.

## 7. Criterios de aceptacion

- AC1. Las invalidaciones del runtime actualizan la snapshot persistida.
- AC2. El shutdown fuerza un último flush estable.
- AC3. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Si la snapshot no refleja invalidaciones, el warm resume puede arrancar con basura vieja.
- Este slice debe seguir siendo local al runtime y al coordinador dirty existente.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.