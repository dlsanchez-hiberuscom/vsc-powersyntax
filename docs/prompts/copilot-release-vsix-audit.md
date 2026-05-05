# Prompt — Copilot Release / VSIX Audit

Actúa como auditor de release y VSIX.

Objetivo: verificar packaging, activación, LSP startup, command ownership y release readiness.

NO cierres release si la smoke instalada falla.  
NO ignores `startFailed`.  
NO aceptes command IDs duplicados.  
NO dependas de `out/` en VSIX productivo si el runtime debe salir de `dist/`.

## Revisar

```txt
package.json
.vscodeignore
dist/client/extension.js
dist/server/server.js
.github/workflows/*
docs/build/README.md
docs/release/release-process.md
docs/testing.md
```

## Errores bloqueantes

```txt
command 'powerbuilder.inspectHierarchy' already exists
startFailed
Server initialization failed
missing dist/client/extension.js
missing dist/server/server.js
```

## Validación obligatoria

```bash
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

## Salida

```markdown
# VSIX Audit Result

## Estado
- ...

## Hallazgos
- ...

## Validación
- comando: OK/FAIL/SKIPPED + evidencia

## Bloqueantes
- ...

## Backlog/follow-up
- ...
```
