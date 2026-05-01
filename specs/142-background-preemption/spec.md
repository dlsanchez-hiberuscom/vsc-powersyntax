# Spec 142 — Cancelacion y preempcion real de tareas de fondo (B124)

## 1. Resumen

Permitir que el trabajo de fondo ceda, se cancele o sea desplazado cuando compite con consultas interactivas o cambios urgentes del contexto activo.

## 2. Problema

Los budgets y yielding ayudan, pero no bastan si una tarea de fondo sigue consumiendo recursos cuando deberia cancelarse o reprogramarse por una prioridad mas alta.

## 3. Objetivo

Definir un modelo de cancelacion y preempcion real para trabajo de fondo del runtime, con reanudacion segura y sin perdida de coherencia del pipeline.

## 4. Alcance

- Integrar cancellation tokens o contratos equivalentes en tareas largas de fondo.
- Permitir preempcion por consultas interactivas o contexto activo urgente.
- Reprogramar trabajo cancelado con aprovechamiento del progreso seguro ya hecho.
- Dejar trazabilidad basica de cancelaciones y reentradas.

## 5. Fuera de alcance

- Backpressure del watcher.
- Governor de latencia completo.
- Progress model definitivo.

## 6. Requisitos

- R1. El trabajo de fondo debe poder cancelarse o preemptarse cuando haya trabajo interactivo mas importante.
- R2. La cancelacion debe ser cooperativa y segura para el estado semantico.
- R3. La reanudacion no debe perder progreso valido ya consolidado.
- R4. El modelo debe reutilizar runtime/cancellation y scheduler en vez de introducir control paralelo.

## 7. Criterios de aceptacion

- AC1. Existe cancelacion cooperativa real en al menos un camino de fondo relevante.
- AC2. El scheduler puede preemptar trabajo de fondo por trabajo interactivo.
- AC3. Los tests cubren cancelacion, reanudacion y coherencia del estado.
- AC4. B124 queda documentada como dependencia directa de B159.

## 8. Riesgos y notas

- Cancelar en puntos inseguros puede dejar estado parcial.
- Reanudar sin contrato claro puede duplicar trabajo o saltarse pasos necesarios.