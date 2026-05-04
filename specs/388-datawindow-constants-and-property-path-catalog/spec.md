# Spec 388 — B327 DataWindow constants and property path catalog

## Estado

- in-progress

## Relacion backlog

- Backlog item: `B327 — DataWindow constants and property path catalog`

## Objetivo

Catalogar constantes, property paths y nombres de propiedades DataWindow reutilizables por `Describe/Modify/Object`, manteniéndolos separados del parser PowerScript y sirviéndolos sólo con contexto DataWindow defendible.

## Alcance

- ampliar `datawindow-properties` con property paths reales observables en corpus/tests;
- poblar `datawindow-constants` con source-of-truth oficial/curado cuando exista evidencia defendible;
- reconsumir el catálogo desde providers DataWindow existentes en vez de seguir ampliando hardcodes locales.

## Fuera de alcance

- reparsear `.srd` como PowerScript;
- mezclar constantes o property paths DataWindow con el vocabulario PowerScript global;
- cerrar ítems posteriores de semantic tokens o explainability en la misma slice.