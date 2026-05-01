# Plan - Spec 183 Flush tras invalidación y shutdown de ServingCache (B071B)

## 1. Resumen tecnico

Extender el helper runtime con invalidación + flush y reutilizarlo en cambios/cierre; además, esperar el flush final en shutdown.

## 2. Estado actual

- El runtime ya flushea al poblar ServingCache.
- `onDidChangeContent`, `onDidClose` y `onShutdown` no reflejan aún esa limpieza en la snapshot persistida.

## 3. Diseno propuesto

- Helper para invalidar URIs o vaciar la caché completa.
- Reuso del coordinador dirty.
- Shutdown async con espera explícita del último flush.

## 4. Impacto en rendimiento

- Mantiene coherencia de la snapshot persistente sin reindexado extra.

## 5. Riesgos tecnicos

- No esperar el flush final en shutdown podría perder el último estado válido.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "invalidateServingCacheEntries"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md