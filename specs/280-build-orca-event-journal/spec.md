# Spec 280 - Build and ORCA event journal (B197)

**Estado:** cerrada y validada.

## 1. Resumen

Persistir la traza técnica de `build|legacy` reutilizando el `RuntimeJournal` ya existente, de modo que fallos de PBAutoBuild y ORCA sigan siendo diagnosticables después de la ejecución y sin abrir un sistema de logging paralelo.

## 2. Estado real actual

`B197` queda `Closed`: el servidor proyecta eventos `build|legacy` del `RuntimeJournal` a `.vsc-powersyntax/runtime/build-orca-journal.json`, restaura ese snapshot persistido por workspace y expone su URI por `showStats.persistence.buildOrcaJournalUri`; además, PBAutoBuild y export ORCA dejan contexto técnico suficiente para reconstrucción posterior sin depender solo del output crudo.

## 3. Objetivo

Dejar build e import/export ORCA suficientemente trazables antes de abrir `B199`.

## 4. Alcance

- reutilizar `RuntimeJournal` como única fuente de eventos, añadiendo solo un observer persistente;
- persistir exclusivamente `phase: build|legacy` en un archivo workspace-scoped bajo `.vsc-powersyntax/runtime/`;
- restaurar y mantener ring buffer persistente de ese journal;
- enriquecer los eventos de build/ORCA con contexto útil para diagnóstico posterior;
- exponer la URI persistente del journal en `showStats`;
- mover el foco canónico a `B199`.

## 5. Fuera de alcance

- workflow spec-driven de edición/import PBL (`B199`);
- orquestación bulk multi-PBL (`B200`);
- troubleshooting/documentación final del carril legacy (`B198`);
- cambios en el hot path semántico moderno.

## 6. Criterios de aceptación

- AC1. Existe un journal persistente `build-orca-journal.json` por workspace para `build|legacy`.
- AC2. El journal persistente se restaura y mantiene ring buffer al registrar nuevos eventos.
- AC3. `showStats` expone la URI del journal persistente sin romper el snapshot exportable del runtime journal en memoria.
- AC4. Los runners/build/export ORCA siguen verdes y conservan compatibilidad con el journal nuevo.
- AC5. El foco canónico se mueve a `B199`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeJournal.test.js out/test/server/unit/buildOrcaJournalStore.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/server/runtime/runtimeJournal.ts` añade observers y `src/server/runtime/buildOrcaJournalStore.ts` persiste/restaura el slice `build|legacy` del journal;
- `src/server/server.ts` conecta ese store al runtime, publica `showStats.persistence.buildOrcaJournalUri` y enriquece eventos build/ORCA con más contexto técnico;
- `src/shared/publicApi.ts` amplía la surface pública de stats con la nueva URI persistente;
- `test/server/unit/buildOrcaJournalStore.test.ts` fija persistencia, restore y ring buffer sobre el mismo journal compartido.