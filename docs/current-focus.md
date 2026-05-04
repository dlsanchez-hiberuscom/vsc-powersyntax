# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B344 — DataWindow binding edge cases from plugin_old`

Estado actual: `B342` queda cerrada. La spec `389-plugin-old-symbol-heuristics` deja ya una matriz auditada de heurísticas `plugin_old` y absorbe la primera mejora defendible: linked editing seguro para `Local` y `Argumento` servido por el runtime actual sin provider paralelo.

La evidencia cerrada que deja `B342` es:

- `docs/plugin-old-migration-opportunities.md` clasifica ya `linked editing` como absorbido, deja `folding`, `inlay hints` y resúmenes extra de `code lens` como parciales aprovechables, y aisla `child/report/column occurrences` como frente específico de `B344`;
- `src/server/features/linkedEditing.ts` reutiliza `queryContext` + `references` sobre el documento activo y sólo publica rangos editables cuando la resolución es única, `local-scope` y el símbolo pertenece a `Local` o `Argumento`;
- `src/server/handlers/featureHandlers.ts`, `lifecycleHandlers.ts` y `server.ts` anuncian y sirven `linkedEditingRangeProvider` con los mismos readiness/confidence gates de rename/references, sin abrir host cliente ni índices heredados;
- `test/server/unit/linkedEditing.test.ts` fija parámetros, locales y el caso peligroso de homónimo en otro callable, mientras `architectureImports.test.ts` protege la integración contra imports prohibidos.

---

## 2. Por qué es prioritario

`B344` pasa a ser el siguiente foco natural porque:

- `B342` ya aisló qué parte de `plugin_old` era heurística de símbolos genérica y cuál seguía siendo deuda DataWindow específica;
- los casos `child/report/column occurrences` siguen siendo la principal brecha útil confirmada por la auditoría legacy y deben entrar ahora como fixtures/reglas sobre `DataWindowModel`, no como providers heredados;
- `B327` y `B342` dejan ya cerrados el catálogo DataWindow reusable y la primera heurística `plugin_old`, así que el siguiente trabajo puede centrarse en bindings edge-case reales sin reabrir infraestructura.

---

## 3. Trabajo permitido ahora

- extraer fixtures o reglas DataWindow de `plugin_old` que sigan aportando valor para `child`, `report(...)`, `column occurrences` y `dddw` sin parsear DataWindow como PowerScript;
- extender resolvers/bindings actuales sólo cuando el `DataWindowModel`, el binding `DataObject` y la confidence sostengan el resultado;
- reforzar tests unitarios o golden `.srd` focales y actualizar `docs/plugin-old-migration-opportunities.md` con qué edge cases quedaron absorbidos y cuáles degradan honestamente.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B342` salvo regresión real en linked editing o drift documental de la matriz ya cerrada;
- portar providers DataWindow completos de `plugin_old` o mezclar host cliente legacy en el servidor nuevo;
- parsear `.srd` como PowerScript para cubrir edge cases que deben seguir viviendo sobre `DataWindowModel` y bindings actuales;
- abrir heurísticas genéricas nuevas fuera de DataWindow mientras `B344` siga siendo el siguiente bloqueo real.

---

## 5. Criterios de salida del foco actual

- fixtures/reglas representativas cubren edge cases DataWindow `child/report/column occurrences` sin abrir un parser paralelo ni un provider host heredado;
- la degradación frente a bindings dinámicos sigue siendo honesta y defendible sobre el backbone actual;
- `plugin-old-migration-opportunities`, `testing`, `backlog`, `done-log`, `current-focus` y la guía técnica DataWindow quedan alineados con el estado real del corte.

---

## 6. Siguiente foco natural

1. `B344` — DataWindow binding edge cases from plugin_old.
2. `B354` — Server runtime orchestration decomposition.
3. `B292` — PowerBuilder preprocessor / conditional patterns investigation.

---

## 7. Regla final

`B344` debe tratar `plugin_old` sólo como fuente de fixtures y reglas DataWindow probadas. Ningún edge case justifica reintroducir su arquitectura ni sacar DataWindow fuera del backbone actual.
