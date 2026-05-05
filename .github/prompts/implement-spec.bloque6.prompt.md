# BLOQUE 6 — DataWindow Fast Mode & Boundary Hardening

> Objetivo: consolidar una ruta rápida, segura y mantenible para DataWindow/DataStore/DataWindowChild en hot path interactivo (`hover`, `completion`, `definition`, `signatureHelp`, diagnostics y semantic tokens), sin tratar `.srd` como PowerScript, sin crear parser nuevo y sin duplicar binding logic repartida entre features.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- `DataWindowModel` ya es el modelo canónico de DataWindow dentro del plugin.
- Existen módulos como `dataWindowModel.ts`, `dataWindowBindingModel.ts`, `dataWindowColumnAccess.ts`, `dataWindowPropertyPaths.ts`, `dataWindowSafeMode.ts` y `dataWindowSqlLineage.ts`.
- El glue de bindings, property paths y column access está repartido entre varias features.
- `hover`, `completion`, `definition`, `signatureHelp`, diagnostics y semantic tokens consumen DataWindow de forma parcial.
- `DataWindow model cache` está documentado como `partial`.
- La auditoría detecta duplicidad alta o parcial en DataWindow binding resolution.
- La frontera `.srd` / DataWindow debe mantenerse separada de PowerScript.

Patrones oficiales y externos aplicados:

- **DataWindow no es PowerScript genérico:** DataWindow objects tienen propiedades, controles, expresiones y métodos específicos; no deben parsearse como código PowerScript normal.
- **Describe/Modify son dinámicos y costosos de modelar:** Appeon documenta que `Describe` puede consultar propiedades y evaluar expresiones, y que `Modify/Describe` permiten nombres dinámicos, con ventajas y drawbacks; por tanto, el hot path debe evitar inferencia agresiva sobre strings dinámicos.
- **DataWindow/DataStore/DataWindowChild comparten superficie:** muchas APIs aplican a DataWindow control, DataStore y DataWindowChild; el modelo rápido debe reconocer esos owners sin duplicar catálogo.
- **Buffers oficiales:** `Primary!`, `Delete!` y `Filter!` son valores oficiales de `DWBuffer` y deben tratarse desde catálogo/enum owner, no hardcodes dispersos.
- **High-confidence first:** el hot path solo debe exponer resultados DataWindow defendibles; lo dinámico o ambiguo debe degradar a `unknown/low confidence`.
- **Adapters por feature:** hover/completion/definition/signatureHelp no deben implementar su propia lógica de binding DataWindow.

---

## Dependencia de Bloques previos

Este bloque se beneficia de:

- `DEVTOOLS-HOTPATH-01` — Observabilidad real de serving interactivo.
- `DEVTOOLS-HOTPATH-02` — Guards no IO/no workspace scan/no full parse.
- `DEVTOOLS-SERVING-03` — ActiveDocumentServingSnapshot read-only.
- `DEVTOOLS-SERVING-04` — ViewModel cache key contract.
- `SEMANTIC-FACADE-01` — Fachada read-only de queries semánticas.
- `SEMANTIC-OWNER-03` — Receiver type resolver owner.

Si alguna dependencia no está cerrada, este bloque debe limitarse a owner/boundary/tests y no debe introducir una ruta rápida global que duplique semántica.

---

## Estado de ítems anteriores

### Superseded / Reestructurado

- `DEVTOOLS-DW-01` → se reestructura en:
  - `DW-FAST-01` — DataWindowFastContext high-confidence.
  - `DW-FAST-02` — DataWindow binding owner y confidence policy.
  - `DW-FAST-03` — DataWindow serving adapters por feature.
  - `DW-FAST-04` — DataWindow property path / column access contract.
  - `DW-FAST-05` — DataWindow dynamic/Describe/Modify policy.
  - `DW-FAST-06` — DataWindow tests de frontera y no-parse PowerScript.
  - `DW-FAST-07` — DataWindow SQL lineage safe integration.

### Relacionados pero NO sustituidos aquí

- `SEMANTIC-OWNER-03` sigue siendo owner general de receiver type.
- `SEMANTIC-OWNER-06` sigue siendo owner de enums generales.
- `PRESENTATION-*` seguirá definiendo cómo se proyecta DataWindow a ViewModels visibles.

---

## Cadena recomendada — Bloque 6

Orden obligatorio dentro del bloque:

1. `DW-BOUNDARY-01` — Frontera DataWindow/DataStore/DataWindowChild y no-parse PowerScript.
2. `DW-FAST-01` — DataWindowFastContext high-confidence.
3. `DW-FAST-02` — DataWindow binding owner y confidence policy.
4. `DW-FAST-03` — DataWindow serving adapters por feature.
5. `DW-FAST-04` — DataWindow property paths, columns y buffers contract.
6. `DW-FAST-05` — Describe/Modify/dynamic strings safe policy.
7. `DW-FAST-06` — DataWindow tests de frontera, hot path y regression matrix.
8. `DW-FAST-07` — DataWindow SQL lineage safe integration.

---

# FASE A — Frontera y modelo rápido

## DW-BOUNDARY-01 — Frontera DataWindow/DataStore/DataWindowChild y no-parse PowerScript

- **Priority:** P1.
- **Status:** Open.
- **Area:** datawindow, architecture, parser-boundary.
- **Problem:**
  - DataWindow tiene sintaxis, propiedades, controles, expresiones y source containers propios.
  - Cualquier intento de tratar `.srd` como PowerScript genérico puede generar falsos positivos, latencia y semántica incorrecta.
- **Goal:**
  - Blindar explícitamente la frontera DataWindow/DataStore/DataWindowChild para todos los consumers.
- **Acceptance criteria:**
  - `srContainerParser.ts` y `dataWindowSafeMode.ts` quedan documentados como frontera DataWindow/PowerScript.
  - `.srd` y DataWindow sources no se parsean como PowerScript normal.
  - DataWindow, DataStore y DataWindowChild quedan modelados como owners relacionados pero distinguibles.
  - Features interactivas consultan DataWindow mediante modelo/adapters, no mediante parsing PowerScript genérico.
  - Tests fallan si una ruta de DataWindow entra en parser PowerScript general sin safe mode explícito.
  - Docs reflejan que DataWindow es dominio separado.
- **Implementation notes:**
  - No crear parser nuevo.
  - No cambiar parsing existente salvo guards/boundaries.
  - Si hay excepciones legacy, documentarlas con reason code.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - `.srd` no entra en PowerScript parser normal.
  - DataWindow container se enruta por safe mode.
  - DataStore receiver se reconoce sin tratarse como UI control.
  - DataWindowChild se distingue de DataWindow control.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- **Dependencies:** ninguna dura.
- **Risk:** alto; frontera mal definida puede romper DataWindow y semántica PowerScript al mismo tiempo.
- **Exit criteria:**
  - Queda impedido por tests y docs que DataWindow se trate como PowerScript genérico.

---

## DW-FAST-01 — DataWindowFastContext high-confidence

- **Priority:** P1.
- **Status:** Open.
- **Area:** datawindow, performance, serving, active-document.
- **Problem:**
  - `DataWindowModel` es canónico, pero hover/completion/definition/signatureHelp necesitan una vista rápida de alta confianza para el documento activo.
  - El glue de bindings, columns, property paths y built-ins DataWindow está repartido.
- **Goal:**
  - Crear `DataWindowFastContext` o equivalente como vista rápida, read-only y high-confidence para hot path interactivo.
- **Acceptance criteria:**
  - Existe `DataWindowFastContext` o equivalente.
  - Es read-only y derivado de `DataWindowModel`, `dataWindowBindingModel`, `SystemCatalog` y contexto activo.
  - No crea parser nuevo ni copia semántica global.
  - Solo expone datos high-confidence en hot path.
  - Expone, como mínimo:
    - receiver kind: DataWindow control, DataStore, DataWindowChild, unknown;
    - DataObject literal si existe;
    - columns conocidas;
    - property paths seguras;
    - buffers oficiales;
    - built-ins/methods owner-aware;
    - binding confidence y reason.
  - Casos dinámicos degradan a `unknown/low confidence`, no a certeza falsa.
  - Invalida por URI, documentVersion, `semanticEpoch`, sourceOrigin y cambio de binding/DataObject.
  - No hace IO, workspace scan ni full parse en hot path caliente.
- **Implementation notes:**
  - Debe integrarse con `ActiveDocumentServingSnapshot` si existe, pero no depender de rediseñar todo el snapshot.
  - No intentar resolver todos los `Describe/Modify` dinámicos.
  - No interpretar SQL dinámico complejo.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - DataWindow control con DataObject literal.
  - DataStore con DataObject literal.
  - DataWindowChild obtenido por `GetChild` con confidence limitada.
  - Unknown/dynamic DataObject degrada a unknown.
  - Columns conocidas se exponen solo con binding fiable.
  - No IO/no scan/no full parse en cache caliente.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DW-BOUNDARY-01`
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-SERVING-03` recomendado.
- **Risk:** alto; si se convierte en segundo DataWindowModel o infiere dinámicos agresivamente, rompe precisión semántica.
- **Exit criteria:**
  - Hay una vista rápida DataWindow high-confidence para hot path, sin duplicar parser ni modelo canónico.

---

# FASE B — Binding owner y adapters

## DW-FAST-02 — DataWindow binding owner y confidence policy

- **Priority:** P1.
- **Status:** Open.
- **Area:** datawindow, binding, confidence, semantics.
- **Problem:**
  - Binding DataWindow aparece repartido entre `dataWindowBindingModel.ts`, `completion`, `hover`, `definition`, `signatureHelp` y diagnostics.
  - Sin owner y confidence policy común, cada feature puede resolver bindings de forma distinta.
- **Goal:**
  - Consolidar `dataWindowBindingModel.ts` o equivalente como owner de binding DataWindow y política de confianza.
- **Acceptance criteria:**
  - Existe owner explícito de binding DataWindow.
  - Binding result incluye receiver, DataObject, source, confidence, reasonCodes y dynamic flags.
  - Features no implementan binding logic propia salvo adapter ligero.
  - Se distinguen claramente:
    - DataObject literal;
    - assignment simple defendible;
    - inherited/control metadata;
    - GetChild/DataWindowChild;
    - dynamic string;
    - unknown.
  - Dynamic/ambiguous binding nunca se presenta como high confidence.
  - Tests cubren high/medium/low/unknown confidence.
- **Implementation notes:**
  - No resolver dinámicos complejos aquí.
  - No mezclar binding DataWindow con receiver type general sin adapter claro.
  - Coordinar con `SEMANTIC-OWNER-03` para receiver type.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DW-FAST-01`
  - `SEMANTIC-OWNER-03` recomendado.
- **Risk:** alto.
- **Exit criteria:**
  - Binding DataWindow tiene owner y confidence policy única.

---

## DW-FAST-03 — DataWindow serving adapters por feature

- **Priority:** P2.
- **Status:** Open.
- **Area:** datawindow, hover, completion, definition, signatureHelp.
- **Problem:**
  - Cada feature puede adaptar DataWindow de forma distinta, duplicando property/binding/method logic.
- **Goal:**
  - Crear adapters ligeros comunes sobre `DataWindowFastContext` para features LSP.
- **Acceptance criteria:**
  - Existe adapter común o conjunto pequeño de adapters para:
    - hover;
    - completion;
    - definition;
    - signatureHelp;
    - diagnostics;
    - semanticTokens si aplica.
  - Adapters consumen `DataWindowFastContext`, no reimplementan binding.
  - Hover muestra DataWindow info solo con high/medium confidence clara.
  - Completion sugiere métodos/properties/columns solo según confidence.
  - Definition navega a DataWindow/column/property solo si la ubicación es defendible.
  - SignatureHelp resuelve built-ins DataWindow solo con owner fiable.
  - Tests cubren cada feature con high-confidence y unknown/dynamic cases.
- **Implementation notes:**
  - No implementar UX final de hover/completion aquí si ya pertenece a Bloques 2/3; solo adapters DataWindow.
  - Mantener reason codes para diagnostics/AI futuros.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DW-FAST-01`
  - `DW-FAST-02`
- **Risk:** alto; adapters mal diseñados pueden duplicar lo que intentan centralizar.
- **Exit criteria:**
  - Features LSP consumen DataWindow mediante adapters comunes y no duplican binding logic.

---

# FASE C — Property paths, columns, buffers y dinámicos

## DW-FAST-04 — DataWindow property paths, columns y buffers contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** datawindow, columns, properties, buffers, catalog.
- **Problem:**
  - Column access, property paths y buffers oficiales pueden aparecer en varias features y deben ser consistentes.
- **Goal:**
  - Definir contrato único para columnas, property paths y buffers DataWindow/DataStore/DataWindowChild.
- **Acceptance criteria:**
  - `dataWindowColumnAccess.ts` queda como owner de column access.
  - `dataWindowPropertyPaths.ts` queda como owner de property paths seguras.
  - Buffers oficiales `Primary!`, `Delete!`, `Filter!` se obtienen desde catálogo/enum owner, no hardcodes dispersos.
  - Completion/hover/diagnostics usan el mismo contrato.
  - Columnas solo se exponen cuando el DataObject/binding es defendible.
  - Property paths dinámicos degradan a unknown/low confidence.
  - Tests cubren columns, properties, buffers y invalidación.
- **Implementation notes:**
  - No duplicar catálogo de DataWindow methods/properties.
  - Coordinar con SystemCatalog para built-ins y enums.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DW-FAST-01`
  - `DW-FAST-02`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Column/property/buffer logic queda centralizada y consistente entre features.

---

## DW-FAST-05 — Describe/Modify/dynamic strings safe policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** datawindow, dynamic-analysis, describe-modify, safety.
- **Problem:**
  - `Describe` y `Modify` permiten consultas/modificaciones dinámicas de propiedades y expresiones DataWindow.
  - Inferir strings dinámicos en hot path puede ser costoso, frágil y propenso a falsos positivos.
- **Goal:**
  - Definir política segura para `Describe`, `Modify`, dot notation, property expressions y dynamic strings.
- **Acceptance criteria:**
  - Se documenta qué patrones de `Describe/Modify` se consideran high-confidence, medium, low y unknown.
  - Hot path solo interpreta patrones literales simples y seguros.
  - Strings concatenados complejos, Evaluate dinámico, SQL dinámico o property names calculados degradan a unknown/low confidence.
  - No se ejecuta parser complejo de expresiones DataWindow en hot path.
  - Diagnostics pueden emitir warnings razonados fuera del hot path si procede.
  - Tests cubren literales simples, concatenaciones, invalid property, Evaluate y unknown dynamic.
- **Implementation notes:**
  - No bloquear uso dinámico real de PowerBuilder; solo evitar certezas falsas.
  - Mantener reason codes claros para AI/tools futuros.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DW-FAST-04`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Dynamic DataWindow strings tienen política explícita y no generan falsas certezas en hot path.

---

# FASE D — Tests, SQL lineage y cierre transversal

## DW-FAST-06 — DataWindow tests de frontera, hot path y regression matrix

- **Priority:** P1.
- **Status:** Open.
- **Area:** datawindow, testing, regression, performance.
- **Problem:**
  - La frontera y fast mode DataWindow requieren tests fuertes para evitar regressions, falsos positivos y parseos indebidos.
- **Goal:**
  - Crear matriz de regresión DataWindow para frontera, binding, columns, property paths, buffers y hot path.
- **Acceptance criteria:**
  - Tests cubren DataWindow control, DataStore, DataWindowChild, DataObject literal, columns, property paths y buffers.
  - Tests cubren dynamic/unknown binding y degradación segura.
  - Tests verifican no IO/no workspace scan/no full parse en hot path con snapshot caliente.
  - Tests verifican que `.srd` no se procesa como PowerScript genérico.
  - Tests cubren hover/completion/definition/signatureHelp adapters DataWindow cuando existan.
  - Si se requieren corpora reales, hay skip honesto y no datos simulados sin marcar.
- **Implementation notes:**
  - Preferir fixtures pequeñas y específicas antes de corpora pesadas.
  - Añadir fixtures realistas solo si no rompen tiempos de CI/local.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DW-BOUNDARY-01`
  - `DW-FAST-01`
  - `DW-FAST-02`
- **Risk:** medio.
- **Exit criteria:**
  - DataWindow fast mode y frontera quedan protegidos por una matriz de tests ejecutable.

---

## DW-FAST-07 — DataWindow SQL lineage safe integration

- **Priority:** P3.
- **Status:** Open.
- **Area:** datawindow, sql-lineage, diagnostics, confidence.
- **Problem:**
  - `dataWindowSqlLineage.ts` existe, pero SQL lineage puede volverse costoso o impreciso si se mezcla con hot path interactivo.
- **Goal:**
  - Integrar SQL lineage con DataWindowFastContext solo como evidencia segura y no bloqueante.
- **Acceptance criteria:**
  - SQL lineage no se calcula de forma profunda en hover/completion hot path.
  - Si lineage ya está disponible y es high-confidence, puede enriquecer diagnostics/reports o hover compacto según policy.
  - Lineage dinámico o PBSELECT sin conexión se marca con confidence/reason apropiado.
  - No se ejecutan consultas DB ni dependencias externas.
  - Tests cubren lineage available, unknown, dynamic y no-hot-path computation.
- **Implementation notes:**
  - No intentar resolver DB runtime.
  - No convertir SQL lineage en dependencia dura de DataWindowFastContext.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- **Dependencies:**
  - `DW-FAST-01`
  - `DW-FAST-05`
- **Risk:** medio.
- **Exit criteria:**
  - SQL lineage queda como evidencia segura, no como cálculo obligatorio de hot path.

---

## Resultado esperado al cerrar el Bloque 6

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. DataWindow/DataStore/DataWindowChild tienen frontera explícita y documentada.
2. `.srd` no se trata como PowerScript genérico.
3. Existe DataWindowFastContext o equivalente high-confidence y read-only.
4. Binding DataWindow tiene owner y confidence policy clara.
5. Hover/completion/definition/signatureHelp consumen DataWindow mediante adapters comunes.
6. Columns, property paths y buffers oficiales tienen contrato centralizado.
7. Describe/Modify/dynamic strings tienen política safe y no generan falsas certezas.
8. DataWindow SQL lineage no bloquea hot path ni ejecuta dependencias externas.
9. Tests cubren frontera, hot path, binding, columns, dynamic/unknown y no-parse PowerScript.
10. No se ha creado un segundo parser, DataWindowModel ni catálogo paralelo.
11. docs/backlog/testing/performance-budget/technical-guide/architecture-implementation-map quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — DataWindow Fast Mode & Boundary Hardening

## Scope

- DW-BOUNDARY-01
- DW-FAST-01
- DW-FAST-02
- DW-FAST-06

## Optional within same focus only if previous items are closed

- DW-FAST-03
- DW-FAST-04

## Explicitly out of scope

- New DataWindow parser
- Treating .srd as PowerScript
- Deep dynamic Describe/Modify analysis in hot path
- SQL runtime/database execution
- Full DataWindow advanced mode
- Broad resolver consolidation outside DataWindow bindings

## Exit criteria

- DataWindow boundary is explicit and tested.
- DataWindowFastContext exists or equivalent high-confidence path is implemented.
- Binding owner/confidence policy is documented and tested.
- Hot path remains no IO/no workspace scan/no full parse.
```

---