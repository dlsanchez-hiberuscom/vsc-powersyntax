# Spec 302 - build profile matrix and environment validation (B257)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B257` con una matriz read-only de build profiles y validación de entorno para PBAutoBuild que combine inventory completo, capability detection, último profile recordado y build health sin disparar builds.

## 2. Estado real actual

El repositorio ya tenía capability detection de PBAutoBuild, build health, inventory usable para ejecución y un último build file recordado, pero faltaba una surface visible y estable que unificara esos datos como matriz de perfiles defendible.

## 3. Objetivo

Servir un reporte read-only de perfiles de build y validación de entorno por API pública, tool bridge y comando Markdown, reutilizando inventory completo del servidor y detección cliente-side del tooling sin abrir otro rail de ejecución.

## 4. Alcance

- implementar `pbAutoBuildProfileMatrix` client-side como builder puro sobre inventory completo, tooling, health y último profile recordado;
- exponer la surface por API pública v2.9.0, tool bridge y comando Markdown;
- añadir un inventario read-only completo de build files desde servidor para distinguir `usable`, `ambiguous` e `invalid`;
- hacer visible la matriz desde el status report además del comando;
- alinear tests, documentación viva y mover el foco canónico a `B258`.

## 5. Fuera de alcance

- ejecutar builds como parte de la matriz;
- reescribir build files JSON o persistir automáticamente otro profile por el usuario;
- duplicar la lógica de build runner o de parseo de logs.

## 6. Criterios de aceptación

- AC1. la matriz distingue perfiles `usable`, `ambiguous` e `invalid` con `canRun` explícito según tooling real.
- AC2. el último profile recordado y el tooling ausente/inválido se reflejan como findings defendibles.
- AC3. la feature se sirve por API pública, tool bridge y comando Markdown con contrato estable.
- AC4. la validación cubre unit focal del builder, contrato público y smoke de activación.
- AC5. backlog, roadmap y current-focus dejan de tratar `B257` como deuda activa y pasan a `B258`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/publicApi.test.js --grep "(B257|pbAutoBuildProfileMatrix|build-profile-matrix|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- la matriz de perfiles queda visible y exportable sin lanzar builds;
- el inventario completo de build files y el estado del tooling pasan a una surface pública estable y reutilizable;
- el siguiente foco canónico del repo pasa a `B258`.