# Spec 413 — B314 Build/ORCA failure classification v2

## Estado

- done

## Relación backlog

- Backlog item: `B314 — Build/ORCA failure classification v2`

## Objetivo

Clasificar fallos comunes de build moderno y ORCA legacy para troubleshooting y support bundle reutilizando el estado ya publicado del runtime, el parser de problemas de PBAutoBuild y el journal técnico persistido.

## Resultado de cierre

- `src/client/build/buildOrcaFailureClassification.ts` clasifica `missing-tool`, `invalid-env`, `compile-errors`, `stale-staging`, `source-conflict` y `packaging-disabled` sin abrir un segundo checker ni una API nueva;
- `src/client/support/supportBundle.ts` incorpora `failureClassification` en `build-orca-snapshot.json` y `src/client/extension.ts` lee `.vsc-powersyntax/runtime/build-orca-journal.json` de forma read-only para enriquecer el bundle exportado;
- el detalle ORCA del bundle queda path-safe y reutiliza `buildHealth`, `buildProblems`, `orcaTooling`, `orcaRunner` y el `build-orca-journal` persistido para distinguir troubleshooting de tooling, compile y staging.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/(buildOrcaFailureClassification|supportBundle|pbAutoBuildProblems|orcaStagingImport)"`

## Fuera de alcance del corte cerrado

- abrir una API pública nueva sólo para estos reason codes;
- convertir `failureClassification` en un sistema de telemetría o envío automático fuera de la máquina local;
- releer logs crudos del workspace o abrir un segundo parser de build/ORCA para el support bundle.