# Plan 006 - Catálogo oficial y hover enriquecido

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- extraer datasets del catálogo oficial del runtime a un módulo server-side reutilizable;
- construir `SystemCatalog` como índice rápido y compartido;
- priorizar el catálogo oficial en hover antes de degradar a `KnowledgeBase`;
- fijar la base con tests unitarios de catálogo y hover.

## Resultado histórico observado

- el catálogo oficial quedó como dependencia transversal de hover, completion, signature help y diagnostics;
- el hover enriquecido inicial fue posteriormente ampliado por specs posteriores, pero esta carpeta ya representaba una base cerrada.