# Plan — Spec 378 Client command registration and lazy view activation

## Phase 1 — Separar el wiring del host cliente

- [x] Extraer el registro de comandos de `src/client/extension.ts` a un módulo dedicado por dominios.
- [x] Mantener command IDs, mensajes y handlers visibles sin abrir un segundo host cliente.

## Phase 2 — Quitar trabajo del cold start

- [x] Nombrar handlers inline del cliente que seguían mezclados con el registro de comandos.
- [x] Diferir la creación de `Object Explorer`, `Current Object Context` y `Diagnostics Explainability` hasta primer uso.
- [x] Evitar la materialización eager de la API pública exportada durante la activación inicial.

## Phase 3 — Validar y alinear el cierre

- [x] Revalidar compile y firewall de imports cliente/server.
- [x] Revalidar el presupuesto duro de activación con la smoke focal del repo.
- [x] Revalidar los comandos cliente principales con smokes directas en host real.
- [x] Alinear spec, backlog, current-focus, done-log, arquitectura, testing y performance budget con el cierre formal de B346.