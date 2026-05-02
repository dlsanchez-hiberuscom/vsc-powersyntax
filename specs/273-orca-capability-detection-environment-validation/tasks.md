# Tasks - Spec 273 ORCA capability detection and environment validation (B189)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en cliente y que el runner ORCA base de `B188` no necesitaba reabrirse.

## 2. Implementación

- [x] T2. Ampliar `src/shared/publicApi.ts` con `ApiOrcaCapabilitySnapshot` y `orcaTooling`.
- [x] T3. Crear `src/client/build/orcaDetection.ts` con detector cacheado sobre config + `PB_ORCA_PATH`.
- [x] T4. Integrar el snapshot en `src/client/extension.ts`, reports de status y dashboard read-only.
- [x] T5. Ajustar `package.json` para documentar la configuración explícita sin autodetección difusa.

## 3. Validación

- [x] T6. Añadir `test/server/unit/orcaDetection.test.ts`.
- [x] T7. Revalidar tooltip/stats/dashboard con snapshot ORCA visible.
- [x] T8. Fijar la smoke ORCA para que compruebe `stats.orcaTooling`.

## 4. Cierre

- [x] T9. Actualizar docs canónicas y mover el foco a `B190`.