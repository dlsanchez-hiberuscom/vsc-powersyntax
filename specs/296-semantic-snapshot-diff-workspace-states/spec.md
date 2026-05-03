# Spec 296 - semantic snapshot diff workspace states (B251)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B251` como diff read-only entre dos snapshots semánticos ya exportados del workspace, reutilizando el contrato público versionado y evitando un segundo motor semántico o dependencia del estado vivo del editor.

## 2. Estado real actual

La API pública v2 expone `diffSemanticWorkspaceSnapshots()` y el tool read-only `semantic-snapshot-diff`. El cálculo vive en cliente sobre snapshots serializados y resume cambios en proyectos, objetos, símbolos exportados, readiness, health, diagnósticos y `sourceOrigin`.

## 3. Objetivo

Dar una comparación defendible entre dos estados del workspace para troubleshooting, reproducibilidad, automatización y soporte sin reabrir indexación ni consultas al servidor.

## 4. Alcance

- ampliar la API pública con un schema estable para diffs de snapshots;
- calcular el diff cliente-side sobre snapshots exportados/importables;
- publicar el diff también en el bridge read-only para agentes y tooling;
- cubrirlo con tests unitarios y smoke sobre snapshots reales;
- alinear documentación viva y mover el foco canónico a `B252`.

## 5. Fuera de alcance

- recalcular semántica al comparar snapshots ya serializados;
- abrir un servicio nuevo en el servidor para comparar estados vivos;
- introducir surfaces write-enabled nuevas a partir del diff.

## 6. Criterios de aceptación

- AC1. la API pública expone `diffSemanticWorkspaceSnapshots()` y el schema `ApiSemanticWorkspaceSnapshotDiff`.
- AC2. el bridge read-only publica `semantic-snapshot-diff` con el mismo contrato.
- AC3. el diff resume cambios de proyectos, objetos, símbolos, readiness, health, diagnósticos y `sourceOrigin`.
- AC4. los tests unitarios y smoke validan contrato y comportamiento sobre snapshots exportados reales.
- AC5. backlog, roadmap y current-focus dejan de tratar `B251` como deuda activa y pasan a `B252`.

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
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- el producto puede comparar dos snapshots exportados sin tocar el servidor ni depender del estado vivo del editor;
- agentes y tooling disponen del mismo diff por API pública y bridge read-only;
- el siguiente foco canónico pasa a `B252`.
