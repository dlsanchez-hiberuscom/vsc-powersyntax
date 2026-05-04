# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B377 — Current object/class check command and AI-readable validation report`

Estado actual: `B376` queda cerrada. El plugin ya publica un `workspace-check` read-only como tool bridge, método de API y comando de producto, compuesto sobre `server-stats`, `semantic-workspace-manifest`, diagnostics/health y un summary ligero de consistencia de catálogo sin abrir un motor paralelo.

La evidencia vigente que deja `B376` es:

- `src/shared/publicApi.ts` publica `workspace-check`, `checkWorkspace()`, `powerbuilder.checkWorkspace` y los schemas `ApiWorkspaceCheck*` como contrato estable de API pública v2;
- `src/client/workspaceCheckReport.ts` normaliza modos `quick/full/catalog/diagnostics`, deriva findings AI-readable y renderiza un Markdown compacto para producto/handoff de agentes;
- `src/client/extension.ts` compone el reporte sobre surfaces existentes, paraleliza la recogida de secciones opcionales y expone `vscPowerSyntax.openWorkspaceCheck` sin bloquear la apertura del preview Markdown;
- `src/server/features/workspaceCheckCatalogSummary.ts` deja un summary memoizado y barato del system catalog para el hot path del check, sin reutilizar el reporte completo de adopción de `B369`.

Con el chequeo global del workspace ya resuelto, el siguiente cuello de botella vuelve a ser la validación localizada sobre el símbolo activo: toca cerrar el carril hermano de `current object/class check` con el mismo estándar read-only y AI-readable.

---

## 2. Por qué es prioritario

Con `B376` cerrada, ya existe un chequeo global del workspace; falta cerrar su equivalente de foco local para que usuario y agentes puedan decidir acciones con contexto inmediato del objeto activo:

- `B377` debe convertir el contexto del objeto/clase actual en un chequeo corto, confiable y legible por humanos y agentes;
- la cadena de localización (`B371-B375`) ya no está bloqueada por governance del catálogo, pero sigue sin desplazar la necesidad inmediata de un workflow de validación consumible por IA;
- una vez fijado el chequeo global, el mayor riesgo pasa a ser abrir acciones o explicaciones sobre símbolos activos sin una surface compacta y accionable de contexto, readiness y hallazgos locales.

---

## 3. Trabajo permitido ahora

- diseñar y cerrar un comando `current object/class check` read-only con salida Markdown/JSON o equivalente AI-readable;
- reutilizar surfaces existentes de health, manifest, readiness, routing, diagnostics, build snapshots y runtime self-test en vez de abrir otro motor paralelo;
- dejar el resultado lo bastante compacto para humanos, pero lo bastante estructurado para agentes y tooling;
- mantener la validación reproducible y fuera del hot path interactivo.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B367`, `B368` o `B369` salvo drift real del generador, de la policy de overlays o de la decision gate;
- reabrir `B376` salvo drift real del contrato público, del wiring read-only o de la composición del reporte;
- ampliar localización (`B371-B375`) antes de dejar cerrado el carril de validación AI-readable del objeto activo;
- mezclar `workspace check` o `object check` con edición automática o con flows write-enabled fuera de un dry-run explícito.

---

## 5. Criterios de salida del foco actual

- existe un comando read-only de `current object/class check` ejecutable desde el producto;
- el resultado resume contexto, readiness, diagnostics y bloqueos relevantes del símbolo activo sin depender de leer logs completos;
- la salida es consumible por IA y por humanos sin perder trazabilidad;
- `testing`, `architecture`, `developer-workflows`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B371` — Catalog localization model and immutable overlay contract.
2. `B372` — DocumentationService locale-aware lazy resolver.
3. `B373` — Localized catalog consumers for hover, completion and signatureHelp.

---

## 7. Regla final

`B377` debe aprovechar el runtime y las surfaces ya cerradas. No toca reinventar checks ni serializar medio workspace: toca componer una validación clara, corta y AI-readable sobre el símbolo activo y su contexto real.
