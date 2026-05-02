# Plan - Spec 209 Unified project model runtime routing

## 1. Estado

Slice historica para consumir `UnifiedProjectModel` desde runtime routing.

## 2. Estrategia

- reemplazar routing legacy por modelo unificado donde sea seguro;
- mantener fallback seguro solo mientras sea necesario;
- validar estado activo y project context.

## 3. Documentacion

Registrar como parte del cierre gradual de `B141/B141A`.
