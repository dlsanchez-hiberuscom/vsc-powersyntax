# Plan - Spec 180 Restaurar solo la epoch esperada en ServingCache (B071B)

## 1. Resumen tecnico

Extender restoreServingCacheSnapshot para recibir la epoch esperada, filtrar con kbVersionFromKey y rehidratar solo entradas coherentes con el checkpoint restaurado.

## 2. Estado actual

- La persistencia ya filtra por epoch activa.
- El restore todavía rehidrata toda la snapshot cargada.

## 3. Diseno propuesto

- Añadir parámetro de epoch esperada al helper.
- Filtrar entries cargadas antes de `restoreEntries()`.
- Conectar el call site con `restore.checkpoint.semanticEpoch`.

## 4. Impacto en rendimiento

- Reduce ruido y falsos hits tras warm resume.

## 5. Riesgos tecnicos

- Filtrar de más y perder entradas válidas del checkpoint reutilizado.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "restoreServingCacheSnapshot filtra"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md