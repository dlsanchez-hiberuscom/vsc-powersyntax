# Rules Catalog — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento gobierna las reglas diagnósticas del plugin.

Cada regla debe tener:

- ID estable;
- severidad por defecto;
- readiness mínima;
- confidence mínima;
- alcance;
- riesgo de falso positivo;
- pruebas asociadas.

---

## 2. Plantilla de regla

```md
## PB-XXX-000 — Nombre de la regla

- **Estado:** draft | active | deprecated
- **Severidad default:** info | warning | error
- **Readiness mínima:** structural-only | nearby-semantic-ready | project-semantic-ready | workspace-semantic-ready
- **Confidence mínima:** low | medium | high
- **Aplica a:** ...
- **Falso positivo esperado:** bajo | medio | alto
- **Tests:** ...
- **Docs relacionadas:** ...
```

---

## 3. Reglas estructurales SR*

## 3.0 Contrato emitido actual

Política vigente cerrada en `B232`:

- el contrato público estable para tooling, snapshots, quick-fixes y troubleshooting es `diagnostic.code`;
- algunos diagnósticos legacy todavía pueden conservar `source` con sufijo `PowerScript:SDx`, pero ese sufijo queda solo como compatibilidad hacia atrás y no debe usarse como clave primaria nueva;
- los IDs `PB-*` de este catálogo siguen gobernando la taxonomía objetivo y la nomenclatura documental, pero no se anuncian como IDs emitidos por el runtime actual sin una spec de migración/alias explícita.

IDs emitidos hoy:

- `SD2` — llamada a callable no resuelto en la jerarquía del objeto ni en el catálogo del lenguaje.
- `SD3` — tipo base ausente del workspace y del catálogo runtime.
- `SD4` — variable local no usada.
- `SD5` — variable privada de instancia no usada.
- `SD6` — shadowing de variable local sobre ámbito más amplio.
- `SD7` — llamada a función obsoleta con sugerencia de reemplazo cuando aplica.
- `SD8` — declaración duplicada en el mismo scope.
- `SD9` — `return` fuera de callable.
- `SD10` — `exit`/`continue` fuera de bucle válido.
- `SD11` — código inalcanzable tras `return`.
- `SD12` — paréntesis desbalanceados.
- `SD13` — función con return type sin `return`.
- `enum-value-context-mismatch` — valor enumerado incompatible con el tipo esperado inequívoco en propiedad o parámetro catalog-driven.
- `dataobject-not-found`, `dataobject-ambiguous`, `dataobject-dynamic`, `retrieve-arity-mismatch`, `datawindow-expression-dependency-unresolved` — familia actual de DataWindow/DataObject.
- `transaction-binding-missing`, `transaction-binding-unknown`, `transaction-binding-dynamic` — binding transaccional insuficiente para `Retrieve/Update`.
- `native-dependency` — external function/subroutine sin implementación interna navegable.
- `missing-super-*`, `missing-trigger-*`, `unresolved-*` — familia actual de warnings lifecycle emitidos en `diagnostic.code`.

Consumidores cerrados sobre este contrato:

- `technical-debt-report` reutiliza `diagnostic.code` como evidencia (`SD7`, familia DataWindow, `native-dependency`, lifecycle/sourceOrigin ya publicados) y no define IDs nuevos;
- el framework v2 de code actions consume también `diagnostic.code` estable y solo habilita quick fixes cuando el catálogo versionado, el preflight, el `sourceOrigin` y los guards de dynamic strings permiten un cambio defendible;
- `B291` añade `embeddedSqlAnchors` explicables en context packs, code metrics, debt report y support bundle, pero no introduce `diagnostic.code` nuevos: reutiliza el binding transaccional existente y evidencia read-only fuera del carril de diagnostics;
- cualquier ampliación futura del reporte que necesite una señal diagnóstica nueva debe abrir una spec/rule propia antes de mezclarse con este catálogo.

Nota de catálogo 2026-05-03:

- las entradas de catálogo v2 pueden alimentar diagnostics solo cuando el contexto y la confidence sean suficientes;
- no se habilitan diagnósticos agresivos de unknown keyword/operator/enum por el hecho de existir dominios `keywords`, `operators`, `enumerated-types` o `enumerated-values`;
- el cierre de `B359` amplía la cobertura curada de `system-object-datatypes` runtime/nonvisual e integration moderna (`manual/runtime` + `manual/integration`), pero esa ampliación no introduce por sí sola reglas diagnósticas nuevas: hover/completion/signatureHelp consumen el catálogo enriquecido antes que diagnostics agresivos;
- el cierre de `B360` normaliza el modelo `enumerated-type` / `enumerated-value`, pero esa separación no autoriza diagnósticos especulativos de membership: diagnostics solo puede usar valores enumerados cuando el tipo esperado sea explícito y la confidence lo sostenga;
- DataWindow expression/property catalog queda separado en B320/B327 y no debe producir warnings fuera de contexto DataWindow defendible.

Regla: cualquier renombrado futuro hacia `PB-*` requiere compatibilidad explícita o alias y una spec propia; no cambiar IDs diagnósticos emitidos como edición documental aislada.

## PB-STRUCT-001 — Forward type does not match global type

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
- **Aplica a:** `.sra`, `.srw`, `.sru`, `.srm`, `.srf`
- **Falso positivo esperado:** medio en legacy exportado parcialmente
- **Tests:** container parser fixtures

## PB-STRUCT-002 — Prototype without implementation

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
- **Aplica a:** functions/events con prototypes
- **Falso positivo esperado:** medio en código parcial

## PB-STRUCT-003 — Prototype signature differs from implementation

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** high
- **Aplica a:** prototypes + implementations

---

## 4. Reglas de símbolos

## 4.0 Contrato vigente de ambigüedad semántica

Estado operativo tras `B280`:

- `distance-minimum` identifica empates reales de distancia mínima dentro del winner path semántico y se publica con `distance-ambiguity`;
- `global-fallback` ambiguo identifica varios winners tras caer al fallback global y se publica con `fallback-ambiguity`;
- `source-origin-conflict` se emite cuando el winner queda resuelto por prioridad de `sourceOrigin` descartando origins más débiles como `orca-staging`;
- `queryContext`, hover, definition, references y rename deben consumir esta señal compartida desde el query engine y no volver a inferir ambigüedad local por nombre visible o por conteo plano de candidatos.

## 4.1 Contrato vigente de riesgo de invocación

Estado operativo tras `B282`:

- el contrato público usa `invocationRisk = safe | inherited | fallback | dynamic | external`;
- `fallback` cubre resolución por fallback semántico, evidencia descartada o `sourceOrigin` no canónico de baja autoridad;
- `dynamic` cubre strings dinámicos, bindings DataWindow dinámicos/ambiguos/missing, `orca-staging`, catálogos transitorios no oficiales y patrones WebView/HTTP/DataWindow/eventos defendiblemente dinámicos; el dataset `generated` oficial del system catalog ya no entra aquí por sí solo tras `B367`;
- `external` cubre dependencias nativas externas sin implementación interna segura;
- la coexistencia `manual-core + generated` es una decisión de provenance/overlay del catálogo y no debe degradar por sí sola el riesgo de invocación cuando la entrada resuelta conserva autoridad oficial suficiente;
- tras `B369`, esa policy deja de ser solo provisional y queda ratificada por la decision gate del catálogo: `generated` es la base contractual en dominios oficiales, `override` manual gana, `enrichment` se fusiona sobre base `generated`, `candidate` no entra en resolución/listado interactivo y solo `datawindow-events`, `operators`, `pronouns` y `system-globals` permanecen `manual-primary` por ausencia de rail oficial equivalente;
- `rename`, `safeEditPlan` y code actions deben bloquear antes de editar cuando el riesgo sea `dynamic`, `fallback` o `external`;
- `references` puede degradar a declaraciones o devolver vacío si se piden solo usos textuales con riesgo dinámico;
- ninguna regla diagnóstica nueva debe inventarse solo para materializar este riesgo: la señal vive como metadata de query/impact/edit, no como warning agresivo por defecto.

## 4.2 Contrato vigente de localización documental del catálogo

Estado operativo tras `B371`:

- la localización del system catalog se limita a campos documentales visibles (`summary`, `documentation`, `usageNotes`, `limitations`, `obsoleteMessage`, `returnDocumentation`, `parameter.documentation`, `eventReturnCodes.meaning` y `category` solo si es UX-visible);
- `name`, `id`, `lookupKeys`, `normalizedName`, `ownerTypes`, `domain`, `kind`, `namespace`, `invocation`, `signatures.label`, nombres reales de funciones/eventos, datatypes, enum values y `sourceUrl` no se traducen nunca;
- los overlays localizados se resuelven por `targetId` o `targetKey` estable contra la entry canónica del bucket runtime, respetando la policy `generated-primary-with-manual-overlays` ya fijada por `B369`;
- desde `B374`, `buildCatalogConsistencyReport().localization` publica además `domainCoverage`, `incompleteOverlays` e `invalidParameterTargets`, de modo que un overlay sin target resoluble, incompleto o con `signatureLabel`/`parameterName` traducidos se detecta como problema de gobernanza del catálogo antes de llegar a hover/completion/signatureHelp;
- desde `B375`, si `targetId` queda obsoleto pero `targetKey` todavía resuelve de forma única, el runtime recupera la overlay y publica `recoveredTargetIds`; la reconciliación del source se hace con tooling offline, nunca durante el serving interactivo;
- los IDs diagnósticos, `reason codes`, severidades y gates de readiness/confidence no cambian por locale: la localización afecta solo presentación/documentación visible, no el contrato semántico de reglas.

## PB-SYM-001 — Unresolved symbol

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** references, calls, member access
- **Falso positivo esperado:** alto si hay dynamic calls o external/native dependencies

## PB-SYM-002 — Shadowing

- **Estado:** active
- **ID emitido actual:** `SD6`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** local/shared/global/instance resolution

## PB-SYM-003 — Unused variable

- **Estado:** active
- **IDs emitidos actuales:** `SD4`, `SD5`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** medium
- **Aplica a:** local variables y parámetros según contexto

## PB-SYM-004 — Enumerated value incompatible with expected context

- **Estado:** active
- **ID emitido actual:** `enum-value-context-mismatch`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** literales enumerados con `!` cuando una propiedad o firma catalog-driven fija un tipo esperado inequívoco
- **Falso positivo esperado:** bajo, porque no aplica a llamadas dinámicas, expresiones, variables ni contextos ambiguos
- **Tests:** `test/server/unit/diagnostics.test.ts`, `test/server/unit/completion.test.ts`, `test/server/unit/signatureHelp.test.ts`
- **Docs relacionadas:** `specs/377-catalog-driven-enum-consumers/spec.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 5. Reglas DataWindow

## PB-DW-001 — DataWindow not found

- **Estado:** active
- **ID emitido actual:** `dataobject-not-found`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** medium
- **Aplica a:** `DataObject = "d_xxx"` cuando no existe un `.srd` único indexado

## PB-DW-002 — Retrieve argument count mismatch

- **Estado:** active
- **ID emitido actual:** `retrieve-arity-mismatch`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** `dw_1.Retrieve(...)`, `lds.Retrieve(...)` cuando el `DataObject` literal enlaza con un `.srd` único y la aridad no coincide con `arguments=(...)`

## PB-DW-003 — DataObject assignment cannot be resolved

- **Estado:** active
- **IDs emitidos actuales:** `dataobject-ambiguous`, `dataobject-dynamic`
- **Severidad default:** info
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** low
- **Aplica a:** `DataObject` dinámico o literal ambiguo, cuando el binding no permite navegación ni serving fiable hacia un `.srd`

## PB-DW-004 — DataWindow expression dependency unresolved

- **Estado:** active
- **ID emitido actual:** `datawindow-expression-dependency-unresolved`
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** medium
- **Aplica a:** `expression=` y atributos dinámicos `~t...` dentro de `.srd` cuando una dependencia no resuelve como columna `table` o control nombrado del mismo DataWindow

---

## 6. Reglas PBL/ORCA

## PB-PBL-001 — Staging source is stale

- **Estado:** active
- **Severidad default:** error
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high

## PB-PBL-002 — Import blocked by fingerprint mismatch

- **Estado:** active
- **Severidad default:** error
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high

---

## 7. Reglas externas

## PB-PBNI-001 — Native PBX dependency detected

- **Estado:** draft
- **Severidad default:** info
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium

## PB-WEB-001 — JavaScript bridge detected

- **Estado:** draft
- **Severidad default:** info
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium

## PB-HTTP-001 — Possible hardcoded credential/token

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
