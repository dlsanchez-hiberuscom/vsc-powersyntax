# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica u utilidad profesional real, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs, no duplicar ítems padre.
- Registrar deuda nueva en Backlog derivado.
- Tratar `plugin_old` como guía, no como código a portar por inercia.
- Las dependencias hacia ítems Done se consideran ya satisfechas y quedan como trazabilidad histórica.

---

## 2. Estados oficiales

- **Open:** sin slice activa de cierre.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, docs o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.

---

## 3. Orden maestro de prioridad

### L0 — Core platform no negociable

Estado: cerrado como bloque operativo. Los ítems cerrados viven en `done-log.md`.

### L1 — Persistencia y modelo de workspace/proyecto

Pendiente de cierre operativo fino.

### L2 — Query engine y serving profesional

Foco principal actual.

### L3 — Validación fuerte, salud interna y excelencia operativa

Preparación y validación transversal permitida si no bloquea L2.

### L4 — Especialización PowerBuilder y automatización

Solo después de consolidar L0-L3, salvo investigación preparatoria.

---

## 4. Ítems cerrados fuera del backlog activo

Los siguientes ítems ya no deben aparecer como trabajo activo:

```text
B063, B065, B066, B071B, B109, B122, B123, B124, B125, B126,
B134, B141, B141A, B151, B151A, B152, B152A, B153, B154,
B156, B158, B159, B164, B165, B166, B169, B169A, B170,
B172, B173, B174
```

El detalle técnico de cierre vive en `done-log.md`.

---

# 5. Backlog activo

# L1 — Persistencia y modelo de workspace/proyecto

## B155 — Checkpoints reales de indexación y resume robusto
- **Estado:** Open
- **Track:** persistencia
- **Depende de:** B125, B141
- **Desbloquea:** B071
- **Objetivo:** reaperturas rápidas y resume seguro del pipeline.
- **Pendiente exacto:**
  - persistir/restaurar discovery, parse, enrich y readiness;
  - validar resume parcial en interrupciones;
  - evitar recomputado completo si fingerprints/epochs coinciden.
- **Cierre:** el motor recupera estado de discovery / parse / enrich / readiness sin recomputar todo.

## B167 — Journaling transaccional de caché persistente
- **Estado:** Open
- **Track:** persistencia robusta
- **Depende de:** B155
- **Desbloquea:** B168
- **Objetivo:** evitar corrupción de caché y estados incompletos.
- **Pendiente exacto:**
  - recovery probado ante cierre abrupto;
  - limpieza de journal aplicado;
  - tests de corrupción parcial.
- **Cierre:** cierres abruptos o fallos no dejan la caché en estado incierto.

## B168 — Cache schema versioning + migraciones
- **Estado:** Open
- **Track:** persistencia robusta
- **Depende de:** B167
- **Desbloquea:** B071
- **Objetivo:** versionar persistencia y decidir migrar/invalidate/rebuild con seguridad.
- **Pendiente exacto:**
  - política explícita de migrate/rebuild;
  - tests por versión incompatible;
  - documentación de schema persistente.
- **Cierre:** la persistencia escala entre versiones del motor sin hacks.

## B071 — Warm indexing y resume de caché persistente
- **Estado:** Open
- **Track:** persistencia
- **Depende de:** B155, B167, B168
- **Objetivo:** evitar cold indexing en cada reapertura.
- **Pendiente exacto:**
  - medir cold vs warm;
  - validar en workspace grande;
  - exponer restored/reused/rebuilt en status.
- **Cierre:** reaperturas claramente más rápidas en workspaces grandes.

---

# L2 — Query engine y serving profesional

## B157 — Semantic evidence de primera clase
- **Estado:** Open
- **Track:** explicabilidad
- **Depende de:** B156
- **Desbloquea:** B171, B175 y futuras ampliaciones explicables de la API pública
- **Legacy refs:** absorbe B136
- **Objetivo:** modelar formalmente por qué una resolución ganó o fue descartada.
- **Pendiente exacto:**
  - evidence para candidatos ganadores;
  - evidence para descartes y candidatos perdedores;
  - reason codes normalizados;
  - confidence formal calculada por feature;
  - exposición segura en API/diagnostics/stats.
- **Cierre:** scope, visibilidad, library order, distance, readiness, confidence y descartes quedan trazados.

## B171 — Confidence gates por feature
- **Estado:** Open
- **Track:** seguridad de serving
- **Depende de:** B157, B158, B141
- **Desbloquea:** B031, B032, B036
- **Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.
- **Cierre:** rename y references peligrosas exigen confianza alta; otras degradan con seguridad.

## B160 — Query result cache con claves semánticas estables
- **Estado:** Open
- **Track:** serving performance
- **Depende de:** B156, B174
- **Desbloquea:** B031, B032
- **Objetivo:** cachear respuestas semánticas seguras.
- **Pendiente exacto:**
  - hit ratio observable;
  - claves estables para más query types;
  - invalidación probada por epoch/readiness/confidence.
- **Cierre:** hit ratio observable, claves estables, invalidación correcta.

## B031 — Referencias más precisas y robustas
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B157, B171, B160
- **Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.
- **Cierre:** results precisos, separados por confianza y explicables sobre topología real.

## B032 — Rename controlado
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B157, B158, B171
- **Objetivo:** ampliar rename solo en escenarios semánticamente seguros.
- **Pendiente exacto:**
  - conectar con confidence gates;
  - ampliar rename local/parámetros/miembros tipados;
  - tests negativos para casos ambiguos/dinámicos.
- **Cierre:** rename local/parámetros/miembros tipados seguro según confidence gates.

## B036 — Code actions básicas
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B171
- **Objetivo:** quick fixes pequeños, seguros y explicables.
- **Pendiente exacto:**
  - catálogo mínimo estable;
  - evidence/confidence por action;
  - tests de no modificación peligrosa.
- **Cierre:** catálogo pequeño pero confiable de acciones.

## B107 — Status bar con contexto de proyecto
- **Estado:** Open
- **Track:** UX profesional
- **Depende de:** B134, B141
- **Objetivo:** unificar progreso + proyecto activo + acciones de mantenimiento.
- **Pendiente exacto:**
  - estado de project model;
  - estado de cache/warm indexing;
  - accesos rápidos a stats/health/build;
  - evitar status decorativo sin acción útil.
- **Cierre:** status bar realmente útil, no decorativa.

## B067 — Formateador configurable
- **Estado:** Open
- **Track:** productividad
- **Depende de:** B156
- **Objetivo:** formateo configurable solo sobre base sintáctica/semántica fiable.
- **Cierre:** formatter sin romper constructs PowerBuilder reales.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

## B030 — Validación sobre workspace grande real
- **Estado:** Open
- **Track:** validación
- **Depende de:** B141, B155
- **Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.
- **Cierre:** corpus reales integrados en el ciclo, no solo fixtures sintéticos.

## B069 — Fixtures reales permanentes de PFC/legacy
- **Estado:** Open
- **Track:** regresión
- **Depende de:** B030
- **Objetivo:** fixtures permanentes y mantenidos.
- **Cierre:** corpus representativos integrados en regresión.

## B068 — Calibración real del performance budget
- **Estado:** Open
- **Track:** performance
- **Depende de:** B030
- **Objetivo:** convertir budgets teóricos en budgets medidos.
- **Cierre:** budgets ajustados sobre datos reales.

## B119 — Performance regression suite
- **Estado:** Open
- **Track:** QA/perf
- **Depende de:** B068
- **Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.
- **Cierre:** suite estable de regresión de rendimiento.

## B070 — Memory budgets de caché e índice
- **Estado:** Open
- **Track:** escala
- **Depende de:** B164
- **Objetivo:** límites explícitos de memoria y métricas por capa.
- **Cierre:** budgets definidos, medidos y vigilados.

## B118 — Integration test matrix del plugin
- **Estado:** Open
- **Track:** QA
- **Depende de:** B030, B155
- **Objetivo:** lifecycle real del plugin y workspaces reales.
- **Cierre:** activation + client/server + Solution + Workspace + VS Code test tooling.

## B161 — Golden tests semánticos end-to-end
- **Estado:** Open
- **Track:** QA semántica
- **Depende de:** B156, B157, B030
- **Objetivo:** contratos visibles de comportamiento semántico.
- **Cierre:** hover/definition/references/rename eligibility/readiness cubiertos por goldens.

## B162 — Reconciliación parser / symbol model / salida LSP
- **Estado:** Open
- **Track:** consistencia interna
- **Depende de:** B151, B156
- **Objetivo:** detectar incoherencias internas antes de publicarlas.
- **Cierre:** aserciones internas útiles y reportes claros de inconsistencias.

## B163 — Semantic work journal / event log del motor
- **Estado:** Open
- **Track:** observabilidad
- **Depende de:** B126
- **Objetivo:** event log técnico para tuning y debugging.
- **Cierre:** journal exportable con fases, hits/misses, invalidaciones y latencias.

## B175 — Repro packs automáticos para bugs semánticos
- **Estado:** Open
- **Track:** mantenibilidad
- **Depende de:** B157, B163, B162
- **Objetivo:** generar paquetes de repro para bugs complejos.
- **Cierre:** un bug semántico complejo puede reproducirse sin reconstruir contexto manualmente.

## B176 — Health checker interno del motor
- **Estado:** Open
- **Track:** salud interna
- **Depende de:** B126, B162, B172
- **Objetivo:** revisar coherencia de caches, índices, readiness y snapshots.
- **Pendiente exacto:**
  - checks formales por capa;
  - severidad/warnings/errors;
  - export machine-readable;
  - integración con status y event log.
- **Cierre:** health checker detecta degradación interna antes del bug visible.

---

# L4 — Especialización PowerBuilder y automatización

## B117 — DataWindow safe mode mínimo
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** L0-L3 suficientemente maduros
- **Objetivo:** soporte seguro mínimo de `.srd`.
- **Cierre:** detección, SQL base, args, columnas, bandas principales, hover/navegación básica.

## B139 — DataWindow safe-mode desde `plugin_old`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B117
- **Objetivo:** reaprovechar parser/definition/hover seguros del legacy.
- **Cierre:** safe-mode mejorado sin abrir superficie avanzada completa.

## B041 — Catálogo y navegación de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B117, B139
- **Objetivo:** DataWindow/DataStore como entidades semánticas de primer nivel.
- **Cierre:** navegación y catálogo básicos integrados.

## B042 — Soporte avanzado de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B041
- **Objetivo:** expresiones, propiedades avanzadas, funciones, relaciones con DataStore.
- **Cierre:** soporte ampliado y estable.

## B081 — Inteligencia de DataWindow y acceso a `.Object`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B042
- **Objetivo:** cubrir `dw_1.Object`.
- **Cierre:** navegación/validación seguras en acceso a `.Object`.

## B043 — Integración con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B141
- **Objetivo:** build moderno oficial.
- **Cierre:** lanzar build, validar entorno, capturar errores y alimentar health del workspace.

## B181 — PBAutoBuild capability detection
- **Estado:** Open
- **Track:** build / tooling detection
- **Depende de:** B043, B141
- **Objetivo:** detectar `PBAutoBuild250.exe`, versión/capabilities y disponibilidad de entorno.
- **Cierre:** el plugin informa si PBAutoBuild está disponible sin bloquear ni lanzar build.

## B182 — PBAutoBuild build-file discovery and validation
- **Estado:** Open
- **Track:** build / project model
- **Depende de:** B181, B141
- **Objetivo:** descubrir y validar JSON de PBAutoBuild.
- **Cierre:** el plugin sabe qué build files existen, qué proyecto representan y si son utilizables.

## B183 — PBAutoBuild command runner out-of-process
- **Estado:** Open
- **Track:** build / execution
- **Depende de:** B181, B182, B126
- **Objetivo:** ejecutar PBAutoBuild sin bloquear Extension Host ni LSP.
- **Cierre:** build observable, cancelable y seguro desde VS Code.

## B184 — PBAutoBuild log parser and Problems Panel integration
- **Estado:** Open
- **Track:** build / diagnostics
- **Depende de:** B183, B063
- **Objetivo:** convertir logs de build/error en diagnósticos navegables cuando sea posible.
- **Cierre:** errores de build aparecen en Problems Panel sin inventar ubicaciones.

## B185 — PBAutoBuild build profiles, commands and status UX
- **Estado:** Open
- **Track:** build / UX
- **Depende de:** B183, B184, B107
- **Objetivo:** comandos de usuario para build frecuente.
- **Cierre:** el usuario puede ejecutar builds habituales sin recordar comandos manuales.

## B186 — PBAutoBuild CI/CD helper export
- **Estado:** Open
- **Track:** build / automation
- **Depende de:** B185, B110
- **Objetivo:** generar ayudas reproducibles para CI/CD.
- **Cierre:** build local validado se puede llevar a CI/CD sin acoplarse a proveedor.

## B187 — Unified build health model
- **Estado:** Open
- **Track:** build / health
- **Depende de:** B181, B182, B184, B176
- **Objetivo:** unificar estado de build moderno en health checker.
- **Cierre:** el usuario entiende si el workspace está listo para build moderno.

## B188 — ORCA adapter architecture
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B141, B109, B176
- **Objetivo:** adaptador ORCA opcional, out-of-process y separado del hot path.
- **Cierre:** skeleton operativo para invocar ORCA sin acoplarlo al core semántico.

## B189 — ORCA capability detection and environment validation
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B188
- **Objetivo:** detectar si ORCA puede usarse y validar entorno/versiones.
- **Cierre:** ausencia de ORCA no rompe el plugin y queda explicada claramente.

## B190 — PBL library graph and directory discovery read-only
- **Estado:** Open
- **Track:** legacy ecosystem / PBL discovery
- **Depende de:** B188, B189, B141
- **Objetivo:** listar PBLs y objetos read-only e integrarlos en project model.
- **Cierre:** el plugin entiende topología PBL legacy sin modificar nada.

## B191 — ORCA export to staging source
- **Estado:** Open
- **Track:** legacy ecosystem / export
- **Depende de:** B190, B155
- **Objetivo:** exportar objetos desde PBL a staging indexable.
- **Cierre:** proyecto PBL-only puede analizarse desde VS Code sin modificar PBL.

## B192 — ORCA staging provenance and source priority
- **Estado:** Open
- **Track:** legacy ecosystem / source model
- **Depende de:** B172, B190, B191
- **Objetivo:** evitar confusión entre source real y source exportado.
- **Cierre:** serving y diagnósticos explican de dónde viene cada símbolo.

## B193 — ORCA import and compile controlled
- **Estado:** Open
- **Track:** legacy ecosystem / import
- **Depende de:** B191, B192, B184
- **Objetivo:** importar cambios a PBL de forma explícita, controlada y compilada.
- **Cierre:** import seguro con preflight, backup, compile result y rollback documentado.

## B194 — ORCA regenerate and rebuild commands
- **Estado:** Open
- **Track:** legacy ecosystem / build
- **Depende de:** B193, B176
- **Objetivo:** comandos legacy regenerate/rebuild vía ORCA.
- **Cierre:** operaciones legacy observables y seguras desde VS Code.

## B195 — ORCA executable/PBD operations behind feature flag
- **Estado:** Open
- **Track:** legacy ecosystem / packaging
- **Depende de:** B194
- **Objetivo:** evaluar si exponer creación de ejecutables/PBD/DLL vía ORCA.
- **Cierre:** decisión documentada sin contaminar ruta PBAutoBuild.

## B196 — PBL/source synchronization safety
- **Estado:** Open
- **Track:** legacy ecosystem / safety
- **Depende de:** B192, B193
- **Objetivo:** proteger contra inconsistencias PBL/staging/source real.
- **Cierre:** evita importar source equivocado o desactualizado.

## B197 — Build and ORCA event journal
- **Estado:** Open
- **Track:** observability / event log
- **Depende de:** B163, B183, B194
- **Objetivo:** registrar eventos técnicos de build y ORCA.
- **Cierre:** fallos de build/ORCA diagnosticables sin reconstrucción manual.

## B198 — Build/ORCA documentation and troubleshooting
- **Estado:** Open
- **Track:** docs / operability
- **Depende de:** B186, B187, B194, B197
- **Objetivo:** documentar flujo moderno PBAutoBuild y legacy ORCA.
- **Cierre:** README/docs explican cuándo usar PBAutoBuild, cuándo ORCA y riesgos.

## B199 — Spec-driven PBL update workflow
- **Estado:** Open
- **Track:** legacy ecosystem / spec automation
- **Depende de:** B191, B192, B193, B196, B197
- **Objetivo:** permitir que una spec modifique source exportado y actualice PBL afectadas controladamente.
- **Cierre:** una spec puede dejar PBL actualizadas con trazabilidad, validación y recuperación.

## B200 — Bulk PBL export/import orchestration
- **Estado:** Open
- **Track:** legacy ecosystem / automation
- **Depende de:** B199
- **Objetivo:** coordinar export/import masivo de múltiples PBL.
- **Cierre:** sincronización amplia contra PBL segura y observable.

---

# L5 — Documentación IA-first y workflows

## B201 — IA-first documentation reorganization
- **Estado:** Open
- **Track:** docs / governance
- **Objetivo:** reorganizar documentación para que IA tenga ruta clara, sin duplicidades ni contradicciones.
- **Debe contener:**
  - crear `00-ai-entrypoint.md`;
  - ampliar `product-operating-model.md`;
  - simplificar `current-focus.md`;
  - alinear SDD y constitución;
  - mejorar agentes IA;
  - añadir matriz de documentación viva;
  - limpiar duplicados entre roadmap/backlog/done-log;
  - actualizar testing baseline;
  - reformular `future-insights-from-old-plugin.md`.
- **Cierre:** Copilot puede leer docs en orden claro, ejecutar specs y actualizar documentación viva sin contradicciones.

## B202 — Rules catalog and diagnostics governance
- **Estado:** Open
- **Track:** docs / diagnostics
- **Depende de:** B201
- **Objetivo:** crear catálogo versionado de reglas diagnósticas.
- **Cierre:** diagnósticos con IDs, severidad, readiness, confidence, falsos positivos y tests documentados.

## B203 — Developer workflows documentation
- **Estado:** Open
- **Track:** docs / product UX
- **Depende de:** B201
- **Objetivo:** documentar workflows reales de programación PowerBuilder.
- **Cierre:** roadmap y backlog priorizan features visibles contra workflows reales.

---

# 6. Current execution focus

## Fase activa — Evidence y confidence para serving seguro

**Orden inmediato:**

1. B157 — Semantic evidence de primera clase
2. B171 — Confidence gates por feature
3. B160 — Query result cache con claves semánticas estables
4. B031 — Referencias más precisas y robustas
5. B032 — Rename controlado
6. B036 — Code actions básicas
7. B107 — Status bar con contexto de proyecto

## Persistencia robusta pendiente

Ejecutar en paralelo solo si no bloquea el foco principal:

1. B155
2. B167
3. B168
4. B071

## Validación temprana permitida

Puede avanzar en modo preparatorio:

1. B030
2. B069
3. B068
4. B119

---

# 7. Backlog derivado

- Evaluar si `B083` debe convertirse en épica padre o eliminarse como duplicado funcional tras `B181-B187`.
- Evaluar si `B048` debe convertirse en épica padre o eliminarse como duplicado funcional tras `B188-B196`.
- Definir política oficial de `.hiberus-powersyntax/orca-export/` en `.gitignore`.
- Definir si staging ORCA puede editarse directamente o si debe abrirse readonly hasta `B193`.
- Definir matriz de soporte: PowerBuilder 2025 workspace/solution, target `.pbt`, PBL-only legacy y source plain-text.
