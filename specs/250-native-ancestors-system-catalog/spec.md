# Spec 250 - Ancestros nativos PowerBuilder via system catalog (B225)

## 1. Resumen

Completar la cobertura de ancestros nativos conocidos del runtime PowerBuilder para reducir falsos positivos en jerarquias que terminan en tipos de sistema.

## 2. Estado real actual

`B225` esta `Partial`: diagnostics, current object context, impact analysis e inspectHierarchy ya distinguen algunos ancestros nativos conocidos como `system type`, pero falta ampliar catalogo e indices.

## 3. Objetivo

Usar el `system catalog` como fuente unica para owner types base y aliases nativos representativos, propagando esa verdad a diagnostics y queries derivadas.

## 4. Alcance

- ampliar catalogo/indices de owner types nativos;
- reutilizarlo en diagnostics, hierarchy/current object context, impact analysis y query surfaces;
- cubrir casos positivos y negativos representativos.

## 5. Fuera de alcance

- modelar toda la API oficial de PowerBuilder;
- resolver frameworks empresariales externos;
- crear heuristicas por nombre fuera del catalogo compartido.

## 6. Criterios de aceptacion

- AC1. Ancestros nativos conocidos no disparan SD3 ni `missing base type`.
- AC2. Las superficies read-only distinguen sistema, framework y aplicacion cuando hay evidence suficiente.
- AC3. Tests cubren tipos nativos, desconocidos y aliases.

## 7. Documentacion afectada

- `docs/backlog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md` si cambian diagnostics
- `docs/testing.md`

## 8. Validacion requerida

- `npm run test:unit -- --grep "systemCatalog|diagnostics|hierarchy|currentObjectContext|impactAnalysis"`
