# Tasks - Spec 320 semantic snapshot schema evolution and compatibility (B269)

## 1. Preparación

- [x] T1. Confirmar qué cubrían ya `semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts` y `supportBundle.test.ts`.
- [x] T2. Identificar el hueco local: import de snapshot demasiado estricto para payloads legados compatibles.

## 2. Implementación

- [x] T3. Añadir fixture legado de snapshot y test focal de migración segura.
- [x] T4. Migrar `semanticWorkspaceSnapshot.ts` para aceptar ausencia segura de `schemaVersion`/`summary`.
- [x] T5. Añadir fixtures versionadas para manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`.
- [x] T6. Extender `semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts` y `supportBundle.test.ts` con roundtrips y compatibilidad minor.
- [x] T7. Alinear docs canónicas y mover el foco a `B271`.

## 3. Validación

- [x] T8. Ejecutar `npm run build:test`.
- [x] T9. Ejecutar la batería `semanticWorkspaceSnapshot|publicApi|supportBundle`.

## 4. Cierre

- [x] T10. Sacar `B269` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B271` y dejar la trazabilidad en `specs/320-semantic-snapshot-schema-evolution-compatibility`.