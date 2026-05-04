# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B327 — DataWindow constants and property path catalog`

Estado actual: `B320` queda cerrada. El runtime ya publica `datawindow-properties` y `datawindow-expression-functions` como dominios de catálogo diferenciados, ambos limitados a contexto DataWindow defendible y sin mezclar expresiones/paths con PowerScript general.

La evidencia vigente que deja `B320` es:

- `src/server/knowledge/system/manual/datawindow/dataWindowProperties.ts` y `dataWindowExpressionFunctions.ts` publican el subconjunto oficial/curado de property paths (`DataWindow.*`, `dddw`, `dddw.name`) y la lista oficial de funciones de expresión tomada de la referencia Appeon 2025, con namespaces `datawindow` y `datawindow-expression` separados;
- `src/server/knowledge/system/manual/index.ts`, `src/server/knowledge/system/services/queryService.ts` y `src/server/knowledge/system/SystemCatalog.ts` indexan ambos dominios dentro de `manual-core` sin scans globales ni un registry paralelo;
- `src/server/features/dataWindowPropertyPaths.ts` reconsume `datawindow-properties` para completion/hover/definition/diagnostics de `Describe/Modify/Object` y `src/server/features/completion.ts` consume `datawindow-expression-functions` sólo dentro de expresiones `.srd`;
- `test/server/unit/systemCatalog.test.ts`, `completion.test.ts`, `hover.test.ts`, `definition.test.ts` y `diagnostics.test.ts` fijan el lookup `CurrentRow`/`Sum`, el subconjunto `DataWindow.Table.Select`/`dddw.name` y la ausencia de serving fuera de contexto defendible.

Con `B320` ya cerrado, el siguiente cuello de botella vuelve a ser ampliar el catálogo reutilizable de constantes y property paths DataWindow sin duplicar listas locales en consumers.

---

## 2. Por qué es prioritario

`B327` pasa a ser el siguiente paso natural porque:

- `B320` ya dejó el catálogo base de expresiones y propiedades oficiales servido por el runtime;
- el hueco que queda ahora es extender ese backbone con constantes y property paths adicionales reutilizables por `Describe/Modify/Object` sin volver a hardcodes;
- `B327` puede apoyarse ya en índices y consumers reales cerrados en `B320`, sin reabrir decisiones de arquitectura ni de source-of-truth.

---

## 3. Trabajo permitido ahora

- ampliar constantes y property paths DataWindow reutilizables sobre el catálogo ya oficializado en `B320`;
- reforzar consumers DataWindow existentes con ese mismo source-of-truth sin abrir listas locales paralelas;
- seguir usando el backbone actual (`DataWindowModel` + `SystemCatalog`) en vez de introducir un segundo rail semántico DataWindow.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B320` salvo drift real en los dominios `datawindow-properties` o `datawindow-expression-functions` ya cerrados;
- duplicar constants/property paths DataWindow en providers o tests en vez de consumir el catálogo ya publicado;
- mezclar expresiones o paths DataWindow con lookup global PowerScript fuera de contexto defendible;
- abrir un parser DataWindow alternativo o un segundo rail de serving para constants/property paths.

---

## 5. Criterios de salida del foco actual

- el catálogo DataWindow oficial cubre constantes y property paths priorizados con contratos y fixtures defendibles;
- la semántica nueva sigue alimentando surfaces existentes sin abrir un segundo rail DataWindow ad hoc;
- `architecture`, `testing`, `developer-workflows`, `backlog`, `done-log`, `current-focus` y el context pack IA quedan alineados con el nuevo estado real.

---

## 6. Siguiente foco natural

1. `B327` — DataWindow constants and property path catalog.
2. `B342` — Extract proven symbol heuristics from plugin_old.
3. `B329` — Catalog-driven semantic tokens integration.

---

## 7. Regla final

`B327` debe extender el backbone catalog-driven DataWindow recién cerrado por `B320` sin volver a listas hardcodeadas ni a un segundo rail semántico.
