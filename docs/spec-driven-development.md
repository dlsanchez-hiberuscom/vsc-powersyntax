# Spec-Driven Development (SDD) para el plugin PowerBuilder 2025 de VS Code

## 1. Propósito

Este repositorio adopta un enfoque **Spec-Driven Development (SDD)** para desarrollar un plugin profesional de **PowerBuilder 2025 para Visual Studio Code** con foco en:

- rapidez de carga,
- arquitectura LSP profesional,
- mantenibilidad,
- validación continua,
- documentación viva,
- y colaboración efectiva con IA.

En este proyecto, la especificación no es un documento decorativo: es el artefacto que dirige el cambio.

---

## 2. Qué significa SDD en este repositorio

Aquí SDD significa:

1. definir primero el **qué** y el **por qué**,
2. concretar después el **cómo** técnico,
3. trocear el trabajo en tareas pequeñas y revisables,
4. implementar contra la spec,
5. validar,
6. y dejar la documentación sincronizada con el código real.

El repositorio adopta un modelo **spec-first + spec-anchored**:

- **spec-first**: no se implementa una feature relevante sin spec previa;
- **spec-anchored**: la spec se mantiene viva durante la evolución del cambio.

No se adopta, por ahora, un modelo “spec-as-source” estricto.

---

## 3. Objetivos del método

El método SDD de este proyecto persigue estos objetivos:

- reducir ambigüedad antes de implementar,
- evitar retrabajo,
- obligar a slices pequeños y valiosos,
- mejorar la calidad de revisión,
- mantener trazabilidad entre intención, tareas, código y validación,
- y hacer que la IA trabaje con contexto correcto y no por improvisación.

---

## 4. Principios del proceso

### 4.1 La spec es la fuente de verdad

Toda feature o cambio relevante debe nacer de una spec o actualizar una existente.

### 4.2 La spec debe ser humana y revisable

Si un documento se vuelve demasiado largo, repetitivo o difícil de revisar, debe dividirse.

### 4.3 Primero intención, luego detalle técnico

La spec funcional describe el problema, el valor, el alcance y la aceptación.

El diseño técnico traduce esa intención a arquitectura, módulos, riesgos y validación.

### 4.4 Slice pequeño antes que macrofeature

Toda feature debe dividirse en unidades pequeñas, comprensibles y verificables.

### 4.5 Nada se cierra con docs desalineadas

Código, spec, backlog y documentación canónica deben quedar alineados.

---

## 5. Flujo oficial del proyecto

El flujo oficial es:

1. **Constitution**
2. **Specify**
3. **Plan**
4. **Tasks**
5. **Implement**
6. **Validate**
7. **Update docs**

### 5.1 Constitution

La constitución fija reglas permanentes del repositorio: arquitectura, rendimiento, calidad, documentación y uso de IA.

### 5.2 Specify

La spec funcional define:

- problema,
- objetivo,
- usuarios o actores,
- alcance,
- fuera de alcance,
- requisitos,
- criterios de aceptación,
- riesgos o dudas abiertas.

### 5.3 Plan

El plan técnico define:

- estrategia de implementación,
- módulos afectados,
- contratos,
- impacto en rendimiento,
- riesgos técnicos,
- validación,
- documentación a actualizar.

### 5.4 Tasks

Las tareas convierten la spec y el plan en trabajo ejecutable pequeño.

### 5.5 Implement

La implementación debe seguir tareas concretas y no desviarse del alcance definido.

### 5.6 Validate

Toda feature debe validarse de acuerdo con su impacto.

### 5.7 Update docs

No se considera terminado ningún cambio hasta dejar sincronizada la documentación afectada.

---

## 6. Artefactos oficiales

### 6.1 Documentación global

Ubicación recomendada:

```text
/docs
  constitution.md
  architecture.md
  roadmap.md
  backlog.md
  current-focus.md
  testing.md
  performance-budget.md
```

### 6.2 Specs por feature

Ubicación recomendada:

```text
/specs
  /001-nombre-feature
    spec.md
    plan.md
    tasks.md
    quickstart.md
```

### 6.3 Objetivo de cada artefacto

- `constitution.md`: reglas permanentes y no negociables.
- `spec.md`: qué se quiere construir y por qué.
- `plan.md`: cómo se resolverá técnicamente.
- `tasks.md`: trabajo ejecutable y revisable.
- `quickstart.md`: guía rápida de validación.

---

## 7. Plantillas mínimas

### 7.1 Plantilla de `spec.md`

```md
# [NNN] Nombre de la feature

## 1. Resumen
Qué se quiere construir y por qué.

## 2. Problema
Qué dolor, limitación o necesidad resuelve.

## 3. Objetivo
Resultado esperado del cambio.

## 4. Usuarios / actores
Quién se beneficia o interactúa con esto.

## 5. Alcance
Qué entra exactamente.

## 6. Fuera de alcance
Qué no entra en este slice.

## 7. Requisitos
- R1 ...
- R2 ...
- R3 ...

## 8. Criterios de aceptación
- AC1 ...
- AC2 ...
- AC3 ...

## 9. Riesgos / dudas abiertas
- ...
```

### 7.2 Plantilla de `plan.md`

```md
# [NNN] Plan técnico

## 1. Resumen técnico
Cómo se resolverá el slice.

## 2. Estado actual
Qué existe hoy y qué condiciona el cambio.

## 3. Diseño propuesto
Arquitectura, módulos, contratos y flujo.

## 4. Impacto en rendimiento
Arranque, memoria, indexación, latencia, I/O.

## 5. Riesgos técnicos
- ...
- ...

## 6. Estrategia de validación
- tests
- validación manual
- performance checks

## 7. Documentación a actualizar
- README
- architecture.md
- backlog/current-focus
- etc.
```

### 7.3 Plantilla de `tasks.md`

```md
# [NNN] Tasks

- [ ] T1. Preparar wiring / configuración base
- [ ] T2. Implementar módulo o servicio principal
- [ ] T3. Añadir validaciones o tests
- [ ] T4. Validar en workspace real
- [ ] T5. Actualizar documentación afectada
- [ ] T6. Verificar criterios de aceptación
```

---

## 8. Reglas para escribir buenas specs

Una buena spec en este proyecto debe ser:

- clara,
- concisa,
- orientada a comportamiento,
- testable,
- trazable,
- acotada al slice actual,
- y fácil de revisar por una persona.

Si la spec no puede revisarse de forma realista, debe dividirse.

---

## 9. Anti-patrones prohibidos

Quedan explícitamente desaconsejados estos anti-patrones:

- generar specs que nadie revisa,
- producir markdown excesivo para cambios pequeños,
- intentar especificar todo el futuro del producto de una vez,
- permitir drift entre spec y código,
- usar criterios de aceptación subjetivos,
- y cerrar cambios con documentación desalineada.

---

## 10. Criterios de aceptación del proyecto

Toda feature debe expresar aceptación de forma verificable.

Ejemplos válidos para este repositorio:

- al abrir un archivo PowerBuilder, el plugin responde sin bloquear el editor;
- la carga inicial no dispara trabajo pesado innecesario;
- el análisis del archivo activo tiene prioridad sobre la indexación global;
- y la documentación afectada queda actualizada en el mismo ciclo de trabajo.

---

## 11. Política de uso de IA

Cuando se use IA en este repositorio, la secuencia obligatoria será:

1. leer constitución y docs relevantes,
2. crear o actualizar la spec,
3. crear o actualizar el plan,
4. trocear en tareas,
5. implementar,
6. validar,
7. actualizar documentación.

La IA no debe:

- inventar nuevas features,
- saltarse el alcance definido,
- reabrir arquitectura cerrada sin causa,
- cerrar cambios sin validación,
- ni dejar documentación afectada sin actualizar.

---

## 12. Definición de Ready

Una feature está **Ready** cuando:

- la spec es clara y acotada,
- el alcance está definido,
- el fuera de alcance está definido,
- la aceptación es verificable,
- el plan técnico es suficiente,
- y las tareas son razonables y pequeñas.

---

## 13. Definición de Done

Una feature está **Done** solo cuando:

- cumple los criterios de aceptación,
- pasa la validación prevista,
- no degrada injustificadamente la experiencia,
- la documentación está actualizada,
- y el estado real coincide con spec, tareas y documentación canónica.

---

## 14. Resumen operativo

Este proyecto usará un **SDD ligero, vivo y pragmático**.

No se busca producir más documentos, sino:

- mejores decisiones,
- mejor trazabilidad,
- mejor calidad de revisión,
- y una evolución más segura del plugin.

La meta es construir un plugin rápido, profesional y mantenible, con una base fuerte para desarrollo asistido por IA sin perder control técnico.
