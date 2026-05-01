# Spec 141 — Presupuestos de trabajo y yielding cooperativo (B123)

## 1. Resumen

Introducir budgets de trabajo y yielding cooperativo para que ningun batch largo monopolice CPU durante indexacion o analisis.

## 2. Problema

El proyecto ya dispone de scheduler y piezas de fairness, pero sigue faltando una politica transversal que limite cuanto trabajo continuo puede hacer una tarea larga antes de ceder.

## 3. Objetivo

Definir budgets temporales o de unidades de trabajo y hacer que las tareas largas cedan explicitamente al event loop o al scheduler sin perder contexto util.

## 4. Alcance

- Definir budgets reutilizables por indexador y procesos largos.
- Introducir puntos de yield cooperativo en trabajo de fondo.
- Preparar telemetria o contadores minimos para observar yields.
- Reutilizar esta base para B124 y B159.

## 5. Fuera de alcance

- Cancelacion y preempcion completas.
- Governor de latencia final.
- Progress model definitivo.

## 6. Requisitos

- R1. Ningun batch largo del servidor debe monopolizar CPU por encima del budget definido.
- R2. La cesion debe preservar contexto suficiente para reanudar sin perder trabajo util.
- R3. La politica debe poder aplicarse al indexador y a otros procesos largos del runtime.
- R4. Debe mantenerse fuera del Extension Host y limitarse al runtime del servidor.

## 7. Criterios de aceptacion

- AC1. Existen budgets reutilizables y yielding cooperativo en al menos un camino largo real.
- AC2. El runtime puede observar cuando una tarea cede por budget agotado.
- AC3. Los tests cubren yielding y reanudacion de trabajo.
- AC4. B123 queda trazada como base de B124 y B159.

## 8. Riesgos y notas

- Un budget demasiado pequeno introducira overhead innecesario.
- Un budget demasiado grande no resolvera monopolizacion real.