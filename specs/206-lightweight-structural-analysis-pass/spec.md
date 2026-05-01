# Spec 206 - Lightweight structural analysis pass (B152A)

## 1. Resumen

Introducir un `analyzeDocumentStructural()` pequeño y usarlo en el pase estructural del indexador para que ese pase sea realmente más barato que el enriquecido.

## 2. Problema

`Spec 205` ya publicó un snapshot `structural-only`, pero seguía derivándolo desde `analyzeDocument()` completo. Eso hacía honesta la publicación, pero no el coste del pase estructural.

## 3. Objetivo

Separar de verdad el trabajo barato del caro: el primer pase solo construye container model y texto enmascarado; el segundo hace el análisis semántico completo.

## 4. Alcance

- añadir `analyzeDocumentStructural()`;
- usarlo en el pase estructural de `workspaceIndexer`;
- diferir `analyzeDocument()` completo al pase enriquecido para documentos no reutilizados desde caché;
- añadir test unitario del helper estructural.

## 5. Fuera de alcance

- medir aún budgets finales sobre corpus real;
- optimizar persistencia o checkpoints del indexador;
- cerrar toda la épica `B152A` en esta spec.

## 6. Requisitos

- R1. El pase estructural debe construir un snapshot `structural-only` honesto y más barato.
- R2. El pase enriquecido debe seguir publicando el snapshot completo final.
- R3. La validación debe cubrir helper estructural e indexador.

## 7. Criterios de aceptacion

- AC1. Existe `analyzeDocumentStructural()` con snapshot `structural-only` sin facts ni scopes.
- AC2. `workspaceIndexer` usa ese helper en el primer pase cuando no puede reutilizar snapshot enriquecido de caché.
- AC3. El pase enriquecido sigue promoviendo a `nearby-semantic-ready`.

## 8. Riesgos y notas

- Esta slice mejora el coste relativo del pase estructural, pero no sustituye aún la validación de budgets sobre corpus real.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.