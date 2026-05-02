# Spec 261 - Unified build health model (B187)

## 1. Resumen

Unificar la salud del build moderno en un snapshot único y reutilizable que combine detección del ejecutable, disponibilidad de build files, estado del runner y problemas recientes sin recalcular reglas distintas en cada superficie del cliente.

## 2. Estado real actual

`B187` queda `Closed`: el cliente ya construye un snapshot único de build health a partir de capability detection, build files, runner y problemas recientes, y status/menu/health consumen esa misma lectura del carril moderno.

## 3. Objetivo

Exponer un modelo compacto de salud del build moderno para que status bar, reportes y menús usen la misma lectura de `ready/running/attention/blocked`.

## 4. Alcance

- introducir un snapshot puro de health del build moderno;
- combinar ejecutable, build files, runner y problemas recientes;
- reutilizar ese snapshot en tooltip, stats, health report y menú;
- añadir tests focalizados del modelo y de su proyección visible.

## 5. Fuera de alcance

- nuevos perfiles o flujos UX de ejecución (`B185`);
- persistencia histórica de builds entre reinicios;
- volver a parsear logs o reabrir el Problems Panel ya cerrado en `B184`.

## 6. Criterios de aceptación

- AC1. Existe un snapshot único que resume `ready/running/attention/blocked` para el build moderno.
- AC2. El snapshot combina detección del ejecutable, build files, runner y problemas recientes.
- AC3. Tooltip, stats, health report y menú consumen ese snapshot en vez de recomputar heurísticas locales distintas.
- AC4. Tests cubren los estados principales y la proyección visible del snapshot.

## 7. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/statusBarPresentation.test.js`

## 8. Cierre registrado

- `src/client/build/pbAutoBuildHealth.ts` introduce el snapshot puro `ready/running/attention/blocked` del build moderno;
- `src/client/statusBarPresentation.ts` y `src/client/extension.ts` reutilizan ese snapshot en tooltip, stats, health report, menú y API pública del cliente;
- `test/server/unit/pbAutoBuildHealth.test.ts` y `statusBarPresentation.test.ts` fijan estados y proyección visible, mientras la smoke corta del carril moderno confirma que la integración no rompe activación ni comandos.