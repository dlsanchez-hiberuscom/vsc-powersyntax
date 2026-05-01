# Plan — Spec 133 Semantic Snapshot (B151)

## 1. Resumen tecnico

El cambio debe apoyarse en src/server/analysis/documentAnalysis.ts como punto unico de construccion y en src/server/parsing/documentModel.ts, src/server/parsing/codeMasking.ts y src/server/parsing/controlBlocks.ts como productores de piezas reutilizables.

## 2. Estado actual

- documentAnalysis ya calcula fingerprint y parte del analisis documental.
- DocumentCache y KnowledgeBase almacenan informacion reutilizable, pero no existe una unidad semantica canonica por documento.
- Features como hover, completion o definition consumen capas compartidas, aunque el pipeline todavia no esta centrado en un snapshot documental unico.

## 3. Diseno propuesto

- Crear un tipo canonico de snapshot en la capa knowledge o analysis del servidor.
- Hacer que documentAnalysis construya ese snapshot en un solo flujo, con identidad explicita y readiness local.
- Introducir una operacion base de merge-or-replace para casos donde parte del enriquecimiento pueda llegar en fases.
- Adaptar DocumentCache y los primeros consumidores para recibir el snapshot como artefacto principal.

## 4. Impacto en rendimiento

- Positivo en coherencia y recomputacion futura porque evita recomposicion dispersa.
- Riesgo moderado de incremento de memoria si el snapshot duplica estructuras ya retenidas en caches.
- Debe priorizarse una representacion compacta y reutilizable.

## 5. Riesgos tecnicos

- Duplicar datos entre analisis y caches.
- Introducir mezcla temporal entre contratos antiguos y el nuevo snapshot.
- Hacer demasiado ambicioso el primer corte y bloquear B165 o B170.

## 6. Estrategia de validacion

- Tests unitarios del builder del snapshot.
- Tests de identidad y merge-or-replace.
- Compilacion TypeScript del servidor.
- Smoke sobre hover y definition para confirmar que no se degrada el consumo inmediato.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si cambia la ubicacion canonica del artefacto documental
- specs posteriores dependientes de B151