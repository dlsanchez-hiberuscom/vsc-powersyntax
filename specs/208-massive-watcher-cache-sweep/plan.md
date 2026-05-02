# Plan - Spec 208 Massive watcher cache sweep

## 1. Estado

Slice historica para manejar rafagas masivas de watcher sin tormenta de invalidaciones finas.

## 2. Estrategia

- detectar umbral masivo;
- limpiar caches compartidas de forma global;
- mantener degradacion segura.

## 3. Documentacion

Trazar como hardening de rendimiento del watcher.
