# Spec 231 - Query trace action field (B157/B136)

## 1. Resumen

Anadir a cada `TraceStep` una `action` derivada del nombre del paso para evitar parseo externo del sufijo semántico.

## 2. Problema

Tras la `Spec 230`, la traza ya expone fase, pero sigue faltando una surface directa para la acción codificada tras `:` en nombres como `resolve:start` o `targets:global-fallback`.

## 3. Objetivo

Enriquecer `TraceStep` con una `action` derivada de forma pura y estable desde `name`.

## 4. Alcance

- modelar `action?: string` en `TraceStep`;
- derivarla al registrar pasos con patrón `fase:accion`;
- cubrir la derivación con tests unitarios focalizados.

## 5. Fuera de alcance

- taxonomía cerrada de acciones;
- cambios en los nombres de los pasos;
- exposición pública en API.

## 6. Requisitos

- R1. La acción debe derivarse sin romper pasos sin `:`.
- R2. Pasos sin sufijo deben conservar `action` indefinida.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceStep` expone `action`.
- AC2. `recordTraceStep()` deriva la acción a partir del sufijo de `name`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La derivación debe seguir siendo ligera y tolerante a nombres sin patrón compuesto.
- Documentacion a revisar: `docs/done-log.md`.