# Tasks - Spec 272 ORCA adapter architecture (B188)

## 1. Preparación

- [x] T1. Confirmar que el patrón correcto era reutilizar la integración out-of-process de tooling externo ya probada por PBAutoBuild.

## 2. Implementación

- [x] T2. Crear `src/shared/orcaProtocol.ts` con snapshot/resultados/cancelación ORCA.
- [x] T3. Implementar `src/server/build/orcaRunner.ts` y el wiring mínimo en `src/server/server.ts`.
- [x] T4. Registrar comandos cliente `runActiveOrcaScript/cancelOrcaScript`, configuración explícita y snapshot visible en dashboard/stats.

## 3. Validación

- [x] T5. Añadir unit del runner ORCA.
- [x] T6. Revalidar el dashboard con snapshot ORCA real.
- [x] T7. Añadir smoke del comando visible sobre un ejecutable de prueba.

## 4. Cierre

- [x] T8. Actualizar docs canónicas y mover el foco a `B189`.