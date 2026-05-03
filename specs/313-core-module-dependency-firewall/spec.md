# Spec 313 - core module dependency firewall (B277)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B277` fijando un firewall automático de imports entre capas para que `client`, `shared`, `runtime`, `features`, `knowledge/parsing/utils` y `build/ORCA` no vuelvan a contaminarse por dependencias indebidas.

## 2. Estado real actual

El repo ya dispone de un `test/server/unit/architectureImports.test.ts` ampliado que resuelve imports reales por archivo y protege cinco bordes: `knowledge/parsing/utils` frente a `vscode`/`vscode-languageserver`, `client` frente a `server`, `runtime/features` frente a `client`, `shared` frente a `client/server` y `build` frente al hot path semántico interactivo.

## 3. Objetivo

Formalizar con un test ejecutable la allowlist mínima entre capas, de modo que la arquitectura no dependa de disciplina manual ni de documentación no ejecutable.

## 4. Alcance

- ampliar `architectureImports.test.ts` desde el guard puntual de `B228` a un firewall por capas;
- resolver imports relativos reales para evitar falsos positivos por rutas;
- proteger `build/ORCA` frente al hot path semántico interactivo sin bloquear el reuso legítimo del rail read-only/write-enabled ya cerrado;
- alinear docs canónicas y mover el foco a `B273`.

## 5. Fuera de alcance

- introducir una herramienta externa de dependency graph o lint dedicada;
- reestructurar módulos del producto sin una violación real del firewall;
- abrir reglas nuevas no defendibles todavía para capas que el repo no materializa como directorios separados.

## 6. Criterios de aceptación

- AC1. existe un test automático de imports con reglas explícitas por capa.
- AC2. `client` no importa `server`, `runtime/features` no importan `client` y `shared` no importa `client/server`.
- AC3. `knowledge/parsing/utils` no importan `vscode`/`vscode-languageserver`.
- AC4. `build/ORCA` no toca `documentAnalysis`, `semanticQueryService`, parsing ni features interactivas del hot path.
- AC5. la validación queda verde y las docs canónicas reflejan el cierre y el nuevo foco del repo.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`

## 9. Cierre registrado

- el firewall de imports ya queda automatizado dentro del repo y deja de depender de convención oral;
- `B277` se convierte en guardrail previo para seguir cerrando surfaces visibles sin contaminar capas;
- el siguiente foco canónico del repo pasa a `B273`.