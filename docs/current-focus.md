# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B364 — Enum catalog real-corpus validation against PFC, STD and public PB repositories`

Estado actual: `B363` queda cerrada con `specs/377-catalog-driven-enum-consumers`. El runtime ya proyecta enums en hover, completion, signatureHelp, semantic tokens para valores con `!` y diagnostics conservadores sin volver a hardcodear listas paralelas: `pbIdentifier.ts` resuelve sufijos `!`, `completion.ts` y `signatureHelp.ts` comparten `enumeratedContext.ts` para propiedades y parametros catalog-driven, `semanticTokens.ts` publica `enumMember` para valores conocidos por `SystemCatalog` y `diagnostics.ts` emite `enum-value-context-mismatch` solo cuando el tipo esperado es inequívoco. La validación ejecutada que deja este cierre trazado es:

- `npm run build:test`;
- `npx tsc -p tsconfig.test.json`;
- `npx vscode-test --label unit --grep "completion|hover|signatureHelp|semanticTokens|diagnostics|enumerated|enum"`;
- `npx vscode-test --label unit --grep "catalog|systemCatalog|catalogV2"`.

Trazas paralelas activas que no desplazan este foco principal:

- `B346` continúa abierto como hotspot del cliente, pero no desplaza la validación corpus-driven del carril enumerado mientras no aparezca una regresión real de activación o wiring;
- `B329` puede retomarse después si se quiere un contract más amplio de semantic tokens catalog-driven fuera del tratamiento explícito de valores con `!`;
- `B339/B357/B358/B359/B360/B361/B362/B363/B365` deben tratarse ya como base cerrada salvo regresión demostrable.

---

## 2. Por qué es prioritario

Con los consumers visibles ya cerrados, el siguiente riesgo deja de ser funcional y pasa a ser de validación real sobre corpus:

- `B363` ya cerró la utilidad visible del catálogo enumerado en editor y diagnostics;
- `B364` debe comprobar esa utilidad contra PFC 2025, STD/OrderEntry y corpus públicos antes de ampliar más cobertura o aceptar candidatos nuevos;
- cerrar `B364` ahora evita convertir usos corpus-driven en catálogo oficial sin distinguir evidencia runtime, curada y falsos positivos textuales.

---

## 3. Trabajo permitido ahora

- localizar y validar los corpus ya previstos (`fixtures-local/pfc`, `fixtures-local/STD_FC_OrderEntry` y helpers equivalentes) sin tratarlos como fuente oficial;
- medir hover/completion/diagnostics sobre usos reales de valores con `!`, clasificando conocidos, candidatos, falsos positivos y out-of-context values;
- convertir solo gaps confirmados en backlog, fixtures o smoke tests, nunca en catálogo oficial automático.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- reabrir `B363` salvo regresión real en hover/completion/signatureHelp/semantic tokens/diagnostics del carril enumerado;
- promover valores desconocidos desde PFC/STD/public corpora al catálogo oficial o manual-core sin evidencia de fuente defendible;
- mezclar `B364` con refactors grandes de cliente, ORCA, scheduler o DataWindow ajenos a la validación corpus-driven de enums.

---

## 5. Criterios de salida del foco actual

- PFC y STD/OrderEntry indexan sin crash si están disponibles en el entorno local;
- existe un reporte de uso real de valores con `!` que separa valores catalogados, desconocidos, candidatos, falsos positivos y casos fuera de contexto;
- hover/completion/diagnostics no introducen ruido masivo sobre los corpus validados;
- `docs/testing.md`, `docs/performance-budget.md`, `test/corpora/README.md` y los resultados/baselines afectados quedan alineados con la validación real ejecutada.

---

## 6. Siguiente foco natural

1. `B346` — Refactor client extension activation and command registration.
2. `B329` — Catalog-driven semantic tokens integration.
3. `B376` — Workspace check command and AI-readable validation report.

---

## 7. Regla final

`B364` valida corpus reales; no redefine membresía oficial. PFC, STD/OrderEntry y dumps públicos pueden abrir backlog, fixtures o smoke tests, pero no deben convertirse por sí solos en autoridad de catálogo ni en hardcodes nuevos dentro de los consumers visibles.