# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B372 — DocumentationService locale-aware lazy resolver`

Estado actual: `B371` queda cerrada. El plugin ya publica un contrato de localización documental del catálogo con overlays inmutables por `entry.id` o `targetKey`, un índice español parcial bajo `src/server/knowledge/system/localization/` y un audit de huérfanos en `buildCatalogConsistencyReport().localization`, todo sin duplicar entries ni tocar el texto oficial de `generated`.

La evidencia vigente que deja `B371` es:

- `src/server/knowledge/system/types.ts` y `src/server/knowledge/system/localization/types.ts` fijan el contrato inmutable de overlays localizados y acotan explícitamente qué campos documentales pueden traducirse y cuáles no;
- `src/server/knowledge/system/localization/localizationResolver.ts` resuelve overlays por `targetId` o `targetKey` contra la entry canónica del bucket runtime y memoiza el índice por locale sin abrir merges globales ni mutar `generated`;
- `src/server/knowledge/system/localization/es/` publica ya un índice español inicial, parcial y precompilado para funciones oficiales como base del carril `B372-B375`;
- `src/server/knowledge/system/consistency.ts` y `test/server/unit/catalogLocalization.test.ts` hacen auditable la gobernanza del rail: overlays válidos, ausencia de huérfanos y preservación del summary oficial en inglés.

Con el contrato base de localización ya fijado, el siguiente cuello de botella pasa a ser de serving: toca abrir `B372` para entregar un `DocumentationService` lazy, O(1) y consumible por hover/completion/signatureHelp sin scans ni merges por idioma en el hot path.

---

## 2. Por qué es prioritario

Con `B371` cerrada, la base contractual ya existe; ahora hay que convertirla en serving utilizable sin romper budgets:

- `B372` debe resolver summary/documentation/usage notes/return docs por locale sobre el índice de `B371`, con fallback seguro `es -> en` y sin rescans de overlays;
- `B373-B375` dependen ya de esa API de serving para integrar hover/completion/signatureHelp y para medir cobertura sin duplicar lógica por consumer;
- el mayor riesgo inmediato pasa a ser introducir consumers localizados que hagan merge global, arrays nuevos o scans por request en vez de un lookup directo sobre la entry ya resuelta.

---

## 3. Trabajo permitido ahora

- construir `DocumentationService` o equivalente como capa de serving documental sobre la entry ya resuelta;
- mantener la localización como overlay visible y no como mutación de la identidad semántica del catálogo;
- seguir priorizando cambios pequeños, verificables y compatibles con el runtime/LSP actual.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B371` salvo drift real del contrato de overlays, del índice `es` o del audit de huérfanos;
- traducir nombres, IDs, firmas o reason codes del catálogo en vez de limitar la localización a documentación visible;
- introducir scans del catálogo completo o merges globales por locale en hover/completion/signatureHelp;
- abrir consumers localizados finales antes de fijar el serving lazy y reusable de `B372`.

---

## 5. Criterios de salida del foco actual

- existe un servicio documental locale-aware con lookup O(1) sobre la entry ya resuelta;
- el fallback `es -> en` queda fijado sin mutar `generated` ni clonar entries por idioma;
- los consumers posteriores pueden pedir textos localizados sin rescans ni lógica duplicada;
- `testing`, `architecture`, `performance-budget`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B373` — Localized catalog consumers for hover, completion and signatureHelp.
2. `B374` — Spanish catalog localization authoring workflow and coverage gate.
3. `B375` — Generated localization compatibility with regenerated catalog IDs.

---

## 7. Regla final

`B372` debe reutilizar íntegramente la base de `B371`. No toca reabrir governance ni duplicar overlays por consumer: toca servir documentación localizada con fallback barato, trazable y compatible con regeneración.
