# Spec 160 - Persistencia versionada de DocumentCache (B167)

## 1. Resumen

Permitir que DocumentCache exporte y restaure registros con version, facts, scopes y snapshot semantico de forma segura.

## 2. Problema

La cache documental no podia reconstruirse entre sesiones con suficiente fidelidad para warm resume.

## 3. Objetivo

Convertir DocumentCache en una fuente persistible y restaurable del estado documental seguro.

## 4. Alcance

- Exportar registros con version persistente.
- Restaurar facts, scopes y snapshot canonico.
- Mantener copia defensiva del payload.
- Cubrir export y restore con tests unitarios.

## 5. Fuera de alcance

- Persistencia por proyecto.
- Invalidacion cross-session fina.
- Warm query cache.

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
