# Spec 188 - Semantic diff consciente de lineage (B172)

## 1. Resumen

Hacer que `semanticDiff` considere cambios relevantes de `lineage` al decidir si un símbolo exportado ha cambiado.

## 2. Problema

Hoy `serializeEntity()` ignora lineage, así que cambios de provenance, phase o herencia pueden no invalidar snapshots ni serving aunque sí cambien semánticamente el símbolo.

## 3. Objetivo

Incluir los campos relevantes de lineage en la huella semántica exportada.

## 4. Alcance

- Extender `serializeEntity()` con los campos de lineage útiles.
- Cubrir con test que un cambio de lineage marque el export como actualizado.
- Mantener el resto del diff sin cambios.

## 5. Fuera de alcance

- Query/service lineage.
- Gates de confianza.
- Cambios en features UI.

## 6. Requisitos

- R1. Cambios en lineage deben poder disparar `exportedIdsUpdated`.
- R2. No deben añadirse campos volátiles o no semánticos.
- R3. Compile y baseline completo deben permanecer verdes.

## 7. Criterios de aceptacion

- AC1. `semanticDiff` detecta cambios de lineage relevantes.
- AC2. El test del slice demuestra la actualización por lineage.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Meter metadata demasiado ruidosa podría sobreinvalidar snapshots.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.