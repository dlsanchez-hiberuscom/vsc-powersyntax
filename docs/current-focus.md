# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B374 — Spanish catalog localization authoring workflow and coverage gate`

Estado actual: `B373` queda cerrada. Hover, completion y signatureHelp ya consumen textos visibles localizados sobre el rail `localization/`, respetan `vscPowerSyntax.languageServices.documentationLocale = auto|en|es`, usan el idioma de VS Code cuando procede y mantienen el hot path defendible mediante cache keys por locale, alias canónicos manual/generated y fallback O(1) por nombre de parámetro cuando la firma visible difiere del overlay.

La evidencia vigente que deja `B373` es:

- `src/server/features/hover.ts`, `completion.ts` y `signatureHelp.ts` consumen ya `DocumentationService` con locale explícita, conservan firmas/labels originales y limitan la localización a la capa visible del consumer;
- `src/server/handlers/featureHandlers.ts`, `src/server/handlers/lifecycleHandlers.ts`, `src/server/server.ts` y `src/client/extension.ts` cablean ya la setting pública `vscPowerSyntax.languageServices.documentationLocale`, su fallback `auto -> locale de VS Code -> en` y la segregación de `ServingCache` por locale efectiva;
- `src/server/knowledge/system/localization/localizationResolver.ts` y `documentationService.ts` resuelven overlays también desde siblings manual/generated del mismo bucket lógico y mantienen fallback O(1) por nombre de parámetro único cuando la firma visible no coincide exactamente con el `signatureLabel` del overlay;
- `test/server/unit/documentationLocale.test.ts`, junto con las nuevas pruebas focales de `hover/completion/signatureHelp`, fija locale `auto|en|es`, rendering localizado visible y ausencia de duplicados por idioma, mientras `hotPathAllocationBudget.test.ts` permanece verde.

Con el wiring visible ya cerrado, el siguiente cuello de botella pasa a ser de authoring y cobertura: toca abrir `B374` para medir cobertura del rail español, endurecer la detección de huérfanos/incompletos y dar un workflow incremental mantenible para seguir ampliando traducciones sin drift.

---

## 2. Por qué es prioritario

Con `B373` cerrada, la capa visible ya existe; ahora hay que evitar que el rail español crezca sin control ni evidencia:

- `B374` debe introducir cobertura medible, detección de overlays huérfanos/incompletos y guía de estilo para que el rail `es` pueda crecer por tandas sin degradar el contrato ya publicado en B371-B373;
- `B375` depende de ese workflow para que la regeneración del catálogo no rompa localizaciones revisadas ni sus IDs/targetKeys;
- el mayor riesgo inmediato pasa a ser authoring sin métrica, overlays incompletos o traducciones que intenten cambiar nombres técnicos y acaben rompiendo la consistencia del catálogo.

---

## 3. Trabajo permitido ahora

- crear el reporte/script de cobertura de localización española por dominio y estado de revisión;
- detectar overlays huérfanos, overlays incompletos y traducciones que intenten tocar nombres técnicos o firmas;
- documentar guía de estilo y orden incremental de traducción sobre el rail `es`, manteniendo el runtime/LSP actual sin abrir merges ni mutaciones del catálogo base.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B373` salvo regressión real del wiring visible, del fallback por locale o de las cache keys segregadas por idioma;
- ampliar locales nuevos o tocar los consumers visibles para más presentation logic fuera del contrato ya fijado;
- traducir nombres reales del lenguaje, firmas, labels técnicos o reason codes estables;
- introducir scans globales, recomputación por item/token o mutaciones de entries cuando el rail de localización ya resuelve por lookup memoizado.

---

## 5. Criterios de salida del foco actual

- existe reporte de cobertura de localización por dominio y estado de revisión;
- el reporte detecta overlays huérfanos, overlays incompletos y drift contra IDs/targetKeys inválidos tras regeneración;
- existe guía de estilo para traducciones españolas y orden incremental de authoring;
- `testing`, `rules-catalog`, `powerbuilder technical guide`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B375` — Generated localization compatibility with regenerated catalog IDs.
2. `B378` — AI PowerBuilder context pack and token budget contract.
3. `B379` — Explain diagnostic tool and suggested safe fix contract.

---

## 7. Regla final

`B374` debe construir sobre `B371 + B372 + B373`. No toca reabrir semántica, serving ni wiring visible: toca dar authoring incremental, cobertura medible y reglas de traducción sin sacrificar trazabilidad, budgets ni estabilidad del catálogo.
