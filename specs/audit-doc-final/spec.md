# AUDIT-DOC-FINAL — Auditoría final de coherencia documental

## 1. Objetivo

Validar que la documentación final del repositorio queda organizada, sin duplicidades fuertes, sin referencias rotas y con una autoridad documental clara.

---

## 2. Problema

La documentación ha crecido por acumulación: arquitectura, estado implementado, backlog, done-log, IA tools, catálogo, build, performance y workflows comparten información en varios documentos.

Esta auditoría debe confirmar que cada documento tiene una responsabilidad única.

---

## 3. Alcance

Revisar:

- `AGENTS.md`
- `README.md`
- `docs/README.md`
- `docs/constitution.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/developer-workflows.md`
- `docs/ai/*`
- `docs/catalog/*`
- `docs/build/*`
- `docs/rules/*`
- specs activas o recientes.

---

## 4. Fuera de alcance

- Cambios funcionales de runtime.
- Nuevas features.
- Refactors de código.
- Cambios de catálogo generated/manual salvo referencias documentales.

---

## 5. Criterios de aceptación

- `current-focus.md` declara foco activo o reposo explícito.
- `backlog.md` contiene solo trabajo pendiente vivo.
- `done-log.md` contiene solo histórico cerrado.
- `architecture.md` no contiene estado histórico extenso.
- `architecture-status.md` contiene estado implementado, no backlog.
- `developer-workflows.md` describe workflows, no implementación profunda duplicada.
- `performance-budget.md` define límites y gates, no done-log.
- `testing.md` define validación, no budgets duplicados completos.
- `docs/ai/*`, `docs/catalog/*`, `docs/build/*` y `docs/rules/*` son propietarios de sus áreas.
- No hay referencias rotas conocidas.
- No hay documentos propietarios inexistentes referenciados como obligatorios.

---

## 6. Validación

Ejecutar:

```bash
npm run test:docs:drift
```

Si existen comandos de links/docs, ejecutar también:

```bash
npm run docs:links
npm run docs:validate
```

Si no existen, documentar SKIPPED y motivo.

---

## 7. Documentación afectada

- `docs/README.md`
- `AGENTS.md`
- `docs/ai/*`
- `docs/catalog/*`
- `docs/build/*`
- `docs/rules/*`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

---

## 8. Resultado esperado

Un mapa documental estable para humanos y agentes, con propiedad clara por área y sin duplicación operativa crítica.
