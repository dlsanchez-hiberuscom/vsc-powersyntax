# Plan - Spec 320 semantic snapshot schema evolution and compatibility (B269)

## 1. Enfoque técnico

Partir del borde más falsable: el import de snapshot exigía la forma actual completa y rechazaba payloads legados compatibles que solo carecían de campos materializados. La estrategia fue corregir primero ese importador y después congelar el resto del carril exportable con fixtures versionadas y roundtrips explícitos, sin abrir nuevas surfaces.

## 2. Pasos

1. Añadir un fixture legado de snapshot y demostrar el hueco en el import.
2. Migrar snapshots compatibles sin `schemaVersion` o `summary`.
3. Añadir fixtures/versiones y tests de roundtrip para manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`.
4. Revalidar la batería focal y alinear docs canónicas para mover el foco a `B271`.

## 3. Riesgos

- aceptar como compatibles payloads ambiguos o incompletos de forma silenciosa;
- fijar solo snapshots y dejar sin congelar el resto de payloads exportables del carril read-only;
- cerrar `B269` sin dejar trazabilidad canónica ni mover el foco real del backlog.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 5. Resultado ejecutado

1. `semanticWorkspaceSnapshot.ts` migra payloads legados compatibles y conserva rechazo explícito para versiones no soportadas.
2. `test/fixtures/compatibility/*.json` y las suites focales congelan compatibilidad y roundtrip sobre el carril exportable.
3. backlog/current-focus/roadmap/done-log ya dejan `B269` cerrada y mueven el foco a `B271`.