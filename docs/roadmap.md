# Roadmap LEAN — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 1. Objetivo

Construir un plugin profesional para PowerBuilder 2025 en VS Code con estas prioridades:

1. base sólida,
2. carga rápida y estabilidad,
3. núcleo semántico reutilizable,
4. buen comportamiento en proyectos grandes y legacy,
5. valor real para el desarrollador,
6. automatización e IA solo sobre base madura.

---

## 2. Principios de producto

Se prioriza siempre, en este orden:

1. rendimiento,
2. arquitectura,
3. separación de responsabilidades,
4. backbone semántico común,
5. experiencia del archivo activo,
6. escalabilidad,
7. validación real,
8. integraciones oficiales del ecosistema PowerBuilder,
9. documentación alineada,
10. automatización avanzada al final.

---

## 3. Reglas base del producto

- El plugin debe soportar **Workspace** y **Solution** como modos distintos.
- En Workspace, `ws_objects` es fuente relevante; en Solution, no.
- En Solution, las carpetas `*.pbl` con archivos `*.sr*` son fuente canónica.
- `.pb`, `build` y `_BackupFiles` deben ignorarse por defecto.
- El lenguaje requiere separar:
  - parsing del contenedor SR*,
  - parsing del lenguaje embebido.
- DataWindow debe tratarse como un subdominio propio.
- El backend moderno de build debe priorizar **PBAutoBuild**.
- **ORCA/OrcaScript** queda como integración adicional para legacy/workspace.
- Todo cambio semántico o estructural debe reflejarse también en:
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 4. Estado actual

- **Fase 0** — cerrada
- **Fase 1** — cerrada
- **Fase 2** — cerrada
- **Fase 3** — cerrada
- **Fase 4** — cerrada
- **Fase 5** — cerrada
- **Fase 6A** — cerrada
- **Fase 6B** — en curso
- **Fase 7A** — siguiente objetivo natural
- **Fase 7B** — después de 7A
- **Fase 8** — endurecimiento, escala y validación continua
- **Fase 9** — especialización PowerBuilder
- **Fase 10–11** — apertura a automatización externa e IA

---

## 5. Fases del roadmap

## Fase 0 — Bootstrap profesional y gobierno del repositorio ✅

### Objetivo
Dejar una base limpia, gobernable y documentada.

### Salida
- manifiesto correcto,
- base cliente/servidor,
- documentación mínima,
- validación inicial.

---

## Fase 1 — Base operativa rápida y segura ✅

### Objetivo
Garantizar activación ligera, cliente fino y servidor separado.

### Salida
- activación perezosa,
- cliente mínimo,
- servidor fuera del Extension Host,
- lifecycle robusto.

---

## Fase 2 — Workspace, runtime y observabilidad ✅

### Objetivo
Introducir discovery, prioridades, cancelación y observabilidad básica.

### Salida
- descubrimiento del workspace,
- roots y exclusiones,
- scheduler básico,
- foco en archivo activo.

---

## Fase 3 — Parsing, caché e invalidación reutilizable ✅

### Objetivo
Construir pipeline incremental con caché documental e invalidación fina.

### Salida
- parseo incremental,
- caché por documento,
- fingerprints,
- invalidación por impacto local.

---

## Fase 4 — Backbone semántico inicial y catálogo oficial ✅

### Objetivo
Introducir símbolos canónicos, scopes iniciales, índice básico y queries compartidas.

### Salida
- índice de símbolos,
- document/workspace symbols,
- binding inicial,
- catálogo oficial del lenguaje/runtime.

---

## Fase 5 — Navegación profesional y valor temprano ✅

### Objetivo
Entregar navegación útil de valor real.

### Salida
- go to definition,
- find references base,
- hover semántico,
- owner-awareness y herencia inicial.

---

## Fase 6A — Productividad semántica base ✅

### Objetivo
Construir la primera experiencia profesional de edición.

### Salida
- diagnósticos sintácticos y estructurales,
- completion contextual básico,
- signature help básico,
- uso real del catálogo oficial.

---

## Fase 6B — Infraestructura de escala y refinamiento semántico (EN CURSO)

### Objetivo
Garantizar la interactividad en proyectos grandes mediante indexación no bloqueante y refinamiento del contexto semántico.

### Entregables mínimos
- discovery rápido no bloqueante (Dual Mode),
- scheduler de indexación multinivel (Interactive/Near/Background),
- barra de estado con progreso de indexación,
- caché de contexto activo y de serving (LSP features),
- contexto posicional reutilizable y snapshots por documento.

### Criterio de salida
- el sistema indexa el workspace sin bloquear la UI,
- el usuario ve progreso real en la barra de estado,
- y el contexto compartido mejora la precisión de las features LSP.

---

## Fase 7A — Resolución fuerte, topología y visibilidad

### Objetivo
Pasar de semántica útil a semántica confiable a escala de workspace.

### Orden interno recomendado
1. topología real de workspace/solution,
2. project registry,
3. enriched symbol model,
4. visibilidad real,
5. InheritanceGraph robusto,
6. owner resolution,
7. references seguras.

### Entregables mínimos
- topología real,
- visibilidad real,
- herencia más fiable,
- owner resolution más fuerte,
- precisión mayor en definición/usos/referencias.

### Criterio de salida
- el plugin distingue correctamente mejor topología, herencia y visibilidad,
- y evita confusiones entre targets/proyectos.

---

## Fase 7B — Rename, Code Actions, CodeLens y navegación jerárquica

### Objetivo
Construir operaciones seguras de alto valor sobre resolución fuerte.

### Entregables mínimos
- rename controlado,
- code actions básicas,
- CodeLens de referencias/herencia,
- ancestor script navigation,
- hierarchy inspection,
- formatter configurable.

### Criterio de salida
- operaciones delicadas utilizables con confianza razonable.

---

## Fase 8A — Escala, rendimiento y endurecimiento

### Objetivo
Asegurar que el plugin escala bien en proyectos enterprise y legacy.

### Entregables mínimos
- calibración real del performance budget,
- memory budgets,
- warm indexing,
- caché persistente,
- optimización real de latencias,
- hardening sobre corpus grandes.

### Criterio de salida
- latencia y memoria controlables,
- warm indexing claramente mejor que cold indexing,
- estabilidad en corpus reales.

---

## Fase 8B — Exploración global, métricas y validación continua

### Objetivo
Dar visión global y convertir la validación real en práctica permanente.

### Entregables mínimos
- explorador semántico,
- métricas,
- fixtures reales permanentes,
- suites de validación sobre corpus representativos.

### Criterio de salida
- el producto evoluciona sobre validación real, no sobre hipótesis.

---

## Fase 9 — Especialización PowerBuilder y ecosistema profesional

### Objetivo
Cubrir las piezas diferenciales del ecosistema PowerBuilder.

### Líneas principales
1. DataWindow safe mode consolidado,
2. DataWindow avanzado,
3. integración con **PBAutoBuild**,
4. estado de build y salud del workspace,
5. auditoría técnica y convenciones.

### Criterio de salida
- el plugin aporta valor diferencial específicamente PowerBuilder,
- y entra en terreno de herramienta profesional de ingeniería.

---

## Fase 10 — Plataforma abierta para automatización

### Objetivo
Abrir contratos estables para consumo externo sin contaminar el core.

### Entregables mínimos
- API local,
- versionado de contratos,
- adapters desacoplados,
- consultas automatizables,
- documentación de contratos,
- integración ORCA/OrcaScript para escenarios legacy cuando toque.

### Criterio de salida
- el sistema es consumible externamente con estabilidad de borde.

---

## Fase 11 — Automatización avanzada e IA sobre base estable

### Objetivo
Aprovechar la plataforma madura para automatización e IA sin reabrir la arquitectura.

### Entregables mínimos
- refactorización más avanzada,
- automatización externa,
- explotación del backbone semántico y del catálogo oficial fuera del editor.

### Criterio de salida
- la automatización externa aprovecha la plataforma,
- y el core sigue limpio y sostenible.

---

## 6. Línea transversal obligatoria

### Catálogo oficial
El catálogo oficial del lenguaje y runtime es un activo estratégico del plugin.
Debe alimentar:

- hover,
- completion,
- signature help,
- diagnósticos,
- navegación,
- automatización futura.

### Documento técnico asociado
Todo cambio relevante sobre:
- PowerScript,
- scopes,
- SR*,
- Workspace/Solution,
- DataWindow,
- encoding,
- build/backend,

debe reflejarse también en:

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 7. Política de WIP

Para un equipo pequeño:

- máximo **1 fase principal activa**,
- máximo **1 línea transversal de deuda**,
- máximo **1 línea de validación/corpus**,
- no abrir simultáneamente:
  - DataWindow profundo,
  - build avanzado,
  - API pública,
  - automatización externa.

---

## 8. Regla de avance entre fases

No se avanza agresivamente si la fase anterior no está consolidada.

**Consolidar** significa:
- implementación estable,
- validación mínima real,
- rendimiento controlado,
- documentación actualizada,
- backlog/estado alineados,
- sin deuda bloqueante oculta.

---

## 9. Próximo foco recomendado

### Prioridad inmediata
Cerrar **Fase 6B** con foco en:
- contexto posicional reutilizable,
- parseo documental con state machine,
- scoring avanzado de completion,
- decisión clara sobre `unused variables` y `shadowing`.

### Siguiente objetivo natural
Abrir **Fase 7A** con este orden:
1. topología Workspace/Solution,
2. project registry,
3. enriched symbol model,
4. visibilidad real,
5. InheritanceGraph robusto,
6. owner resolution,
7. references seguras.

---

## 10. Regla final de producto

El objetivo no es llegar rápido a muchas features, sino llegar a un plugin que combine:

- rapidez,
- estabilidad,
- valor profesional real,
- soporte para proyectos grandes y legacy,
- conocimiento fuerte de PowerBuilder 2025,
- cobertura creciente del lenguaje, runtime, DataWindow y toolchain,
- y una base suficientemente limpia para seguir creciendo sin rehacer el núcleo.
