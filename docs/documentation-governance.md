# Documentation Governance — PowerBuilder VS Code Plugin

## 1. Propósito

Definir cómo se gobierna la documentación del repositorio para evitar duplicidades, contradicciones, documentos monolíticos y deriva entre arquitectura, backlog, specs, estado real y done-log.

Este documento es propietario de:

- ownership documental;
- reglas anti-duplicidad;
- autoridad documental por tipo de contenido;
- proceso de creación, modificación y cierre documental;
- reglas para agentes IA al modificar documentación.

---

## 2. Principio base

Cada documento debe responder a una única pregunta.

```txt
constitution.md        -> qué reglas no se pueden romper
architecture.md        -> cómo está diseñado el sistema
architecture-status.md -> qué está implementado ahora
backlog.md             -> qué falta por hacer
current-focus.md       -> qué se está haciendo ahora
done-log.md            -> qué se cerró con evidencia
roadmap.md             -> hacia dónde evoluciona el producto
testing.md             -> cómo se valida
performance-budget.md  -> qué límites de rendimiento se protegen
developer-workflows.md -> qué valor ve el usuario
```

---

## 3. Autoridad documental

En caso de conflicto, manda este orden:

```txt
1. docs/constitution.md
2. docs/architecture.md
3. specs aprobadas en specs/
4. docs/architecture-status.md
5. docs/current-focus.md
6. docs/backlog.md
7. docs/roadmap.md
8. docs/done-log.md
9. implementación actual
```

La implementación actual no invalida por sí sola una decisión documental vigente. Si existe divergencia, debe documentarse y corregirse.

---

## 4. Ownership por área

```txt
Reglas no negociables     -> docs/constitution.md
Arquitectura estable      -> docs/architecture.md
Estado implementado       -> docs/architecture-status.md
Backlog activo            -> docs/backlog.md
Foco actual               -> docs/current-focus.md
Histórico cerrado         -> docs/done-log.md
Roadmap                   -> docs/roadmap.md
Testing                   -> docs/testing.md
Performance               -> docs/performance-budget.md
Workflows usuario         -> docs/developer-workflows.md
IA y agentes              -> docs/ai/* + AGENTS.md
Catálogo                  -> docs/catalog/*
Build/VSIX/ORCA           -> docs/build/* + docs/release/*
Core semántico            -> docs/core/*
DataWindow                -> docs/datawindow/*
SQL/runtime               -> docs/sql/*
Observabilidad runtime    -> docs/runtime/*
Reglas diagnósticas       -> docs/rules/*
```

Si un área no tiene documento propietario, se debe crear backlog antes de duplicar contenido en documentos generales.

---

## 5. Reglas anti-duplicidad

### 5.1 Permitido

Se permite repetir una referencia breve a la meta maestra, siempre con enlace al documento propietario.

Ejemplo:

```md
Este documento aplica la meta maestra definida en `docs/constitution.md`.
```

### 5.2 Prohibido

No duplicar:

- listas largas de features implementadas;
- instrucciones de validación completas en varios documentos;
- arquitectura detallada en workflows;
- backlog dentro de roadmap;
- done-log dentro de architecture-status;
- estrategia IA dentro de catálogo de agentes;
- detalles ORCA/PBAutoBuild dentro de performance-budget.

---

## 6. Qué va en cada documento

### `architecture.md`

Debe contener principios estables, capas, invariantes, contratos y reglas de dependencia.

No debe contener histórico, Bxxx, done-log, resultados de tests ni backlog.

### `architecture-status.md`

Debe contener estado implementado actual, rails existentes, guardrails vigentes y riesgos a vigilar.

No debe contener roadmap ni backlog detallado.

### `backlog.md`

Debe contener trabajo pendiente vivo, prioridad, estado, spec, evidencia, pendiente exacto, criterios de cierre y validación.

No debe contener histórico cerrado ni explicación larga de arquitectura.

### `current-focus.md`

Debe ser corto. Debe indicar foco activo, trabajo permitido, fuera de foco y siguiente paso.

### `done-log.md`

Debe registrar solo trabajo cerrado con evidencia. No define foco activo.

---

## 7. Proceso para cambios documentales

Todo cambio documental relevante debe seguir este ciclo:

```txt
1. Identificar documento propietario.
2. Revisar documentos relacionados.
3. Modificar una única fuente de verdad.
4. Reemplazar duplicados por enlaces.
5. Actualizar backlog/current-focus/roadmap si aplica.
6. Actualizar done-log solo si hay cierre real.
7. Ejecutar docs drift.
```

Validación mínima:

```bash
npm run test:docs:drift
```

---

## 8. Reglas para agentes IA

La IA debe:

- leer `AGENTS.md`;
- respetar `docs/current-focus.md`;
- usar `docs/backlog.md` como fuente de trabajo pendiente;
- no usar `done-log.md` como foco activo;
- modificar el documento propietario, no duplicar en otro;
- actualizar enlaces cruzados;
- dejar evidencia.

La IA no debe:

- crear documentos nuevos sin ownership claro;
- copiar bloques largos entre documentos;
- mover contenido a done-log sin validación;
- cerrar specs por cambios meramente textuales si faltan tests o evidencia.

---

## 9. Criterios de aceptación de una reorganización documental

Una reorganización documental está completa si:

- no hay documentos propietarios inexistentes referenciados como obligatorios;
- `backlog.md`, `current-focus.md`, `roadmap.md` y `done-log.md` no se contradicen;
- cada área tiene documento propietario;
- las duplicidades largas han sido sustituidas por enlaces;
- `npm run test:docs:drift` está verde o el fallo está documentado;
- los cambios quedan reflejados en specs/backlog si aplica.
