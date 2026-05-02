# Spec 267 - Diagnostic ID contract (B232)

**Estado:** cerrada y validada.

## 1. Resumen

Fijar una política estable para los IDs diagnósticos emitidos hoy sin forzar una migración riesgosa a `PB-*`: el contrato visible pasa a ser `diagnostic.code`, con compatibilidad legacy sobre `source` donde ya existían consumers puntuales.

## 2. Estado real actual

`B232` queda `Closed`: las reglas implementadas emiten `diagnostic.code` estable, los consumers focales (`PB_SEVERITY_OVERRIDES`, quick-fix SD7, tests/snapshots) consumen ese contrato y `docs/rules-catalog.md` deja explícito que `PB-*` sigue siendo taxonomía documental, no ID runtime emitido.

## 3. Objetivo

Eliminar la ambigüedad entre catálogo documental y contrato visible del runtime sin romper consumers existentes ni disparar un renombrado masivo de diagnósticos.

## 4. Alcance

- introducir una lista compartida de IDs diagnósticos emitidos actualmente;
- emitir `diagnostic.code` estable en los diagnósticos implementados hoy;
- adaptar consumers focales a `diagnostic.code` con fallback legacy sobre `source`;
- documentar la política resultante en catálogo, testing, roadmap y done-log.

## 5. Fuera de alcance

- renombrar en caliente todas las reglas a `PB-*`;
- rediseñar `Problems` o el snapshot diagnóstico más allá del contrato de IDs;
- abrir reglas nuevas no implementadas aún solo para rellenar el catálogo;
- cambiar severidades o heurísticas semánticas de las reglas existentes.

## 6. Criterios de aceptación

- AC1. Las reglas implementadas relevantes exponen `diagnostic.code` estable.
- AC2. Los consumers focales dejan de depender del parseo directo de `source` como contrato primario.
- AC3. `docs/rules-catalog.md` refleja correctamente el contrato emitido actual y la relación con `PB-*`.
- AC4. La validación focal cubre diagnósticos, extra diagnostics, obsoletas y quick-fixes.
- AC5. El foco canónico se mueve a `B233`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/rules-catalog.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/obsolete.test.js out/test/server/unit/obsoleteDetectorSanity.test.js`

## 9. Cierre registrado

- `src/shared/diagnosticCodes.ts` centraliza los IDs emitidos hoy y los helpers de lectura/escritura del contrato;
- `src/server/features/diagnostics.ts`, `diagnosticsExtra.ts`, `obsoleteDetector.ts` y `codeActions.ts` adoptan `diagnostic.code` sin perder compatibilidad puntual sobre `source`;
- las docs canónicas dejan explícito que `PB-*` sigue siendo taxonomía objetivo, no contrato runtime actual.