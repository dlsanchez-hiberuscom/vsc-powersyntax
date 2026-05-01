# Spec 161 - Sink de journal interactivo para analysisCache (B167)

## 1. Resumen

Conectar analysisCache con un sink de persistencia para emitir mutaciones upsert y remove durante el serving interactivo.

## 2. Problema

Las actualizaciones locales del documento activo no llegaban al journal persistente y el resume quedaba atrasado respecto al uso real.

## 3. Objetivo

Sincronizar el camino interactivo con el journal sin duplicar logica de resolucion.

## 4. Alcance

- Definir AnalysisPersistenceSink.
- Anadir wiring en setAnalysisBackends.
- Emitir upsert al recalcular analisis.
- Emitir remove al invalidar analisis.

## 5. Fuera de alcance

- Replay de queries frecuentes.
- Persistencia de traces.
- Health checker.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B167.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
