# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B342 — Extract proven symbol heuristics from plugin_old`

Estado actual: `B327` queda cerrada. La spec `388-datawindow-constants-and-property-path-catalog` deja ya `datawindow-constants` publicado como dominio `generated` derivado del rail oficial de enumerados DataWindow, `datawindow-properties` reforzado con el contrato raíz `DataWindow.T -> Table` y los consumers existentes (`completion`, `signatureHelp`, `Describe/Modify/Object`) reusando esos dominios sin hardcodes nuevos.

La evidencia cerrada que deja `B327` es:

- `src/server/knowledge/system/generated/dataWindowConstants.generated.ts` proyecta tipos y valores oficiales de la referencia DataWindow sobre el dominio `datawindow-constants` sin abrir una segunda fuente de verdad ni duplicar el vocabulario PowerScript global;
- `src/server/knowledge/system/services/queryService.ts` y `src/server/knowledge/system/SystemCatalog.ts` publican queries owner-scoped (`listDataWindowConstants*`) y mantienen `listValuesForEnumeratedType()` aislado del dominio nuevo, preservando el orden visible ya fijado por el rail enumerado general;
- `src/server/features/completion.ts` y `signatureHelp.ts` consumen `datawindow-constants` sólo para argumentos member-scoped DataWindow (`RowsMove`, `Retrieve`, `Update`), mientras `dataWindowPropertyPaths.ts` mantiene el serving catalog-driven de `Describe/Modify/Object` y congela el prefijo raíz `DataWindow.T`;
- `test/server/unit/systemCatalog.test.ts`, `completion.test.ts` y `signatureHelp.test.ts` fijan la ausencia de contaminación del dominio `enumerated-values`, el serving DataWindow-scoped de `DWBuffer`/`Primary!` y el root completion `Modify("DataWindow.T")`.

---

## 2. Por qué es prioritario

`B342` pasa a ser el siguiente foco natural porque:

- `B344` depende explícitamente de `B342`, así que no conviene abrir edge cases DataWindow de `plugin_old` antes de auditar qué heurísticas siguen siendo valiosas, cuáles ya viven en el repo y cuáles serían unsafe hoy;
- el cierre de `B327` deja la base DataWindow más estable, de modo que la siguiente extracción desde `plugin_old` puede centrarse en heurísticas probadas y no en más infraestructura de catálogo;
- `plugin_old` aún contiene valor potencial en linked editing, inlay hints, folding y otras heurísticas de símbolos, pero sólo debe entrar como matriz auditada más adaptación al backbone actual (`KnowledgeBase`, snapshots, query service), nunca como provider paralelo.

---

## 3. Trabajo permitido ahora

- actualizar la matriz `already implemented / partial / valuable gap / obsolete / unsafe` contra `plugin_old` con evidencia real por heurística;
- adaptar como máximo la primera heurística demostrablemente valiosa al runtime actual, reutilizando `KnowledgeBase`, snapshots y queries existentes;
- reforzar tests focales y `docs/plugin-old-migration-opportunities.md` sin arrastrar providers cliente completos del plugin legacy;
- preparar el camino de `B344` dejando explícito qué edge cases DataWindow siguen pendientes y cuáles ya quedaron absorbidos por `B287`, `B320` y `B327`.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B327` salvo drift real en `datawindow-constants` o `datawindow-properties` ya cerrados;
- portar heurísticas o providers de `plugin_old` de forma literal en vez de extraer reglas o fixtures adaptadas;
- abrir `B344` antes de cerrar la auditoría base de `B342`, salvo bloqueo real y documentado;
- introducir un segundo motor semántico o un rail cliente específico para conocimiento heredado de `plugin_old`.

---

## 5. Criterios de salida del foco actual

- la matriz de `plugin_old` queda actualizada y defendible con clasificación `already implemented / partial / valuable gap / obsolete / unsafe`;
- al menos una heurística probada se adapta al backbone actual sin abrir providers paralelos ni scans globales en hot path;
- `plugin-old-migration-opportunities`, `testing`, `backlog`, `done-log` y `current-focus` quedan alineados con el estado real del corte.

---

## 6. Siguiente foco natural

1. `B342` — Extract proven symbol heuristics from plugin_old.
2. `B344` — DataWindow binding edge cases from plugin_old.
3. `B354` — Server runtime orchestration decomposition.

---

## 7. Regla final

`plugin_old` sólo puede alimentar heurísticas, fixtures y evidencia. Ningún slice nuevo debe reintroducir su arquitectura ni crear un motor paralelo al backbone actual del runtime.
