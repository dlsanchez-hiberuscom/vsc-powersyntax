# Spec 036 — Funciones obsoletas (B074)

## 1. Motivación

Avisar al usuario sobre funciones del runtime PB declaradas obsoletas
o desaconsejadas, sugiriendo reemplazo cuando exista.

## 2. Alcance

- `src/server/knowledge/obsoleteCatalog.ts`:
  - Tabla pequeña inicial: `{ name: string, replacement?: string }[]`.
  - Casos canónicos (semilla): `Yield`, `Halt`, `MessageBox` (no obsoleta — se omite), `RunFork`.
  - Comenzamos con set vacío configurable + 2 ejemplos para test.
- Diagnóstico SD7 en `diagnostics.ts`:
  - Para cada llamada `name(`, si `name.toLowerCase() ∈ obsoleteSet`, emite Warning con sugerencia.
  - Aplica `maskDocument` para no escanear strings/comentarios.

## 3. Criterios de aceptación

1. `Yield()` en script genera SD7 con sugerencia de reemplazo.
2. `Yield` dentro de comentario no genera diagnóstico.
3. Tests cubren ambos.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B074).
