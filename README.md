# PowerBuilder 2025 for Visual Studio Code

Plugin profesional de **Visual Studio Code** para **PowerBuilder 2025** y **PowerScript**, diseñado para ofrecer una experiencia **rápida**, **moderna** y **estable** sobre proyectos **Workspace** y **Solution**, incluidos entornos grandes y código legacy.

## Qué ofrece

- **Resaltado de sintaxis** para PowerBuilder / PowerScript
- **Document Symbols** jerárquicos
- **Hover semántico**
- **Go to Definition**
- **Completion** contextual
- **Signature Help**
- **Formatter conservador configurable** para scripts PowerBuilder soportados
- **Inspección jerárquica activa** desde comando
- **API pública mínima versionada** para herramientas y otras extensiones
- **Bridge JSON-RPC / local tool read-only** sobre la API pública endurecida
- **Export / import de semantic workspace snapshot** versionado
- **Gobernanza de settings y perfiles** para superficies read-only y workflows legacy
- **Dashboard read-only de salud del proyecto** desde la status bar
- **PowerBuilder Object Explorer read-only** en el side bar
- **Current Object Context Panel read-only** en el side bar
- **Diagnostics Explainability Panel** read-only para explicar diagnósticos estructurales y semánticos
- **Knowledge packs** read-only para frameworks/librerías PowerBuilder conocidas
- **Planificación segura de batch rename/refactor** en modo read-only antes de editar
- **Adapter ORCA legacy** out-of-process con capability detection read-only vía configuración o `PB_ORCA_PATH`, y export controlado a staging indexable con DLL de sesión explícita
- **Export de repro packs semánticos** desde el editor activo para bugs complejos
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
- dashboard read-only de salud del proyecto accesible desde la status bar, compuesto sobre stats/runtime health, manifest semántico y snapshot de build ya cerrados,
- Object Explorer read-only en el side bar, agrupado por proyecto/librería/kind y filtrable por proyecto o archivo activo sobre el mismo manifest enriquecido,
- Current Object Context Panel read-only en el side bar, siguiendo el editor activo y proyectando object info, ancestor chain, variables visibles, members, diagnostics, bindings `DataObject` y evidence/confidence sobre `currentObjectContext`,
- adapter ORCA legacy out-of-process y separado del hot path, con capability detection read-only vía configuración o `PB_ORCA_PATH`, snapshot visible en status/dashboard, export controlado a `.vsc-powersyntax/orca-export/orca-staging`, import controlado de vuelta a PBL y comandos `regenerate/rebuild` sobre el mismo rail seguro con `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o fallback `pborc250.dll`, preflight por fingerprint de PBL y fingerprints del source real rastreado, backup binario, ledger persistido, workflow spec-driven por API pública para export fresco + edits explícitos sobre staging + import seguro, batch versionado para coordinar múltiples PBL con `stopOnError`, y journal técnico persistente en `.vsc-powersyntax/runtime/build-orca-journal.json` sin declarar el staging como fuente canónica,
- detección read-only de `PBAutoBuild250.exe` vía configuración, entorno y candidatos por defecto, junto con discovery/validation read-only de build files JSON, runner out-of-process cancelable, publicación segura de problemas de build y export neutral de helper CI/CD versionable bajo `tools/pbautobuild-ci`,
- API pública mínima exportada desde la activación para stats, consulta de símbolos, superficies read-only como current object context, impact analysis, safe edit plan y semantic workspace manifest, y los workflows versionados `applySpecDrivenPblUpdate()` / `applySpecDrivenPblUpdateBatch()` para automatización controlada sobre PBL legacy,
- exportación de repro packs semánticos bajo `tools/semantic-repros`, reutilizando esas surfaces read-only y copias de archivos relacionados para reabrir bugs complejos,
- contrato diagnóstico estable vía `diagnostic.code`, manteniendo compatibilidad legacy puntual donde aún existe `source = PowerScript:SDx`,
- y una infraestructura preparada para seguir creciendo en rendimiento, semántica y validación sobre corpus reales.

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

## Release y marketplace

El carril de release queda preparado para validación repetible antes de publicar en marketplace:

- `npm run release:verify` ejecuta smoke/unit/integration, el gate de rendimiento y genera un VSIX listo para inspección.
- `npm run package:vsix` empaqueta la extensión en `./.dist/vsc-powersyntax.vsix` usando `vsce`.
- `npm run package:vsix:list` permite inspeccionar el contenido que se publicaría.

Antes de un release conviene revisar `CHANGELOG.md`, comprobar que el workflow `release-readiness` está verde y verificar que la metadata pública (`README`, icono, keywords, bugs/repository/homepage) sigue alineada.

## Documentación

Si quieres más detalle técnico del proyecto, consulta:

- `docs/architecture.md`
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
