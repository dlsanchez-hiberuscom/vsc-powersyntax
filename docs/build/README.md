# Build, Packaging y Release — Mapa documental

## 1. Propósito

Este documento es la entrada canónica del carril de build/release del repositorio. Su función es decir **qué superficie existe**, **dónde vive** y **qué comandos validan** build, packaging, VSIX, PBAutoBuild y ORCA.

Mientras este mapa siga cubriendo de forma suficiente el carril build/release, **no** se abre un documento especializado adicional para ORCA/PBAutoBuild. Si en el futuro hiciera falta separarlo, este README seguirá siendo la puerta de entrada y deberá enlazar de forma explícita al nuevo documento propietario.

No redefine arquitectura ni semántica PowerBuilder. Para esas decisiones mandan `docs/architecture.md`, `docs/architecture-status.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

---

## 2. Dónde vive cada cosa

### 2.1 Build y packaging del producto

- `package.json` concentra los scripts canónicos de compile, bundle, tests, packaging y release.
- `tools/esbuild.mjs` genera el runtime productivo en `dist/**`.
- `dist/client/extension.js` y `dist/server/server.js` son la surface runtime productiva del VSIX.
- `.dist/vsc-powersyntax.vsix` es el artefacto empaquetado esperado del carril release.

### 2.2 Validación del VSIX instalado

- `test/smoke/extension.test.ts` contiene la smoke real de activación del VSIX instalado.
- `test/server/unit/commandOwnership.test.ts` protege la frontera de ownership de comandos entre cliente y servidor.
- `tools/verify-vsix-contents.mjs` valida la surface empaquetada del VSIX.

### 2.3 PBAutoBuild

- `src/client/extension.ts` materializa las acciones cliente-side que disparan el carril PBAutoBuild.
- `src/client/commandRegistration.ts` publica los comandos cliente asociados.
- `src/server/handlers/buildCommandHandlers.ts` concentra la ejecución server-side/out-of-process del carril build/ORCA.
- `docs/developer-workflows.md` recoge el workflow operativo visible de build y troubleshooting.

### 2.4 ORCA

- `src/client/extension.ts` y `src/client/commandRegistration.ts` publican las acciones de export/import/regenerate/rebuild sobre staging.
- `src/server/handlers/buildCommandHandlers.ts` ejecuta ORCA fuera del hot path interactivo.
- `.vsc-powersyntax/orca-export/` contiene staging, scripts, estado, backups y ledgers del carril legacy controlado.
- `docs/developer-workflows.md` y `docs/architecture-status.md` describen el uso y los guardrails del rail ORCA existente.

---

## 3. Comandos canónicos

### 3.1 Build y tests base

- `npm run compile`
- `npm run bundle`
- `npm run build:test`
- `npm test`

### 3.2 Packaging y release del VSIX

- `npm run package:vsix`
- `npm run package:vsix:list`
- `npm run verify:vsix-contents`
- `npm run test:smoke:installed-vsix`
- `npm run release:verify`

### 3.3 Checks documentales y de soporte

- `npm run test:docs:drift`
- `npm run test:performance:gate`
- `npm run verify:catalog-coverage`

---

## 4. Guardrails operativos

- El runtime productivo del VSIX sale de `dist/**`, no de `out/**`.
- Ni PBAutoBuild ni ORCA deben ejecutarse en el hot path interactivo del Extension Host.
- El VSIX no debe depender de runtime suelto ni de `node_modules` empaquetado fuera de la surface declarada.
- La frontera cliente/servidor de comandos debe seguir protegida para evitar regresiones de arranque del runtime instalado.
- Cualquier cambio de scripts, comandos o carriles de build/release debe actualizar este mapa y la documentación canónica relacionada.

---

## 5. Documentos relacionados

- `README.md` — entrada pública general del repositorio.
- `docs/developer-workflows.md` — workflows operativos y troubleshooting.
- `docs/testing.md` — carriles de validación y estrategia de pruebas.
- `docs/architecture.md` — principios arquitectónicos e invariantes.
- `docs/architecture-status.md` — estado real y guardrails vigentes.
- `docs/backlog.md` — prioridad activa del trabajo actual.
- `docs/current-focus.md` — foco vivo y orden de ejecución.