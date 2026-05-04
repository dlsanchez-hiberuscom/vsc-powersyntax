# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B376 — Workspace check command and AI-readable validation report`

Estado actual: `B369` queda cerrada. El system catalog ya no depende de una preferencia implícita por orden físico: `generated` es la base oficial de los dominios medidos, `manual-core` queda gobernado por overlays explícitos y la decisión arquitectónica queda ratificada en `docs/adr/ADR-0001-system-catalog-source-of-truth.md`.

La evidencia vigente que deja `B369` es:

- `buildCatalogConsistencyReport().adoption` publica ya el reporte comparativo `generated` vs `manual` con métricas por dominio y summary global;
- el summary actual fija `officialCount = 6601`, `generatedCount = 2146`, `manualCount = 1039`, `duplicateCount = 695`, `gapCount = 343`, `overrideCount = 1`, `enrichmentCount = 695` y `scraperErrorCount = 0`;
- `generated` gana de forma clara en cobertura estructural relevante para serving oficial (`eventIdCoverage`, `returnTypeCoverage`, `ownerTypesQuality`, `appliesToQuality`, `signatureHelpUsefulness`) y mantiene `officialDomainsWithGaps = []`;
- la única excepción aceptada queda explicitada: `datawindow-events`, `operators`, `pronouns` y `system-globals` siguen siendo `manual-primary` mientras no exista rail oficial equivalente.

Con la decisión del source-of-truth ya fijada, el siguiente cuello de botella vuelve a ser operativo y de workflow: toca dar a usuario y agentes un chequeo reproducible, AI-readable y workspace-scoped del estado real del proyecto.

---

## 2. Por qué es prioritario

Con `B369` cerrada, ya no falta una política de catálogo; falta observabilidad ejecutable para el workspace activo:

- `B376` debe convertir la validación read-only del workspace en un comando corto, confiable y legible por humanos y agentes;
- la cadena de localización (`B371-B375`) ya no está bloqueada por governance del catálogo, pero sigue sin desplazar la necesidad inmediata de un workflow de validación consumible por IA;
- una vez fijado el source-of-truth, el mayor riesgo pasa a ser operar sobre workspaces reales sin una surface compacta y accionable de checks, readiness y hallazgos.

---

## 3. Trabajo permitido ahora

- diseñar y cerrar un comando `workspace check` read-only con salida Markdown/JSON o equivalente AI-readable;
- reutilizar surfaces existentes de health, manifest, readiness, routing, diagnostics, build snapshots y runtime self-test en vez de abrir otro motor paralelo;
- dejar el resultado lo bastante compacto para humanos, pero lo bastante estructurado para agentes y tooling;
- mantener la validación reproducible y fuera del hot path interactivo.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B367`, `B368` o `B369` salvo drift real del generador, de la policy de overlays o de la decision gate;
- ampliar localización (`B371-B375`) antes de dejar cerrado el carril de validación AI-readable del workspace;
- mezclar el `workspace check` con edición automática o con flows write-enabled fuera de un dry-run explícito.

---

## 5. Criterios de salida del foco actual

- existe un comando read-only de `workspace check` ejecutable desde el producto;
- el resultado resume readiness, salud, routing, diagnosticos y bloqueos relevantes sin depender de leer logs completos;
- la salida es consumible por IA y por humanos sin perder trazabilidad;
- `testing`, `architecture`, `developer-workflows`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B377` — Current object/class check command and AI-readable validation report.
2. `B371` — Catalog localization model and immutable overlay contract.
3. `B372` — DocumentationService locale-aware lazy resolver.

---

## 7. Regla final

`B376` debe aprovechar el runtime y las surfaces ya cerradas. No toca reinventar checks ni serializar medio workspace: toca componer una validación clara, corta y AI-readable sobre el estado real del proyecto activo.
