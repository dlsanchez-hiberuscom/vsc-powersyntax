# Plan - Spec 261 Unified build health model (B187)

## 1. Enfoque técnico

Mantener un snapshot puro y único en cliente para combinar capability detection, build files, runner y problemas recientes, de forma que tooltip, stats, health report y menú consuman exactamente la misma lectura del build moderno.

Estado final: completado con snapshot `ready/running/attention/blocked` y reutilización visible en las superficies de estado del cliente.

## 2. Pasos

1. Introducir el snapshot puro de build health.
2. Enriquecer `RuntimeStatusStats` con esa vista unificada.
3. Reutilizarla en tooltip, stats, health report y menú.
4. Añadir tests focalizados del modelo y de la proyección visible.

## 3. Riesgos

- duplicar heurísticas entre menú, status y health report;
- mezclar health del build con health general del runtime sin distinguir capas;
- perder problemas recientes al refrescar stats si no existe una única fuente de verdad cliente-side.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`