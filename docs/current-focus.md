# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B380 — Explain system symbol and catalog lookup tool for AI`

Estado actual: `B379` queda cerrada. El repositorio ya dispone de una surface read-only compacta para explicar diagnostics concretos sin releer archivos enteros: `explain-diagnostic` existe como tool/API/comando contractual y reutiliza el carril explainability existente en cliente sobre diagnostics ya publicados.

La evidencia vigente que deja `B379` es:

- `src/shared/publicApi.ts` publica `ApiExplainDiagnosticRequest`, `ApiExplainDiagnosticReport`, el tool `explain-diagnostic`, el método `explainDiagnostic()` y la versión `2.16.0` del contrato público;
- `src/client/explainDiagnosticReport.ts` concentra la selección determinista del diagnostic objetivo, la explicación por `diagnostic.code`, la evidencia mínima y el safe fix read-only cuando el runtime ya lo puede defender;
- `src/client/extension.ts`, `src/client/commandRegistration.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts` y `package.json` cablean el método público, el dispatch read-only, el comando `powerbuilder.explainDiagnostic` y la UX `PowerSyntax: Explain Diagnostic at Cursor` sin abrir un segundo motor de diagnostics;
- `test/server/unit/explainDiagnosticReport.test.ts`, `test/server/unit/publicApi.test.ts`, `test/server/unit/diagnosticsExplainabilityPanelModel.test.ts` y la smoke focal de `test/smoke/extension.test.ts` fijan contrato, wiring y reuse del rail explainability.

Con ese carril explicativo ya cerrado, el siguiente cuello de botella pasa a ser explicar símbolos del catálogo PowerBuilder sin arrastrar datasets completos al prompt.

---

## 2. Por qué es prioritario

Con `B379` cerrada, ya existe un resumen compacto para diagnostics. Ahora falta el equivalente para conocimiento de lenguaje:

- `B380` debe permitir que una IA o usuario explique un símbolo del catálogo con signatures, ownerTypes, provenance y localización opcional sin cargar `generated/manual/localization` completos;
- `B381` depende de tener tanto explicación de diagnostics como explicación de símbolos antes de empaquetar un context bundle IA realmente útil;
- el repositorio ya tiene `system catalog`, localization y consumers estables, pero aún falta una surface read-only específica y compacta para lookup guiado de símbolos PowerBuilder.

---

## 3. Trabajo permitido ahora

- añadir el tool read-only `explain-system-symbol`, su comando `powerbuilder.explainSystemSymbol` y el método público `explainSystemSymbol()`;
- reutilizar `system catalog`, localization, enums, ownerTypes y provenance ya publicados, sin duplicar lógica ni pasar el catálogo completo al cliente o al prompt;
- mantener el flujo en modo explicativo/read-only, sin writes y sin introducir un carril paralelo de serving catalog-driven.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B379` salvo drift real del contrato `explain-diagnostic`, sus tests o su wiring;
- mover lógica de catálogo al cliente o reimplementar serving fuera del pipeline knowledge/runtime existente;
- introducir writes, fixes automáticos o materialización masiva de datasets para responder una consulta puntual;
- duplicar documentación de catálogo/localización fuera de `docs/architecture.md`, `docs/rules-catalog.md` y la guía técnica propietaria.

---

## 5. Criterios de salida del foco actual

- existe `explain-system-symbol` como tool/API/comando read-only contractual;
- el report resuelve o degrada honestamente símbolos del catálogo con `resolution.state`, candidates, provenance y documentación opcional localizada;
- el lookup reutiliza `generated/manual/localization` ya publicados sin scans globales ni bundles gigantes al prompt;
- `architecture`, `testing`, `developer-workflows`, `backlog`, `done-log`, `current-focus` y el context pack IA quedan alineados con el contrato nuevo.

---

## 6. Siguiente foco natural

1. `B381` — AI task context bundle orchestration tool.
2. `B320` — DataWindow expression/property official catalog.
3. `B327` — DataWindow constants and property path catalog.

---

## 7. Regla final

`B380` debe construir sobre el `system catalog`, localization y contratos read-only ya cerrados. No toca exportar datasets enteros ni duplicar serving: toca explicar mejor, con menos tokens y con provenance clara, lo que el runtime ya sabe del lenguaje.
