# Plan - Spec 234 Hover resolution confidence (B157/B103)

## 1. Resumen tecnico

Extender el formateador de hover para aceptar una confidence general de resolución y hacer que `provideHover()` la proyecte desde `ResolvedTargetInfo`.

## 2. Estado actual

- el hover de usuario ya muestra lineage de la entidad;
- falta la confidence agregada del winner path.

## 3. Diseno propuesto

- anadir un metadato opcional de resolución en `formatUserHover()`;
- pasar `resolved.confidence` desde `provideHover()`;
- renderizar una línea separada de la confidence de lineage.

## 4. Impacto en el runtime

- aporta contexto adicional al usuario sin tocar la resolución;
- reutiliza la confidence ya calculada por el query engine.

## 5. Riesgos tecnicos

- confundir la confidence general con la confidence de lineage;
- romper callers existentes de `formatUserHover()`.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/hover"`

## 7. Documentacion a actualizar

- `docs/done-log.md`