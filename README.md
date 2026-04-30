# PowerBuilder 2025 for Visual Studio Code

Plugin profesional de **Visual Studio Code** para **PowerBuilder 2025** y **PowerScript**, diseñado para ofrecer una experiencia **rápida**, **moderna** y **estable** sobre proyectos **Workspace** y **Solution**, incluidos entornos grandes y código legacy.

## Qué ofrece

- **Resaltado de sintaxis** para PowerBuilder / PowerScript
- **Document Symbols** jerárquicos
- **Hover semántico**
- **Go to Definition**
- **Completion** contextual
- **Signature Help**
- **Diagnósticos estructurales y semánticos**
- **Descubrimiento de Workspace y Solution**
- **Indexación progresiva** con prioridad al archivo activo
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
- navegación y asistencia semántica base,
- y una infraestructura preparada para seguir creciendo en rendimiento, semántica y validación sobre corpus reales.

## En evolución

Las siguientes líneas de trabajo siguen en crecimiento:

- endurecimiento del core semántico,
- persistencia y warm indexing,
- references y rename más robustos,
- mejoras de rendimiento en workspaces grandes,
- DataWindow,
- integración con toolchain del ecosistema PowerBuilder,
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
