# Spec 263 - PBAutoBuild CI/CD helper export (B186)

**Estado:** cerrada y validada.

## 1. Resumen

Convertir el build moderno ya usable en VS Code en un helper exportable y versionable para CI/CD, sin acoplar la extension a un proveedor concreto ni reabrir el hot path interactivo.

## 2. Estado real actual

`B186` queda `Closed`: el cliente ya puede exportar un bundle neutral bajo `tools/pbautobuild-ci/<perfil>` con `manifest.json`, scripts PowerShell/CMD/Bash y metadatos del build file utilizable seleccionado o recordado.

## 3. Objetivo

Generar una ayuda reproducible para llevar el build moderno de PBAutoBuild a CI/CD reutilizando el perfil/build file ya validado localmente.

## 4. Alcance

- exportar un bundle versionable con scripts neutrales y `manifest.json`;
- reutilizar el ultimo perfil recordado o un build file utilizable del catalogo actual;
- describir el build file y el proyecto representado con rutas relativas al workspace;
- dejar la ejecucion real en manos del runner CI mediante `PB_AUTOBUILD_PATH`, sin acoplar el plugin a proveedor ni secreto concreto;
- registrar un comando visible en VS Code para exportar el helper.

## 5. Fuera de alcance

- generar YAML de GitHub Actions, Azure Pipelines, GitLab CI u otro proveedor especifico;
- gestionar secretos, credenciales o instalacion de PowerBuilder en el runner;
- reabrir runner, parser, health o UX frecuente ya cerrados en `B181-B187`;
- mezclar el helper moderno con ORCA o flujos legacy.

## 6. Criterios de aceptacion

- AC1. Existe un comando visible para exportar el helper CI/CD del build moderno.
- AC2. El helper exportado es versionable, usa rutas relativas al workspace y no embebe una dependencia obligatoria del path local detectado.
- AC3. El bundle reutiliza el build file/perfil utilizable ya cerrado en `B182-B185` y no crea otra fuente de verdad.
- AC4. El resultado sigue siendo agnostico del proveedor CI/CD.
- AC5. Tests cubren el builder puro del bundle y la smoke visible del comando.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildCiHelper.test.js`
- `npm run test:smoke -- --grep "PBAutoBuild"`

## 9. Cierre registrado

- `src/client/build/pbAutoBuildCiHelper.ts` introduce el builder puro del bundle CI/CD con `manifest.json`, README y scripts PowerShell/CMD/Bash;
- `src/client/extension.ts` y `package.json` anaden el comando `vscPowerSyntax.exportPbAutoBuildCiHelper`, reutilizan el perfil/build file ya recordado y escriben el bundle en `tools/pbautobuild-ci/<perfil>`;
- `test/server/unit/pbAutoBuildCiHelper.test.ts` fija el contenido reproducible del bundle y `test/smoke/extension.test.ts` cubre el registro visible del nuevo comando.