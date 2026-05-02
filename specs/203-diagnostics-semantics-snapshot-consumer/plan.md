# Plan - Spec 203 Diagnostics semantics snapshot consumer

## 1. Estado

Slice historica de cierre usada para reducir lectura directa de `DocumentAnalysis` en diagnostics semanticos.

## 2. Estrategia

- consumir datos ya publicados por snapshot;
- mantener comportamiento visible de reglas existentes;
- validar con suite focalizada de diagnostics.

## 3. Documentacion

Registrar el cierre dentro del bloque historico correspondiente en `docs/done-log.md`.
