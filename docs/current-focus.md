# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B373 — Localized catalog consumers for hover, completion and signatureHelp`

Estado actual: `B372` queda cerrada. El plugin ya publica un `DocumentationService` locale-aware sobre el rail `localization/`, con fallback `es -> en`, lookup O(1) por `entry.id`, caches lazy por entry/overlay para documentación de parámetros y sin scans globales ni clones por idioma en el hot path.

La evidencia vigente que deja `B372` es:

- `src/server/knowledge/system/localization/documentationService.ts` resuelve summary, documentation, usage notes, obsolete message, return docs y parameter docs sobre una entry ya resuelta, sin tocar el query layer ni abrir merges por locale;
- `src/server/knowledge/system/localization/index.ts` exporta ya el servicio como capa reusable para hover/completion/signatureHelp sobre la base contractual de `B371`;
- `test/server/unit/documentationService.test.ts` cubre prioridad del overlay español, fallback al texto original, overlays por `targetId`/`targetKey` y reutilización de arrays en fallback;
- `test/server/unit/hotPathAllocationBudget.test.ts` sigue verde tras introducir el servicio, manteniendo el guard contra scans y allocaciones accidentales en el carril interactivo.

Con el serving documental ya fijado, el siguiente cuello de botella pasa a ser de integración visible: toca abrir `B373` para cablear hover, completion y signatureHelp sobre este servicio sin duplicar lógica por consumer ni introducir coste adicional por item o por token.

---

## 2. Por qué es prioritario

Con `B372` cerrada, la capa reusable ya existe; ahora hay que hacerla visible en producto sin romper identidad ni latencia:

- `B373` debe cablear hover, completion y signatureHelp para que consuman textos localizados sobre el servicio ya cerrado, manteniendo firmas y labels originales;
- `B374-B375` dependen de esa integración para que la cobertura española y la compatibilidad con regeneración tengan impacto real en UX;
- el mayor riesgo inmediato pasa a ser que cada consumer resuelva locale, fallback y parameter docs por su cuenta, reintroduciendo lógica duplicada y divergencia de presentación.

---

## 3. Trabajo permitido ahora

- integrar `DocumentationService` en hover, completion y signatureHelp con cambios mínimos de wiring;
- mantener la localización como presentación visible, no como mutación de la identidad semántica del catálogo;
- seguir priorizando cambios pequeños, verificables y compatibles con el runtime/LSP actual.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B372` salvo drift real del servicio locale-aware, del fallback o de sus caches ligeras;
- traducir nombres, firmas, labels técnicos o reason codes en los consumers visibles;
- introducir scans del catálogo completo, clones de entries o arrays nuevos por item/token cuando el servicio ya resuelve por lookup;
- abrir cobertura/authoring de localización (`B374-B375`) antes de que hover/completion/signatureHelp consuman el servicio de forma estable.

---

## 5. Criterios de salida del foco actual

- hover muestra summary/documentation en español cuando existe overlay y cae a inglés cuando no;
- completion no duplica items por idioma y localiza la documentación sin tocar labels técnicos;
- signatureHelp mantiene firmas originales y localiza parameter docs/return docs mediante el servicio común;
- `testing`, `architecture`, `performance-budget`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B374` — Spanish catalog localization authoring workflow and coverage gate.
2. `B375` — Generated localization compatibility with regenerated catalog IDs.
3. `B378` — AI PowerBuilder context pack and token budget contract.

---

## 7. Regla final

`B373` debe reutilizar íntegramente `B371 + B372`. No toca reabrir governance ni serving: toca integrar los consumers visibles con el contrato ya fijado, preservando identidad semántica, budgets y fallback.
