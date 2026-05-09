# Release — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define el **proceso de release** del plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> ¿Qué pasos deben cumplirse para preparar, validar, empaquetar y publicar una versión del plugin sin introducir regresiones funcionales, arquitectónicas, documentales o de rendimiento?

La estrategia de pruebas vive en `docs/testing.md`. Los presupuestos de rendimiento viven en `docs/performance-budget.md`. Los flujos diarios de desarrollo viven en `docs/developer-workflows.md`. La resolución de incidencias vive en `docs/troubleshooting.md`.

---

## 2. Principios de release

### 2.1. Release reproducible

Todo release debe poder reproducirse desde un estado limpio del repositorio, con dependencias instaladas, validaciones ejecutadas y artefacto generado de forma controlada.

### 2.2. Release validado, no solo empaquetado

Un release no está listo solo porque compile. Debe pasar validaciones de código, tests, documentación, rendimiento y sanity checks de uso real.

### 2.3. No publicar deuda oculta

Si existe una regresión conocida, debe estar documentada como limitación, bloqueo o decisión explícita antes de publicar.

### 2.4. Documentación alineada

Toda release debe revisar los documentos afectados por los cambios incluidos. No se deben publicar cambios de arquitectura, testing, performance, workflows o IA con documentación desalineada.

### 2.5. Troubleshooting preparado

Cada release debe dejar claro cómo diagnosticar problemas de activación, LSP, workspace, diagnostics, build, ORCA/PBAutoBuild, performance o DataWindow.

---

## 3. Tipos de release

### 3.1. Development build

Uso interno para validar cambios en curso.

Requisitos mínimos:

- compila/typecheck pasa;
- tests rápidos relevantes pasan;
- smoke básico pasa;
- no requiere changelog formal completo.

### 3.2. Candidate release

Versión candidata para validación amplia.

Requisitos mínimos:

- suite de test aplicable ejecutada;
- smoke tests completos;
- performance checks en hot paths afectados;
- documentación actualizada;
- incidencias conocidas listadas.

### 3.3. Stable release

Versión lista para usuarios/equipos.

Requisitos mínimos:

- validación completa según este documento;
- sin regresiones P0/P1 abiertas;
- documentación y troubleshooting alineados;
- artefacto versionado;
- notas de release preparadas.

---

## 4. Checklist previo a release

```text
[ ] Rama limpia y sincronizada.
[ ] Dependencias instaladas desde estado limpio.
[ ] Typecheck/build pasa.
[ ] Unit tests pasan.
[ ] Contract tests pasan si existen.
[ ] Integration tests pasan.
[ ] Smoke tests pasan.
[ ] Performance tests aplicables pasan.
[ ] E2E tests aplicables pasan.
[ ] No hay regresiones críticas abiertas.
[ ] Documentación afectada actualizada.
[ ] Backlog/current-focus alineados si aplica.
[ ] Troubleshooting revisado si cambian logs, errores, comandos o flujos.
[ ] Artefacto generado correctamente.
[ ] Release notes preparadas.
```

---

## 5. Validaciones obligatorias

### 5.1. Validación estática

Debe comprobar:

- compilación/typecheck;
- imports inválidos;
- errores de empaquetado;
- configuración del manifest si aplica;
- contribuciones de comandos, lenguajes, vistas y activation events.

### 5.2. Validación funcional

Debe comprobar:

- activación del plugin;
- arranque de Language Client/Server;
- apertura de fichero PowerScript;
- hover básico;
- completion básico;
- diagnostics básicos;
- navegación mínima si aplica.

### 5.3. Validación semántica

Debe comprobar las áreas afectadas por el release:

- parser;
- indexer;
- symbol graph;
- semantic facade;
- providers LSP;
- DataWindow;
- integraciones externas.

### 5.4. Validación de rendimiento

Debe comprobar que los hot paths relevantes respetan `docs/performance-budget.md`:

- hover;
- completion;
- signature help;
- diagnostics;
- semantic tokens;
- indexación;
- caches;
- apertura de workspace.

### 5.5. Validación documental

Debe comprobar:

- `docs/constitution.md` sigue respetado;
- `docs/architecture.md` refleja diseño objetivo si cambió;
- `docs/architecture-status.md` refleja estado real si cambió;
- `docs/testing.md` refleja cambios de estrategia de validación si aplica;
- `docs/performance-budget.md` refleja nuevos budgets o métricas si aplica;
- `docs/developer-workflows.md` refleja comandos/flujos nuevos si aplica;
- `docs/troubleshooting.md` refleja nuevos errores/logs/fallos conocidos si aplica.

---

## 6. Flujo de preparación de release

### Paso 1 — Congelar alcance

Definir qué entra en la release y qué queda fuera.

No se debe mezclar:

- cambios no relacionados;
- refactors grandes sin tests;
- documentación incompleta;
- specs a medio cerrar;
- fixes no validados.

### Paso 2 — Actualizar versión y metadatos

Actualizar versión, manifest, changelog/notas y cualquier metadata necesaria del paquete.

### Paso 3 — Ejecutar validaciones

Ejecutar las suites definidas en `docs/testing.md` según el alcance de la release.

Carril ejecutable canónico:

- `npm run release:verify` es la validación local completa de release readiness.
- Este carril incluye empaquetado VSIX, verificación de contenidos, smoke instalada con `npm run test:smoke:installed-vsix` y resumen final.
- Desde Wave 08, `release:verify` mantiene el gate rápido de performance con smoke sintético a través de `npm run test:performance:gate`, pero el lane `10k` completo queda fuera del carril obligatorio y vive en `npm run test:performance:10k:nightly`/workflow opcional.

### Paso 4 — Generar artefacto

Generar el paquete publicable del plugin con el proceso estándar del repositorio.

Artefacto esperado:

- el paquete resultante debe quedar en `.dist/vsc-powersyntax.vsix`.

### Paso 5 — Validar instalación local

Instalar el artefacto generado en un entorno limpio o Extension Development Host equivalente y ejecutar smoke manual mínimo.

### Paso 6 — Preparar notas de release

Las notas deben incluir:

- resumen de cambios;
- mejoras principales;
- correcciones relevantes;
- cambios de comportamiento;
- limitaciones conocidas;
- instrucciones de actualización si aplica.

### Paso 7 — Publicar

Publicar solo si todas las validaciones obligatorias están completas o las excepciones están justificadas.

Política de publicación:

- la credencial de publicación requerida es `VSCE_PAT`.
- el workflow de release readiness conserva artefactos con `retention-days: 14`.
- el carril de readiness `never publishes automatically`; la publicación sigue siendo un paso explícito y aprobado.
- el workflow también puede ejecutar un job `synthetic-10k` por `schedule` o `workflow_dispatch` explícito, en `report-only`, para mantener trazabilidad de escala sin bloquear releases normales.

### Paso 8 — Verificación post-release

Tras publicar:

- confirmar instalación/actualización;
- abrir workspace PowerBuilder de prueba;
- revisar logs básicos;
- confirmar que no hay errores críticos de activación;
- registrar incidencias si aparecen.

---

## 7. Release notes

Las release notes deben ser breves, trazables y útiles.

Formato recomendado:

```markdown
# Release X.Y.Z

## Resumen

## Añadido

## Cambiado

## Corregido

## Rendimiento

## Documentación

## Limitaciones conocidas

## Validación realizada
```

No deben contener specs completas ni histórico exhaustivo. El histórico cerrado vive en `docs/done-log.md` cuando corresponda.

---

## 8. Criterios de bloqueo

Una release debe bloquearse si existe cualquiera de estos casos:

- el plugin no activa;
- el Language Server no arranca;
- se bloquea VS Code en apertura o edición normal;
- hay regresión grave de hover/completion/diagnostics;
- se publican diagnostics obsoletos o incorrectos de forma sistemática;
- indexación rompe workspaces existentes;
- falla empaquetado o instalación local;
- falta documentación crítica para un cambio de arquitectura/uso;
- hay fuga de memoria o latencia fuera de presupuesto sin fallback;
- una integración externa rompe el core cuando la herramienta no está disponible.

---

## 9. Criterios de excepción

Una excepción solo puede aceptarse si:

- no afecta P0/P1;
- está documentada como limitación conocida;
- tiene workaround o degradación segura;
- existe entrada accionable en backlog/spec si requiere corrección posterior;
- no contradice `docs/constitution.md`.

---

## 10. Relación con troubleshooting

Si durante una release aparece un fallo recurrente, debe añadirse a `docs/troubleshooting.md` con:

```text
síntoma
causa probable
validaciones
solución/workaround
logs necesarios
documentos relacionados
```

No se deben esconder errores conocidos únicamente en notas de release.

---

## 11. Checklist post-release

```text
[ ] Artefacto publicado o distribuido.
[ ] Instalación validada.
[ ] Activación validada.
[ ] Workspace PowerBuilder de prueba abre correctamente.
[ ] Logs revisados.
[ ] Notas de release disponibles.
[ ] Incidencias post-release registradas si aplica.
[ ] Backlog actualizado con follow-ups si aplica.
```