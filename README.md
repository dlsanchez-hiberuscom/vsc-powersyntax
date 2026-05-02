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
- **Diagnósticos estructurales y semánticos**
- **Descubrimiento de Workspace y Solution**
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
- arquitectura **cliente ligero + servidor LSP separado**,
- navegación y asistencia semántica base, incluida inspección jerárquica activa del objeto actual,
- formatter conservador configurable y `formatOnSave` delegados al servidor LSP con budgets explícitos por tamaño de documento,
- detección read-only de `PBAutoBuild250.exe` vía configuración, entorno y candidatos por defecto, visible en status/health sin lanzar build,
- API pública mínima exportada desde la activación para stats, consulta de símbolos y superficies read-only como current object context, impact analysis, safe edit plan y semantic workspace manifest,
- y una infraestructura preparada para seguir creciendo en rendimiento, semántica y validación sobre corpus reales.

## En evolución

Las siguientes líneas de trabajo siguen en crecimiento:

- acceso semántico a `dw.Object` y superficies hijas de DataWindow,
- discovery, runner y log parsing modernos sobre PBAutoBuild, con capability detection read-only ya cerrada,
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
