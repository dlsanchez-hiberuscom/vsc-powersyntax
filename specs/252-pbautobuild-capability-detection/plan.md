# Plan - Spec 252 PBAutoBuild capability detection (B181)

## 1. Enfoque tecnico

Resolver `B181` desde cliente read-only. La detección depende de configuración, entorno y filesystem local, no del LSP ni del query engine semántico.

## 2. Pasos

1. Crear un detector puro para configuración, env y candidatos por defecto.
2. Exponer un snapshot mínimo `available/missing/invalid` con origen y ruta efectiva.
3. Integrar el snapshot en las surfaces read-only de status/health existentes.
4. Añadir tests unitarios focalizados.
5. Actualizar docs y mover `B181` a cierre si cumple AC.

## 3. Riesgos

- introducir chequeos de filesystem repetidos en hot path;
- mezclar capability detection con ejecución real de build;
- elegir un namespace de configuración incoherente con el repositorio.

## 4. Validacion

- unit tests del detector puro;
- unit tests de `statusBarPresentation` para visibilidad del estado build;
- `npm run test:unit` si el wiring del cliente lo hace recomendable.

## 5. Resultado ejecutado

1. Se introdujo un detector puro/cacheado en cliente para configuración, entorno y candidatos por defecto.
2. Se expuso un snapshot `available/missing/invalid` con origen, ruta efectiva y capabilities mínimas observables.
3. Se integró el snapshot en tooltip, health, stats y menú de status sin abrir runner moderno.
4. Se añadieron tests focalizados y se validó con compilación + mocha estrecho.