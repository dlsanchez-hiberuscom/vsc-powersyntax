# Spec 279 - PBL/source synchronization safety (B196)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el hueco de seguridad entre staging ORCA y source real sin bloquear el caso válido de edición deliberada sobre staging: el export persiste fingerprints del source real rastreado y el import compara esos fingerprints antes de tocar la PBL.

## 2. Estado real actual

`B196` queda `Closed`: `last-export.state` conserva fingerprints textuales del source real asociado a cada librería exportada y el preflight de `import` compara los objetos staged con ese estado para bloquear `stale staging` o conflicto de source real antes de ejecutar ORCA; el cambio no altera `regenerate/rebuild` ni el hot path.

## 3. Objetivo

Evitar que el import ORCA toque una PBL con source equivocado o desactualizado, dejando la base segura necesaria para `B197` y `B199`.

## 4. Alcance

- persistir fingerprints textuales del source real rastreado en `last-export.state` durante el export ORCA;
- comparar esos fingerprints durante el preflight del import solo para los objetos realmente staged;
- bloquear `stale staging` cuando el source real cambió desde el export y `source-conflict` cuando hay múltiples candidatos reales para el mismo objeto;
- mantener válido el caso en el que solo se edita staging y el source real no cambió;
- activar las reglas canónicas `PB-PBL-001` y `PB-PBL-002`;
- mover el foco canónico a `B197`.

## 5. Fuera de alcance

- event journal técnico de build/ORCA (`B197`);
- workflow spec-driven de actualización PBL (`B199`);
- orquestación bulk multi-PBL (`B200`);
- documentación/troubleshooting final del carril legacy (`B198`).

## 6. Criterios de aceptación

- AC1. El export ORCA deja fingerprints del source real rastreado en `last-export.state`.
- AC2. El import sigue funcionando si solo cambió staging y el source real no cambió desde el export.
- AC3. El import se bloquea con `PB-PBL-001` cuando el source real cambió desde el export.
- AC4. `PB-PBL-001` y `PB-PBL-002` quedan activas en el catálogo canónico.
- AC5. El foco canónico se mueve a `B197`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/rules-catalog.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/server/build/orcaStagingExport.ts` persiste fingerprints textuales del source real rastreado por librería en `last-export.state`;
- `src/server/build/orcaStagingImport.ts` amplía el preflight de import para bloquear `stale staging` y `source-conflict` sobre los objetos staged;
- `src/shared/orcaProtocol.ts` añade los nuevos códigos de preflight y mantiene el contrato ORCA compartido;
- `test/server/unit/orcaStagingImport.test.ts` cubre el caso permitido de edición sobre staging y el bloqueo cuando el source real cambió desde el export.