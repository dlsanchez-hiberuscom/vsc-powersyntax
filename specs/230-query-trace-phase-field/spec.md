# Spec 230 - Query trace phase field (B157/B136)

## 1. Resumen

Anadir a cada `TraceStep` una `phase` derivada del nombre del paso para facilitar inspección y agregación ligera.

## 2. Problema

`queryTrace` conserva nombres completos de paso, pero no proyecta todavía la fase principal de cada evento aunque el runtime ya la codifica en prefijos como `resolve:`, `qualifier:` o `targets:`.

## 3. Objetivo

Enriquecer `TraceStep` con una `phase` derivada de forma pura y estable desde `name`.

## 4. Alcance

- modelar `phase?: string` en `TraceStep`;
- derivarla al registrar pasos con prefijo `fase:detalle`;
- cubrir la derivación con tests unitarios focalizados.

## 5. Fuera de alcance

- normalización cerrada de taxonomías;
- cambios en los nombres actuales de pasos;
- exposición pública en API.

## 6. Requisitos

- R1. La fase debe derivarse sin romper pasos sin prefijo.
- R2. Pasos sin `:` deben conservar `phase` indefinida.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceStep` expone `phase`.
- AC2. `recordTraceStep()` deriva la fase a partir del prefijo de `name`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La derivación debe ser estable pero ligera, sin imponer un enum prematuro.
- Documentacion a revisar: `docs/done-log.md`.