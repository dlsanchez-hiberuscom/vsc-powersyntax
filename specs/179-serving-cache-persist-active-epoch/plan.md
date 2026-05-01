# Plan - Spec 179 Persistir solo la epoch activa en ServingCache (B071B)

## 1. Resumen tecnico

Extender persistServingCacheSnapshot para recibir la epoch activa, filtrar con kbVersionFromKey y persistir solo entradas útiles para la próxima sesión.

## 2. Estado actual

- ServingCache ya expone kbVersionFromKey.
- persistServingCacheSnapshot vuelca todas las entradas sin discriminar version semántica.

## 3. Diseno propuesto

- Añadir parámetro de epoch activa al helper.
- Filtrar entries exportadas por kbVersion.
- Mantener las claves inválidas fuera del snapshot.

## 4. Impacto en rendimiento

- Debe reducir ruido y tamaño del snapshot persistido.

## 5. Riesgos tecnicos

- Filtrar mal y perder entradas válidas de la epoch activa.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "persistServingCacheSnapshot filtra"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md