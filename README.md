# PowerBuilder 2025 for Visual Studio Code

Plugin profesional de **Visual Studio Code** para **PowerBuilder 2025** y **PowerScript**, diseñado para ofrecer una experiencia **rápida**, **moderna** y **estable** sobre proyectos **Workspace** y **Solution**, incluidos entornos grandes y código legacy.

## Qué ofrece

- **Resaltado de sintaxis** para PowerBuilder / PowerScript
- **Document Symbols** jerárquicos
- **Hover semántico**
- **Go to Definition**
- **Completion** contextual
- **Signature Help**
- **Documentación localizada configurable** en hover, completion y signatureHelp con `vscPowerSyntax.languageServices.documentationLocale = auto|en|es`
- **Formatter conservador configurable** para scripts PowerBuilder soportados
- **Inspección jerárquica activa** desde comando
- **API pública mínima versionada** para herramientas y otras extensiones
- **Contrato de observabilidad local versionado** para stats, health, query trace y support bundle, sin telemetría externa
- **Bridge JSON-RPC / local tool read-only** sobre la API pública endurecida
- **Export / import de semantic workspace snapshot** versionado
- **Diff read-only entre dos semantic workspace snapshots** para resumir cambios de impacto entre estados exportados
- **Grafo inmediato de dependencias PowerBuilder** visualizable en Mermaid y exportable por API/tool read-only
- **Analizador read-only de conflictos cross-project** con ranking y evidencia exportable por API/tool/comando Markdown
- **Asistente read-only de migración de workspace legacy** con recomendaciones topológicas y de build exportables por API/tool/comando Markdown
- **Matriz read-only de perfiles de build y validación de entorno** para PBAutoBuild, exportable por API/tool/comando Markdown
- **DataWindow SQL lineage** read-only sobre `retrieve`, reports y dropdown children, visualizable/exportable con degradación honesta
- **Diagnósticos y completion segura de expresiones DataWindow** sobre property paths defendibles
- **Gobernanza de settings y perfiles** con presets `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`
- **Dashboard read-only de salud del proyecto** desde la status bar, con enterprise health score explicable
- **Matriz oficial de soporte** visible en el health report, con límites explícitos por modo/surface
- **PowerBuilder Object Explorer read-only** en el side bar
- **Current Object Context Panel read-only** en el side bar
- **Diagnostics Explainability Panel** read-only para explicar diagnósticos estructurales y semánticos
- **Knowledge packs** read-only para frameworks/librerías PowerBuilder conocidas
- **Planificación segura de batch rename/refactor** en modo read-only antes de editar
- **Adapter ORCA legacy** out-of-process con capability detection read-only vía configuración o `PB_ORCA_PATH`, y export controlado a staging indexable con DLL de sesión explícita
- **Export de repro packs semánticos** desde el editor activo para bugs complejos
- **Export de support bundles offline** con redacción explícita por perfil para soporte y troubleshooting
- **Runtime self-test read-only** para validar rápido API, LSP, cache, project model, diagnósticos, build y ORCA
- **Core maintenance command pack** para health report, runtime self-test, budgets de memoria, estado de indexación, project routing, conflictos de `sourceOrigin`, validación/limpieza de caché y rebuild explícito del workspace
- **Diagnósticos estructurales y semánticos** con `diagnostic.code` estable para tooling y troubleshooting
- **Descubrimiento de Workspace, Solution y PBL-only**
- **Indexación progresiva** con prioridad al archivo activo
- **Watcher incremental** que refresca routing/provenance al cambiar markers o entrar SR* nuevos
- **Caché y scheduler** para mejorar la respuesta en proyectos grandes

## Diseñado para proyectos reales

Este plugin está construido para:

- **descubrir e indexar rápido sin bloquear**,
- priorizar siempre el **archivo activo**,
- escalar sobre **bases de código grandes y legacy**,
- y evolucionar hacia una experiencia profesional completa en VS Code para PowerBuilder 2025.

## Estado actual

Actualmente el plugin ya incluye una base funcional sólida con:

- soporte inicial para **Workspace** (`.pbw`, `.pbt`) y **Solution** (`.pbsln`, `.pbproj`),
- detección explícita del modo **PBL-only** con graph read-only de librerías `.pbl` integrado en project model, manifest y Object Explorer sin tocar PBL binaria,
- separación explícita entre markers/topología (`.pbw/.pbt/.pbproj/.pbsln`, `.pbl`) y documentos semánticos servidos por el LSP, para que discovery observe esos artefactos sin tratarlos como PowerScript,
- arquitectura **cliente ligero + servidor LSP separado**,
- navegación y asistencia semántica base, incluida inspección jerárquica activa del objeto actual,
- formatter conservador configurable y `formatOnSave` delegados al servidor LSP con budgets explícitos por tamaño de documento,
- dashboard read-only de salud del proyecto accesible desde la status bar, compuesto sobre stats/runtime health, manifest semántico y snapshot de build ya cerrados, con enterprise health score explicable por readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix,
- Object Explorer read-only en el side bar, agrupado por proyecto/librería/kind y filtrable por proyecto o archivo activo sobre el mismo manifest enriquecido,
- Current Object Context Panel read-only en el side bar, siguiendo el editor activo y proyectando object info, ancestor chain, variables visibles, members, diagnostics, bindings `DataObject` y evidence/confidence sobre `currentObjectContext`,
- analizador read-only de conflictos cross-project por API pública/tool bridge/comando Markdown, agrupando símbolos por `buildSymbolKey`, enriqueciendo proyecto/librería/sourceOrigin y colapsando staging no canónico dentro de la misma ubicación,
- asistente read-only de migración de workspace legacy por API pública/tool bridge/comando Markdown, reutilizando `WorkspaceState`, build files, project model y aliases ORCA para recomendar consolidación de layouts `pbl-only` o `mixed` sin escritura opaca,
- matriz read-only de perfiles de build y validación de entorno por API pública/tool bridge/comando Markdown, combinando inventory completo de build files, último profile recordado, capability detection de PBAutoBuild y build health sin lanzar builds ni abrir un rail paralelo,
- surface read-only de `DataWindow SQL lineage` por API pública/tool bridge/comando Markdown, reutilizando `DataWindowModel`, bindings `DataObject` y child routes `report/dddw` ya indexadas,
- completion y diagnósticos conservadores para expresiones DataWindow dentro de `Describe/Modify`, `.Object` y `GetChild()`, reutilizando el mismo resolver de property paths y sin abrir completion genérica dentro de strings arbitrarios,
- adapter ORCA legacy out-of-process y separado del hot path, con capability detection read-only vía configuración o `PB_ORCA_PATH`, snapshot visible en status/dashboard, export controlado a `.vsc-powersyntax/orca-export/orca-staging`, import controlado de vuelta a PBL y comandos `regenerate/rebuild` sobre el mismo rail seguro con `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o fallback `pborc250.dll`, preflight por fingerprint de PBL y fingerprints del source real rastreado, backup binario, ledger persistido, workflow spec-driven por API pública para export fresco + edits explícitos sobre staging + import seguro, batch versionado para coordinar múltiples PBL con `stopOnError`, y journal técnico persistente en `.vsc-powersyntax/runtime/build-orca-journal.json` sin declarar el staging como fuente canónica,
- detección read-only de `PBAutoBuild250.exe` vía configuración, entorno y candidatos por defecto, junto con discovery/validation read-only de build files JSON, runner out-of-process cancelable, publicación segura de problemas de build y export neutral de helper CI/CD versionable bajo `tools/pbautobuild-ci`,
- API pública mínima exportada desde la activación para stats, consulta de símbolos, superficies read-only como current object context, impact analysis, cross-project conflicts, workspace migration assistant, build profile matrix, safe edit plan y semantic workspace manifest, junto con settings governance observable para perfiles `fast|balanced|deep-analysis|legacy-orca|ci-support|support-safe`, y los workflows versionados `applySpecDrivenPblUpdate()` / `applySpecDrivenPblUpdateBatch()` para automatización controlada sobre PBL legacy,
- descriptor versionado de observabilidad local embebido en ese contrato público, declarando `externalTelemetry = false`, `localOnly = true` y los dominios readiness/indexing/cache/memory/latency/build/ORCA/diagnostics/query trace/support bundle/health sin abrir un rail paralelo,
- exportación de repro packs semánticos bajo `tools/semantic-repros`, reutilizando esas surfaces read-only y copias de archivos relacionados para reabrir bugs complejos,
- exportación de support bundles offline bajo `tools/support-bundles`, reutilizando health/stats/runtime journal/manifest/API inventory/settings governance con redacción explícita por perfil (`sanitized` o `summary-only`) y sin copiar código bruto por defecto,
- comando read-only `vscPowerSyntax.runRuntimeSelfTest`, que reutiliza contrato público, `ApiServerStats` y `semanticWorkspaceManifest` para un reporte rápido sin abrir otro rail de observabilidad,
- contrato diagnóstico estable vía `diagnostic.code`, manteniendo compatibilidad legacy puntual donde aún existe `source = PowerScript:SDx`,
- y una infraestructura preparada para seguir creciendo en rendimiento, semántica y validación sobre corpus reales.

## Matriz oficial de soporte

| Modo / surface | Soporte | Qué cubre hoy | Límite explícito |
| --- | --- | --- | --- |
| PowerBuilder 2025 Workspace | soportado | discovery, indexación, routing y health sobre `.pbw/.pbt` | requiere markers coherentes y mantiene prioridad absoluta del archivo activo |
| PowerBuilder 2025 Solution | soportado | discovery/routing sobre `.pbsln/.pbproj`, manifest compartido y health report | depende de la topología real publicada por el runtime |
| Target `.pbt` | soportado | project model, manifest y Object Explorer | no abre build ni edición implícita por sí solo |
| PBL-only legacy | read-only | graph legacy, manifest, Object Explorer y migración guiada | no escribe PBL binaria ni mete ORCA en el hot path |
| Source plain-text / exportado | read-only | corpus semántico y serving cuando hay evidencia suficiente | puede degradar si faltan markers canónicos |
| Staging ORCA | read-only subordinado | export controlado a staging indexable e import safe | nunca sustituye al source real ni se publica como origen canónico |
| DataWindow `.srd` | read-only | safe mode, lineage SQL y property paths defendibles | no se parsea como PowerScript general |
| PBAutoBuild | condicional | capability detection, build profile matrix, runner, build health y helper CI/CD | requiere `pbautobuild250.exe` y un JSON usable |
| Build files PowerServer/PowerClient | read-only | discovery y validación por el mismo carril JSON de PBAutoBuild | no abre deploy ni un rail específico desde la matriz |

La misma matriz se exporta en `tools/health-reports/<workspace>-<timestamp>/README.md`, para que soporte y troubleshooting usen el mismo contrato visible que la documentación canónica.

## En evolución

Las siguientes líneas de trabajo siguen en crecimiento:

- surfacing transversal de confidence/readiness en features interactivas,
- troubleshooting comparado entre PBAutoBuild moderno y ORCA legacy,
- dashboards/paneles UX construidos sobre contratos read-only ya cerrados,
- budgets de memoria y reconciliación interna parser/symbol/LSP,
- y automatización / IA sobre base madura.

## Filosofía del proyecto

Este plugin sigue unas reglas claras:

- **rendimiento primero**,
- **cliente mínimo, servidor rico**,
- **análisis incremental y cancelable**,
- **núcleo semántico compartido**,
- y **documentación viva alineada con el estado real del repositorio**.

## Activación

La extensión se activa de forma perezosa cuando realmente se necesita, para mantener un impacto mínimo en el arranque de VS Code.

## Configuración útil

- `vscPowerSyntax.languageServices.documentationLocale`: controla el idioma de la documentación visible en hover, completion y signatureHelp. `auto` usa el idioma actual de VS Code cuando sea compatible y cae a inglés; `en` fuerza el texto original; `es` usa el overlay español cuando existe.

## Release y marketplace

El carril de release queda preparado para validación repetible antes de publicar en marketplace:

- `npm run release:verify` ejecuta smoke/unit/integration, el gate de rendimiento y genera un VSIX listo para inspección; el self-verification instalado reutiliza la smoke del VSIX para comprobar activación, comandos, handshake mínimo con runtime/LSP, defaults de settings y descriptor/API pública.
- `npm run package:vsix` empaqueta la extensión en `./.dist/vsc-powersyntax.vsix` usando `vsce` y el runtime bundlado en `dist/client/extension.js` + `dist/server/server.js`.
- `npm run package:vsix:list` permite inspeccionar el contenido que se publicaría.
- `npm run verify:vsix-contents` valida required paths y bloquea artefactos de desarrollo dentro del VSIX real.
- `npm run test:smoke:installed-vsix` valida desde el VSIX instalado en un entorno aislado la activación, comandos, handshake mínimo con runtime/LSP, defaults de settings y descriptor/API pública.

Antes de un release conviene revisar `CHANGELOG.md`, comprobar que el workflow `release-readiness` está verde y verificar que la metadata pública (`README`, icono, keywords, bugs/repository/homepage) sigue alineada.

## Cuándo usar PBAutoBuild y cuándo ORCA legacy

Usa `PBAutoBuild` cuando el workspace ya tiene un build file JSON utilizable y quieres compilar desde source real sin abrir staging legacy:

- `vscPowerSyntax.runPbAutoBuild` para la ejecución directa;
- `vscPowerSyntax.runLastPbAutoBuild` para repetir el último perfil recordado;
- `vscPowerSyntax.runPbAutoBuildWithPicker` para elegir entre build files usables;
- `vscPowerSyntax.exportPbAutoBuildCiHelper` para exportar un bundle neutral bajo `tools/pbautobuild-ci/<perfil>`.

Usa `ORCA legacy` cuando el workspace depende de `.pbl`, necesitas exportar source a staging o ejecutar mantenimiento/import controlado sobre librerías legacy:

- `vscPowerSyntax.runActiveOrcaScript` para scripts ORCA ad hoc;
- `vscPowerSyntax.exportOrcaStaging` para materializar `.vsc-powersyntax/orca-export/orca-staging`;
- `vscPowerSyntax.importOrcaStaging` para importar el último export persistido con preflight, backup y ledger;
- `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject` para mantenimiento legacy sobre el mismo rail seguro.

Regla operativa:

- PBAutoBuild es el carril moderno para compilar source real.
- ORCA no sustituye PBAutoBuild ni convierte `orca-staging` en fuente canónica.
- El staging ORCA es temporal, indexable y subordinado al source real.
- La creación de `EXE/PBD/DLL` vía ORCA no está expuesta en el producto; requeriría un feature flag dedicado y queda fuera del carril PBAutoBuild.

## Troubleshooting rápido de build y ORCA

Comprobaciones básicas:

- `npm run build:test` para recompilar cliente/servidor antes de validar el wiring real.
- `npm run report:catalog-localization` para regenerar el snapshot de cobertura e issues del rail español bajo `artifacts/catalog/` antes de ampliar traducciones.
- `npm run migrate:catalog-localization-target-ids` para revisar, y opcionalmente aplicar con `-- --write`, reconciliaciones de `targetId` cuando el reporte publique recoveries por `targetKey`.
- `npm run release:verify` para repetir smoke, unit, integration, gate de rendimiento y VSIX.
- dashboard, status bar y `PowerSyntax: Mostrar Stats del Runtime` para revisar `buildTooling`, `buildFiles`, `buildRunner`, `orcaTooling`, `orcaRunner` y `showStats.persistence.buildOrcaJournalUri`.
- `PowerSyntax: Mostrar Gobernanza de Settings` y `PowerSyntax: Aplicar Perfil de Settings` para inspeccionar y normalizar el baseline del workspace con los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`.
- `PowerSyntax: Exportar Support Bundle Offline` para congelar el runtime con la policy de redacción del perfil activo, incluyendo modos más estrictos para `ci-support` y `support-safe`.
- `PowerSyntax: Exportar Health Report`, `Ejecutar Runtime Self-Test`, `Mostrar Memory Budgets`, `Mostrar Estado de Indexación`, `Mostrar Project Routing`, `Mostrar Conflictos de sourceOrigin`, `Validar Cache Persistente`, `Limpiar Cache Semántica` y `Rebuild Workspace Index` para inspección/mantenimiento directo del core sin abrir un rail paralelo.

Artefactos operativos reales:

- `tools/pbautobuild-ci/<perfil>` para el bundle neutral exportado a CI/CD.
- `tools/health-reports/<workspace>-<timestamp>` para snapshots offline del dashboard, score enterprise, stats y manifest del runtime.
- `tools/support-bundles/<workspace>-<timestamp>` para bundles offline de soporte con redacción explícita por perfil y sin código bruto por defecto.
- `.vsc-powersyntax/orca-export/orca-staging` para el staging ORCA indexable.
- `.vsc-powersyntax/orca-export/state/last-export.state` para el último export ORCA persistido.
- `.vsc-powersyntax/orca-export/state/last-import-ledger.json` para el último import ORCA con `compileResult` y rollback.
- `.vsc-powersyntax/runtime/build-orca-journal.json` para el journal persistente de eventos `build|legacy`.
- `./.dist/vsc-powersyntax.vsix` para el VSIX local generado por `npm run package:vsix`.

Síntoma: PBAutoBuild no aparece como disponible.
Acción: revisar `vscPowerSyntax.build.pbAutoBuildPath`, `PB_AUTOBUILD_PATH`, el picker de build files utilizables y `showStatusStats` para confirmar que existe al menos un JSON `usable`.

Síntoma: el build arranca pero no publica problemas.
Acción: revisar si el log resuelve de forma única a un archivo real del workspace; si no hay mapping fiable, el runtime no inventa Problems Panel.

Síntoma: ORCA aparece como `missing` o `invalid`.
Acción: revisar `vscPowerSyntax.legacy.orcaPath`, `PB_ORCA_PATH` y que el comando activo se ejecuta sobre Windows con un ejecutable ORCA real.

Síntoma: export ORCA falla antes de crear staging.
Acción: revisar `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o el fallback `pborc250.dll`, además del script generado bajo `.vsc-powersyntax/orca-export/scripts/`.

Síntoma: import ORCA se bloquea por preflight.
Acción: revisar `last-export.state`, `last-import-ledger.json`, drift del source real rastreado, staging vacío y cambios de fingerprint en la PBL; si el source real cambió desde el export, reexportar staging antes de reintentar.

Síntoma: release lane o VSIX fallan.
Acción: ejecutar `npm run package:vsix`, `npm run package:vsix:list` y `npm run release:verify`, y comprobar que `CHANGELOG.md`, workflows y metadata pública siguen alineados.

## Documentación

Si quieres más detalle técnico del proyecto, consulta:

- `docs/README.md`
- `docs/architecture.md`
- `docs/spec-driven-development.md`
- `docs/developer-workflows.md`
- `docs/release.md`
- `docs/troubleshooting.md`
- `docs/legacy-isolation.md`
- `docs/technical-debt-inventory.md`
- `docs/ai-strategy.md`
- `docs/ai-orchestration.md`
- `docs/ai/README.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/localization.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## Objetivo

Ofrecer la mejor base posible para trabajar con **PowerBuilder 2025 en Visual Studio Code**:

- rápida,
- mantenible,
- preparada para proyectos reales,
- y lista para evolucionar hacia capacidades semánticas y de automatización cada vez más potentes.
