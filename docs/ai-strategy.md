# AI Strategy — Plugin PowerBuilder 2025 para VS Code

> **Estado:** documento canónico de estrategia IA.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** principios, objetivos y límites estratégicos del uso de IA.  
> **No contiene:** flujo operativo del orquestador, prompts largos, backlog, roadmap, specs concretas ni arquitectura completa.  
> **Documento operativo central:** `docs/ai-orchestration.md`.

---

## 1. Propósito

Este documento define **por qué y bajo qué principios** se usa IA en el repositorio.

El **cómo se orquesta una tarea IA** vive en `docs/ai-orchestration.md`.

---

## 2. Principios estratégicos

### 2.1. La IA acelera, no gobierna sola

La IA ayuda a analizar, implementar, documentar y validar, pero debe respetar la documentación canónica y las decisiones del proyecto.

### 2.2. La IA no crea fuentes paralelas

No debe duplicar arquitectura, backlog, roadmap, testing, performance ni release. Debe modificar el documento propietario o enlazarlo.

### 2.3. La IA trabaja con evidencia real

Para cambios de código o arquitectura, debe revisar archivos reales antes de actuar.

### 2.4. La IA protege calidad

Debe considerar tests, performance, documentación afectada y riesgos antes de cerrar.

---

## 3. Objetivos de IA

- Reducir coste de auditoría documental.
- Generar specs técnicas claras.
- Acelerar refactors seguros.
- Detectar duplicidades y desviaciones.
- Mejorar pruebas y cobertura.
- Analizar hot paths de rendimiento.
- Ayudar en release y troubleshooting.
- Mantener documentación alineada.

---

## 4. Límites estratégicos

La IA no debe:

- cerrar sin validación;
- inventar estructura no revisada;
- tocar documentos congelados sin autorización;
- crear documentos nuevos innecesarios;
- ignorar budgets de performance;
- aplicar patrones legacy sin adaptación;
- convertir prompts en documentación canónica.

---

## 5. Relación con el orquestador

`docs/ai-orchestration.md` es el **orquestador IA** y debe aplicar esta estrategia.

La estrategia define principios.  
El orquestador define flujo.  
El routing define agentes/capacidades.  
La política LEAN define contexto.

```text
ai-strategy.md
  → principios

ai-orchestration.md
  → flujo operativo y cierre

ai/agent-skill-routing.md
  → selección de capacidades

ai/lean-token-policy.md
  → contexto mínimo suficiente
```

---

## 6. Criterio de éxito

El uso de IA es correcto si:

```text
[ ] Respeta documentos canónicos.
[ ] Reduce duplicidad.
[ ] Mejora velocidad o calidad.
[ ] Deja trazabilidad.
[ ] Actualiza documentación afectada.
[ ] No degrada rendimiento.
[ ] No sustituye revisión cuando hay riesgo.
```
