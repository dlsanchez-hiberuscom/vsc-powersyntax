# Spec 284 - Public API v2 contract hardening (B241)

**Estado:** cerrada y validada.

## 1. Resumen

Endurecer la API publica exportada por la extension para que herramientas y extensiones consumidoras tengan un contrato versionado, inventariable y compatible sin depender de estructuras internas inestables.

## 2. Estado real actual

`B241` queda `Closed`: `src/shared/publicApi.ts` publica el descriptor contractual v2, helpers de compatibilidad, inventario estable de metodos/esquemas/tools y copias defensivas; `src/client/extension.ts` exporta la API endurecida que sostendra `B242`, `B243`, `B249` y parte del cierre de `B250`.

## 3. Objetivo

Dejar una base contractual estable antes de abrir bridges read-only y snapshots externos.

## 4. Alcance

- publicar un descriptor contractual v2 estable;
- endurecer versionado y compatibilidad major;
- fijar inventario defensivo de metodos, tools y schemas;
- evitar fugas de referencias mutables hacia consumidores externos.

## 5. Fuera de alcance

- puentes JSON-RPC o tooling read-only concretos (`B242`);
- snapshot export/import del workspace (`B243`);
- nuevos workflows write-enabled.

## 6. Criterios de aceptacion

- AC1. Existe un descriptor contractual v2 con inventario estable.
- AC2. La compatibilidad se decide por major version y valores invalidos degradan seguro.
- AC3. Los consumidores reciben copias defensivas y no referencias internas mutables.
- AC4. La API exportada queda lista para reutilizacion en `B242`, `B243`, `B249` y `B250`.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`

## 9. Cierre registrado

- `src/shared/publicApi.ts` centraliza el descriptor contractual v2 y su matriz de compatibilidad.
- `src/client/extension.ts` exporta la API endurecida al activation host.
- `test/server/unit/publicApi.test.ts` fija inventario, copias defensivas y compatibilidad estable.
