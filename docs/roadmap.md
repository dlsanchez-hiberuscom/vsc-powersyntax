# Roadmap — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 1. Objetivo de producto

Construir un plugin profesional para PowerBuilder 2025 en VS Code que combine:

1. descubrimiento e indexación muy rápidos sin bloquear;
2. latencia interactiva baja en el archivo activo;
3. núcleo semántico fuerte y reutilizable;
4. buen comportamiento en proyectos grandes y legacy;
5. valor real para el desarrollador;
6. automatización/IA solo sobre base madura.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Todo el roadmap se ordena alrededor de esta meta.

---

## 3. Principios de producto

Se prioriza siempre:

1. rendimiento percibido;
2. arquitectura limpia;
3. separación de responsabilidades;
4. atomicidad del estado semántico;
5. incrementalidad fina;
6. persistencia robusta;
7. explicabilidad/observabilidad;
8. validación real sobre corpus grandes;
9. especialización PowerBuilder;
10. automatización avanzada al final.

---

## 4. Reglas base del producto

- Soportar Workspace y Solution como modos distintos.
- En Workspace, `ws_objects` es fuente relevante.
- En Solution, carpetas `*.pbl` con `*.sr*` son fuente canónica.
- `.pb`, `build` y `_BackupFiles` se ignoran por defecto.
- Separar parser de contenedor SR* y lenguaje embebido.
- DataWindow es subdominio propio.
- PBAutoBuild es backend moderno preferente.
- ORCA/OrcaScript es integración legacy adicional.
- Toda decisión semántica relevante debe reflejarse en la guía técnica.

---

## 5. Equivalencia roadmap/backlog

| Roadmap | Backlog | Objetivo |
|---|---|---|
| Fase A | L0 | Core semántico, readiness y latencia |
| Fase B | L1 | Persistencia y reanudación |
| Fase C | L2 + L2.5 | Query engine, serving y entendimiento PowerBuilder |
| Fase D | L3 | Validación, performance y health |
| Fase E | L4 | Especialización PowerBuilder |
| Fase F | L4.5 | Plataforma abierta para automatización segura |
| Fase G | L5 | Documentación IA-first y workflows que sostienen la automatización |

---

## 6. Estado actual resumido

### Base ya conseguida

El producto ya dispone de:

- cliente ligero y servidor LSP separados;
- activación perezosa;
- symbols/hover/definition/completion/signature help base;
- backbone semántico inicial;
- topología Workspace/Solution;
- visibilidad y herencia base;
- scheduler, caches y readiness;
- parser hardening principal;
- catálogo built-in;
- tests smoke/unit/integration/performance;
- query engine unificado operativo;
- latency governor operativo;
- API pública mínima;
- diagnostics snapshot agrupado;
- hierarchy inspection y CodeLens robustecidos;
- PowerBuilder Language Knowledge Catalog v2 (keywords, reserved words, primitive datatypes, system object datatypes, pronouns, operators, system globals y enumerated values), con generator oficial/cobertura completa aún abiertos en B319-B321 y backlog derivado B322-B336.

### Lectura estratégica

La siguiente etapa no es abrir más superficie, sino reforzar:

- evidence;
- confidence gates;
- cache semántica estable;
- validación real;
- integración completa y gobernada del catálogo oficial;
- workflows útiles para desarrolladores.

---

## 7. Fases del roadmap

## Fase A — Core semántico de próxima generación

### Objetivo

Cerrar el corazón del motor para que publique estado coherente, recalcule solo lo necesario y mantenga interactividad real.

### Incluye

- snapshot semántico canónico;
- publicación atómica;
- semantic epoch;
- semantic diff;
- dependencias inversas;
- invalidación explícita;
- indexación en dos fases;
- prioridad al contexto activo;
- yielding/cancelación/preempción;
- readiness/degraded mode;
- latency governor.

### Estado

Cerrada como bloque operativo. Los detalles de specs cerradas viven en `done-log.md`.

---

## Fase B — Persistencia robusta y reanudación real

### Objetivo

Evitar recomputado innecesario entre sesiones y convertir la persistencia en una capacidad seria.

### Incluye

- checkpoints reales;
- resume robusto;
- caché persistente por workspace/proyecto;
- journaling transaccional;
- schema versioning;
- warm resume;
- project model compartido.

### Estado

Bloque ya materializado y cerrado a nivel operativo inicial.

Specs cerradas de esta fase ya trazadas en `done-log.md`:

- `B155`;
- `B167`;
- `B168`;
- `B071`.

---

## Fase C — Serving profesional y productividad segura

### Objetivo

Unificar consultas semánticas y elevar calidad visible de features del editor.

### Incluye

- query engine unificado;
- semantic evidence;
- provenance/lineage;
- confidence gates;
- query result cache;
- references robustas;
- rename controlado;
- CodeLens fiable;
- navegación jerárquica;
- status contextual.

### Estado

Base materializada. Ya cerrados como bloque operativo:

- `B156` query engine unificado;
- `B173` member closures;
- `B066` CodeLens referencias/herencia;
- `B065` hierarchy inspection;
- `B109` API pública mínima;
- `B157` Semantic evidence de primera clase;
- `B171` Confidence gates por feature;
- `B160` Query result cache con claves semánticas estables;
- `B031` References robustas;
- `B032` Rename controlado;
- `B164` compactación de memoria;
- `B063` diagnostics snapshot agrupado.

Gap incremental reabierto en esta fase:

- `B230`, `B231`, `B175`, `B232`, `B233`, `B216`, `B214`, `B215`, `B188`, `B189`, `B190`, `B191`, `B192`, `B193`, `B194`, `B196`, `B197`, `B199`, `B200` y `B081` quedan cerradas como refuerzo de coste interno, boundary del LSP, reproducibilidad read-only, contrato diagnóstico estable, higiene del inventario histórico, dashboard de salud, explorer del workspace, panel de contexto activo, adapter ORCA base, capability/env validation visible, graph legacy read-only, export controlado a staging, rail write-enabled completo de import/regenerate/rebuild, gating frente a source real obsoleto, journal técnico persistente de `build|legacy`, workflow spec-driven unitario de update PBL, su orquestación batch, el bridge DataWindow `.Object`/`GetChild()`, el lineage SQL read-only de DataWindow, la capa segura de completion/diagnostics sobre property paths, el analizador cross-project read-only, el asistente read-only de migración de layouts legacy y la matriz read-only de perfiles de build; con `B198`, `B195`, `B251`, `B252`, `B253`, `B254`, `B255`, `B256` y `B257` ya cerradas, el siguiente bloque del orden pedido por el usuario queda formalizado en backlog/specs y continúa en `B258`.

---

## Fase D — Escala, salud interna y excelencia operativa

### Objetivo

Convertir el producto en herramienta robusta para proyectos enterprise y legacy reales.

### Incluye

- corpus reales;
- performance budgets medidos;
- memory budgets;
- fixtures permanentes;
- golden tests;
- reconciliación parser/symbol/LSP;
- event log;
- repro packs;
- health checker.

### Pendientes principales

- sin gaps activos inmediatos en esta fase tras cerrar `B216`.

Bloque ya cerrado dentro de la fase:

- `B030` validación real sobre workspace grande;
- `B069` fixtures reales permanentes;
- `B068` calibración real del performance budget;
- `B119` performance regression suite;
- `B118` integration test matrix del plugin;
- `B161` golden tests semánticos end-to-end;
- `B163` runtime journal exportable del motor;
- `B230` KnowledgeBase copy-on-write e indices de consulta acotada.
- `B231` guards LSP para markers y PBL binario.
- `B175` repro packs automáticos para bugs semánticos.
- `B232` contrato estable de IDs diagnósticos vía `diagnostic.code` (`specs/267-diagnostic-id-contract`).
- `B233` higiene histórica de specs tempranas (`specs/268-early-spec-hygiene`).
- `B216` dashboard read-only de salud del proyecto (`specs/269-project-health-dashboard`).
- `B176` health checker interno estructurado;
- `B226` baseline enterprise OrderEntry (`specs/251-orderentry-enterprise-baseline`);
- `B229` sourceOrigin contextual en análisis documental (`specs/258-sourceorigin-contextual-document-analysis`);
- `B070` memory budgets de caché e índice (`specs/255-memory-budgets`);
- `B228` modelo interno sin DTOs LSP en `knowledge/parsing` (`specs/254-internal-model-no-lsp-dtos`);
- `B162` reconciliación parser / symbol model / salida LSP (`specs/256-parser-symbol-lsp-reconciliation`).

---

## Fase E — Especialización PowerBuilder

### Objetivo

Extender el producto a piezas diferenciales del ecosistema PowerBuilder sin comprometer el core.

### Líneas principales

1. DataWindow safe mode;
2. DataWindow como subdominio semántico;
3. DataWindow avanzado;
4. PBAutoBuild;
5. build health;
6. auditoría técnica y convenciones.

### Pendientes principales

- sin gaps activos inmediatos en esta fase tras cerrar `B262` y `B263` en `specs/307` y `specs/308`.
- el bloque `B241-B250` ya queda cerrado y trazado en `specs/284-293`; cualquier reapertura futura requiere regresion demostrable o cambio de alcance explicito.

Bloque ya cerrado dentro de la fase:

- `B117` DataWindow safe mode mínimo;
- `B139` DataWindow safe-mode desde `plugin_old` rediseñado;
- `B041` catálogo y navegación de DataWindow;
- `B042` soporte avanzado de DataWindow (`specs/249-datawindow-advanced`);
- `B181` capability detection read-only de `PBAutoBuild250.exe` (`specs/252-pbautobuild-capability-detection`);
- `B182` discovery/validation read-only de build files JSON de PBAutoBuild (`specs/257-pbautobuild-build-file-discovery`);
- `B183` runner out-of-process de PBAutoBuild (`specs/259-pbautobuild-runner-out-of-process`);
- `B184` parser de logs y Problems Panel de PBAutoBuild (`specs/260-pbautobuild-log-parser-problems`);
- `B186` helper exportable y neutral para CI/CD sobre PBAutoBuild (`specs/263-pbautobuild-cicd-helper-export`);
- `B260` métricas avanzadas de código PowerBuilder (`specs/305-advanced-powerbuilder-code-metrics`);
- `B261` informe técnico de deuda y modernización (`specs/306-technical-debt-and-modernization-report`);
- `B262` framework versionado de code actions seguras (`specs/307-safe-code-action-framework-v2`);
- `B263` contratos de ejecución de tareas aptos para agentes (`specs/308-agent-ready-task-execution-contracts`);
- `B264` oracle de consistencia semántica entre surfaces read-only (`specs/309-semantic-consistency-oracle`);
- `B265` proof suite de invalidación incremental (`specs/310-incremental-invalidation-proof-suite`);
- `B266` policy v2 de query scope y consumer budgets (`specs/311-query-scope-policy-v2`);
- `B188` adapter ORCA base out-of-process (`specs/272-orca-adapter-architecture`);
- `B216` dashboard read-only de salud del proyecto (`specs/269-project-health-dashboard`);
- `B214` PowerBuilder Object Explorer read-only (`specs/270-powerbuilder-object-explorer`);
- `B227` formatter server-side con budgets explícitos (`specs/253-formatter-server-budget`).

Notas de orden:

- `B043` queda cerrada como épica base; con `B186`, `B198`, `B195`, `B251`, `B252`, `B253`, `B254`, `B255`, `B256`, `B257`, `B258`, `B259`, `B260`, `B261`, `B262`, `B263`, `B264`, `B265`, `B266`, `B267`, `B268`, `B269`, `B270`, `B271`, `B272`, `B273`, `B274`, `B275`, `B276`, `B277`, `B278`, `B279` y `B280` ya no queda deuda técnica ni documental inmediata en el carril build/legacy/public graphing/DataWindow/read-only interactivity/migración legacy/validación de perfiles/soporte offline/persistencia v2/métricas avanzadas/reporting técnico/safe actions/agent contracts/oracle cross-surface/invalidation proofing/query budgets/runtime backpressure/multi-root partition isolation/persistent cache corruption recovery/compatibilidad versionada de payloads/observabilidad local sin telemetría/hardening determinista del parser/visible contract matrix/graceful degradation/session stability/hot-path allocation guards/guardrails de capas/identidad canónica de símbolo/modelo v2 de ambigüedad, y el siguiente bloque pasa a `B281`.
- `B081` ya queda cerrada y movida a `docs/done-log.md`: el backbone DataWindow resuelve `.Object.<...>` y `GetChild()` sobre rutas hijas deterministas reutilizando `DataWindowModel`; el siguiente bloque pedido por el usuario queda ahora formalizado como `B241-B250` en backlog/specs y pasa a ser el frente activo.

---

## Fase F — Plataforma abierta para automatización

### Objetivo

Abrir contratos estables para consumo externo sin contaminar el núcleo.

### Incluye

- API pública estable;
- exportación de superficies semánticas;
- contratos versionados;
- manifiestos consumibles por automatización;
- soporte progresivo a tools/agentes.

### Pendientes principales

- sin gaps activos inmediatos en esta fase tras cerrar `B241`, `B242`, `B243` y `B249` en `specs/284`, `285`, `286` y `292`.
- deuda histórica previa (`B110`, `B111`, `B132`, `B140`) solo si vuelve a emerger un gap real no cubierto por el backbone actual.

---

## Fase G — Automatización avanzada e IA

### Objetivo

Aprovechar plataforma madura para automatización e IA sin reescribir arquitectura.

### Incluye

- automatización semántica avanzada;
- explotación de API/tools;
- refactorizaciones complejas apoyadas en backbone;
- context packs;
- impact analysis;
- safe edit plans.

### Pendientes principales

- sin gaps activos inmediatos en esta fase tras cerrar `B244`, `B245`, `B246`, `B247`, `B248` y `B250` en `specs/287-291` y `293`.

---

## 8. Líneas transversales obligatorias

### 8.1 Catálogo oficial

El catálogo oficial del lenguaje/runtime alimenta hover, completion, signature help, diagnósticos, navegación y automatización futura.

Desde `B339/B357/B365/B358/B359/B360/B361/B362`, el rail manual base ya está modularizado por ownership (`manual/{language,datawindow,visual,runtime,integration,core,ownerTypes}` con `sources.ts` y agregadores estables), el query layer consume índices compuestos con prioridad explícita de lenguaje, `buildCatalogConsistencyReport()` deja trazado ejecutable de provenance/authority por dominio, el carril visual ya quedó separado en slices pequeñas, el carril runtime/integration nonvisual queda cerrado como overlay curado por ownership sobre el baseline `generated-primary-with-manual-overlays`, el modelo de enumerados ya se normaliza en `enumerated-types`/`enumerated-values` sin aliases legacy con `!`, el rail oficial genera `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts` sin contaminación de TOC/navfooter de Appeon, y la capa curada ya cubre gaps mínimos como `SeekType` sin rellenar de forma deshonesta tipos oficiales como `SecureProtocol`. Con esa base, la siguiente ola del roadmap puede abordar los consumers visibles de enums (`B363`) y su validación corpus-driven (`B364`) sin reabrir el extractor oficial ni sobreatribuir coverage.

### 8.2 Documentación viva

Cambios relevantes sobre PowerScript, scopes, SR*, Workspace/Solution, DataWindow, encoding o build deben reflejarse en la guía técnica.

### 8.3 Referencias a `plugin_old`

`plugin_old` se usa como referencia de heurísticas, datasets y patrones, pero no como fuente de port masivo.

---

## 9. Política de WIP

Para un equipo pequeño:

- máximo 1 fase principal activa;
- máximo 1 línea transversal de deuda;
- máximo 1 línea de validación/corpus;
- no abrir simultáneamente DataWindow profundo, build avanzado, API pública ambiciosa y automatización externa fuerte.

---

## 10. Próximo foco recomendado

### Prioridad inmediata

**Bloque pedido por el usuario — continuidad pendiente de siguiente backlog activo**

Con foco en:

- tomar `B308` como cierre ya consolidado: external functions + `native-dependency` alimentan `technical debt report`, health y support bundle con distinción `dll/pbx/unknown`, aliases, consumers y evidencia de riesgo/impacto PBX-PBNI/ORCA sin cargar binarios;
- tomar `B306` como cierre ya consolidado: `code metrics`, `technical debt report`, health, support bundle y contrato público ya reflejan HTTPClient/REST/JSON con `integration-surface:*`, `integration-pattern:*`, `integration-endpoint:*` redactado e `integration-risk:redaction-required` sin abrir un segundo motor;
- tomar `B307` como cierre ya consolidado: `code metrics`, `technical debt report`, health, soporte Markdown y support bundle ya reflejan WebBrowser/WebView2 mediante `webBrowserUsages`, `web-ui-surface:*`, `web-ui-pattern:*` y `web-ui-risk:no-content-inspection`, sin inspeccionar contenido web remoto;
- tomar `B309` como cierre ya consolidado: discovery y `workspaceMigrationAssistant` ya distinguen metadata SCM/policy files y outputs locales (`.git`, `.svn`, `.gitignore`, `.gitattributes`, `.scc`, `.pb`, `build`, `_backupfiles`) para explicar qué se ignora y qué no debe competir con source/build canónico;
- tomar `B313` como cierre ya consolidado: `workspaceMigrationAssistant` y `support bundle` ya recomiendan limpieza manual de ruido local, staging ORCA, caches persistentes y drift de snapshots/settings mediante `workspace-cleanup-advisor.json`, sin borrar nada por defecto;
- tomar `B385` como cierre ya consolidado: `package.json`, `tools/esbuild.mjs` y el cliente ya publican/arrancan el runtime desde `dist/**`, el fallback `out/**` queda limitado a desarrollo local y el VSIX real ya se genera/lista sin `node_modules` runtime suelto;
- tomar `B386` como cierre ya consolidado: `package.json.files`, `verify:vsix-contents`, `package:vsix:list` y el test contractual `vsixPackageSurfaceContract` ya blindan la surface publicable del VSIX sin mezclarla con los fallos preexistentes del resto del carril release;
- tomar `B387` como cierre ya consolidado: la smoke instalada del VSIX, `release:verify`, el workflow `release-readiness` y la documentación de release ya quedan alineados con `dist/**`, mientras los fallos globales remanentes siguen trazados como bloqueos preexistentes fuera del slice release;
- tomar `B298` como cierre ya consolidado: `workspace-check` ya expone el modo `upgrade`, el comando `Check Extension Upgrade Compatibility` y warnings explícitos para `cache policy/runtime persistente`, settings legacy, `apiVersion/schemaVersion` y artefactos locales, todo reutilizando el mismo rail read-only con validación sobre fixtures legacy;
- tomar `B315` como cierre ya consolidado: la smoke instalada del VSIX ya auto-verifica activación, comandos, handshake mínimo con runtime/LSP, defaults de settings y descriptor/API pública, todo cableado dentro de `release:verify` sin abrir otro harness;
- tomar `B316` como cierre ya consolidado: `tools/docs-drift-audit.cjs`, `npm run test:docs:drift` y `test/server/unit/docsDriftAudit.test.ts` ya detectan drift canónico entre backlog/done-log/specs/foco vivo y dejaron corregidos `B329`, `B361` duplicado y la spec `377` incompleta sin abrir surface runtime nueva;
- tomar `B317` como cierre ya consolidado: el mismo audit documental ya rechaza estados `Done/Closed` todavía presentes en backlog y entradas canónicas modernas del done-log sin validación o documentación alineada, dejando además saneado el formato de `B358-B363` sin abrir otro checker paralelo;
- tomar `B314` como cierre ya consolidado: `build-orca-snapshot.json` clasifica ya fallos comunes de build/ORCA (`missing-tool`, `invalid-env`, `compile-errors`, `stale-staging`, `source-conflict`, `packaging-disabled`) usando stats read-only, problemas ya parseados y el `build-orca-journal` persistido, sin abrir otra API ni otro checker;
- tomar `B340` como cierre ya consolidado: `manual/tooling/` publica `tooling-symbols` bajo `powerbuilder-tooling` y `resolveLanguageSymbol()` lo mantiene fuera del hot path interactivo, de modo que ORCA/PBAutoBuild quedan modelados sólo para docs/health/build surfaces sin contaminar PowerScript/DataWindow;
- tomar `B284` como cierre ya consolidado: `explainSemanticQuery()` publica un explain plan legible sobre `queryContext` + `ResolvedTargetInfo` + `queryTrace`, lo sirve también por tool `explain-semantic-query` y por comando Markdown, y deja visibles phases/candidates/discards/winner/`sourceOrigin` sin abrir un segundo motor de resolución;
- tomar `B286` como cierre ya consolidado: `frameworkKnowledgePackPolicy` publica la policy ligera donde el source real del workspace gana, `frameworkKnowledgeConflict` se proyecta en `querySymbols/currentObjectContext/impactAnalysis/safeEditPlan` y `object-check` + el panel del objeto lo hacen visible sin alterar la selección real del winner;
- tomar el dashboard ADR-0001 del catálogo como cierre ya consolidado: `workspaceCheckCatalogSummary.ts` publica `adrCompliance` sobre el consistency report real, `workspaceCheckReport.ts` puede fallar el `workspace-check` si detecta drift contractual y `npm run report:catalog-consistency` deja snapshot JSON/Markdown determinista bajo `artifacts/catalog/` sin meter este gate en el hot path;
- mantener verde el carril build/legacy/runtime/architecture/visible-contract ya cerrado en `B198`, `B195`, `B267`, `B268`, `B273` y `B277`;
- registrar el siguiente ítem activo en backlog/spec/focus/roadmap antes de abrir nueva implementación.

### Trabajo paralelo permitido

**Fase E/Legacy — mantenimiento semántico y operabilidad residual**

Solo si no bloquea el foco principal:

- mantenimiento verde de la release lane y del carril build/legacy ya cerrado.

### Validación temprana permitida

Mantener verde la base ya cerrada sin reabrir superficie funcional:

- corpus reales;
- smoke matrix;
- golden suite semántica;
- performance regression suite;
- release lane (`package:vsix` / `release:verify`) ya materializado.

---

## 11. Regla final de producto

El objetivo no es llegar rápido a muchas features, sino llegar a un plugin que combine:

- rapidez;
- estabilidad;
- valor profesional real;
- soporte para proyectos grandes y legacy;
- conocimiento fuerte de PowerBuilder 2025;
- capacidad de crecer sin rehacer el núcleo;
- base limpia para automatización futura.
