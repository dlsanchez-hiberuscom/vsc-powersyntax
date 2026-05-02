# Spec 250 - Ancestros nativos PowerBuilder via system catalog (B225)

## 1. Resumen

Completar la cobertura de ancestros nativos conocidos del runtime PowerBuilder para reducir falsos positivos en jerarquias que terminan en tipos de sistema.

## 2. Estado real actual

`B225` queda `Closed`: el `system catalog` reconoce ya raices runtime como `powerobject`/`throwable`, `InheritanceGraph` completa la cadena nativa cuando la KB se corta en tipos del runtime y diagnostics + superficies read-only consumen la misma verdad compartida.

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

## 9. Cierre registrado

- `src/server/knowledge/system/nativeAncestors.ts` introduce la fuente compartida de tipos/ancestros nativos del runtime;
- `src/server/knowledge/system/SystemCatalog.ts` deja de limitarse a owner types indexados y reconoce tambien raices runtime representativas;
- `src/server/knowledge/resolution/InheritanceGraph.ts` prolonga la cadena cuando la herencia llega a tipos nativos conocidos y no existe mas KB local;
- `test/server/unit/systemCatalog.test.ts`, `inheritanceGraph.test.ts`, `hierarchyInspection.test.ts`, `currentObjectContext.test.ts`, `diagnostics.test.ts` e `impactAnalysis.test.ts` fijan el contrato cerrado.
