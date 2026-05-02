# Spec 252 - PBAutoBuild capability detection (B181)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir la primera pieza ejecutable del carril de build moderno detectando `PBAutoBuild250.exe`, su disponibilidad y capabilities básicas sin lanzar compilaciones ni bloquear el cliente/LSP.

## 2. Estado real actual

- `B043` existe como épica documental, pero el runtime actual no tiene todavía detector dedicado de PBAutoBuild.
- `src/client/statusBarPresentation.ts` y `vscPowerSyntax.showStatus*` ya pueden informar estado read-only del runtime, pero hoy no distinguen disponibilidad de tooling build moderno.
- `plugin_old` ya tenía un `resolveExecutablePath()` con configuración explícita, variable de entorno y candidatos por defecto; esa idea sirve como referencia, no como código a portar en bloque.

## 3. Objetivo

Detectar `PBAutoBuild250.exe`, su ruta efectiva, origen de detección y capacidades mínimas observables de forma read-only.

## 4. Alcance

- introducir un detector pequeño y testeable para ruta configurada, variable de entorno y candidatos por defecto;
- publicar estado `available/missing/invalid` sin lanzar build;
- proyectar ese estado en surfaces read-only del cliente ya existentes;
- mantener la detección fuera del hot path interactivo y sin mezclarla con ORCA.

## 5. Fuera de alcance

- ejecutar builds o descubrir JSON de PBAutoBuild;
- parsear salida/logs de compilación;
- health completo de build o Problems Panel;
- automatización ORCA/PBL.

## 6. Criterios de aceptacion

- AC1. Existe un detector reutilizable y testeable para `PBAutoBuild250.exe`.
- AC2. El plugin informa disponibilidad/ausencia y origen de detección sin lanzar build.
- AC3. La ruta cliente/LSP no se bloquea ni se contamina con lógica de ejecución de build.
- AC4. Docs canónicas distinguen capability detection de discovery/runner/log parser.

## 7. Documentacion afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `README.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/pbAutoBuildDetection.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:unit` si el wiring visible del cliente cambia más allá del reporte/status.

## 9. Resultado de cierre

- `src/client/build/pbAutoBuildDetection.ts` resuelve `PBAutoBuild250.exe` por configuración, entorno y candidatos por defecto con snapshot `available/missing/invalid` y cache TTL;
- `src/client/extension.ts` y `src/client/statusBarPresentation.ts` publican disponibilidad/origen en status/health sin lanzar build ni tocar el LSP;
- `package.json` añade `vscPowerSyntax.build.pbAutoBuildPath` como setting coherente con el namespace actual del producto;
- la validación ejecutada fue `npm run build:test` más `npx mocha --ui tdd out/test/server/unit/pbAutoBuildDetection.test.js out/test/server/unit/statusBarPresentation.test.js`.