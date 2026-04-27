# [001] Plan técnico — Bootstrap profesional del plugin

## 1. Resumen técnico

Este slice se centra en construir la **base de documentación, estructura y dirección técnica** del proyecto, sin introducir todavía lógica funcional compleja.

La implementación debe preparar el terreno para el siguiente paso natural: el wiring técnico mínimo del plugin y la activación correcta.

---

## 2. Estado actual

Estado esperado inicial:

- repositorio en fase de estructuración,
- necesidad de fijar arquitectura base,
- necesidad de dejar reglas de trabajo con IA,
- y necesidad de tener documentación canónica consistente antes de crecer.

---

## 3. Diseño propuesto

### 3.1 Documentación canónica inicial

Crear y mantener como mínimo:

- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### 3.2 Primer paquete de specs

Crear el primer slice bajo:

- `specs/001-bootstrap/spec.md`
- `specs/001-bootstrap/plan.md`
- `specs/001-bootstrap/tasks.md`
- `specs/001-bootstrap/quickstart.md`

### 3.3 Estructura técnica base recomendada

Definir como estructura objetivo inicial del repositorio:

```text
/src
  /client
  /server
  /shared
```

Sin necesidad de cerrar toda la implementación todavía.

### 3.4 Preparación para siguiente slice

Este bootstrap debe dejar al proyecto preparado para abordar de inmediato:

- activación perezosa,
- wiring LSP mínimo,
- manifiesto y bootstrap técnico inicial,
- y primeras validaciones de carga.

---

## 4. Impacto en arquitectura

Impacto alto a nivel de dirección del proyecto, pero bajo a nivel de riesgo runtime, porque este slice todavía no introduce motor funcional profundo.

Deja fijadas las decisiones base:

- cliente fino,
- servidor LSP separado,
- documentación viva,
- SDD ligero,
- slices pequeños,
- y prioridad a rendimiento.

---

## 5. Impacto en rendimiento

Impacto directo en runtime: nulo o mínimo.

Impacto indirecto: alto, porque este slice evita que futuras decisiones degraden el rendimiento por una base mal planteada.

---

## 6. Riesgos técnicos

- Sobre-documentar el bootstrap.
- Definir una estructura demasiado abstracta.
- No dejar suficientemente claro el siguiente paso implementable.

Mitigación:

- mantener documentos cortos y operativos,
- evitar features futuras inventadas,
- dejar explícito el siguiente slice técnico.

---

## 7. Estrategia de validación

### 7.1 Validación documental

Comprobar que los documentos:

- no se contradicen,
- usan el mismo enfoque,
- y sirven como guía coherente.

### 7.2 Validación de estructura

Comprobar que la estructura conceptual propuesta permite evolucionar hacia:

- cliente VS Code ligero,
- servidor LSP separado,
- y módulos compartidos reutilizables.

### 7.3 Validación operativa

Comprobar que el siguiente paso natural queda inequívocamente identificado.

---

## 8. Documentación a actualizar

En este slice deben quedar actualizados o creados:

- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `specs/001-bootstrap/*`

---

## 9. Criterio de cierre técnico

Este slice puede darse por cerrado cuando:

- la base documental existe,
- la estructura técnica base queda fijada,
- la spec 001 queda completa,
- y el repositorio queda listo para pasar al wiring técnico del plugin.
