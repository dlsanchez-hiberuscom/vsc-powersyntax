# Spec 285 - JSON-RPC / local tool bridge read-only (B242)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir un bridge read-only y versionado para que herramientas externas consuman capacidades del plugin por nombre estable sin acoplarse a implementaciones internas ni introducir operaciones write-enabled en el hot path.

## 2. Estado real actual

`B242` queda `Closed`: `src/shared/publicApi.ts` declara el inventario de tools read-only y `src/client/extension.ts` implementa `invokeReadOnlyTool()` sobre la API versionada, devolviendo payloads tipados y degradacion segura para consumers locales o JSON-RPC.

## 3. Objetivo

Exponer un carril read-only reutilizable por tooling externo antes de abrir snapshots, paneles explicativos y planificacion segura.

## 4. Alcance

- inventariar tools read-only sobre el contrato publico;
- enrutar cada tool por nombre estable desde el extension host;
- mantener payloads tipados y sin efectos write-enabled;
- reutilizar surfaces ya existentes en lugar de duplicar logica semantica.

## 5. Fuera de alcance

- transporte remoto completo o autenticacion;
- operaciones write-enabled sobre codigo real;
- nuevas engines semanticas fuera de la API ya cerrada.

## 6. Criterios de aceptacion

- AC1. Existe un inventario estable de tools read-only en el descriptor publico.
- AC2. El bridge resuelve tools por nombre estable y devuelve schemas conocidos.
- AC3. La degradacion ante tool desconocida o input invalido es segura.
- AC4. El bridge reutiliza la API endurecida de `B241` sin duplicar semantica.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/developer-workflows.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`

## 9. Cierre registrado

- `src/shared/publicApi.ts` declara tools read-only y sus schemas contractuales.
- `src/client/extension.ts` implementa `invokeReadOnlyTool()` como bridge estable y seguro.
- el bridge queda listo para snapshots (`B243`) y planners read-only posteriores.
