# Tasks - Spec 321 telemetry-free observability contract (B271)

## 1. Preparación

- [x] T1. Confirmar qué surfaces de observabilidad ya exponían `publicApi`, `serverStats` y support bundle.
- [x] T2. Identificar el hueco local: falta de descriptor versionado y explícitamente local dentro del contrato público.

## 2. Implementación

- [x] T3. Añadir un test contractual mínimo en `publicApi.test.ts` para exigir observabilidad local versionada.
- [x] T4. Introducir `ApiObservabilityContractDescriptor` en `src/shared/publicApi.ts`.
- [x] T5. Declarar dominios, surfaces, privacidad y export offline explícito para support bundle.
- [x] T6. Alinear el test manual de `supportBundle.test.ts` con el contrato público ampliado.
- [x] T7. Actualizar docs canónicas y mover el foco a `B272`.

## 3. Validación

- [x] T8. Ejecutar `npm run build:test`.
- [x] T9. Ejecutar la batería `publicApi|supportBundle`.

## 4. Cierre

- [x] T10. Sacar `B271` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B272` y dejar la trazabilidad en `specs/321-telemetry-free-observability-contract`.