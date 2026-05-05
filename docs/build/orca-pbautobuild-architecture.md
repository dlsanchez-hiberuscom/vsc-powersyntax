# ORCA & PBAutoBuild Architecture

## 1. Propósito

Definir la arquitectura operativa de los carriles build modernos y legacy sin duplicar el proceso de release.

---

## 2. Carriles

| Carril | Estado | Regla principal |
| --- | --- | --- |
| VSIX moderno | productivo | empaquetar desde `dist/`, nunca desde `out/` |
| PBAutoBuild | moderno y condicional | compilar source real con discovery y health read-only previos |
| ORCA legacy | legado y controlado | siempre out-of-process y subordinado al source real |

---

## 3. Invariantes

- `orca-staging` es indexable pero no canónico.
- ORCA no entra en hot path interactivo.
- PBAutoBuild y ORCA no deben abrir rails paralelos de semantica.
- El VSIX debe publicar entrypoints reales en `dist/client/extension.js` y `dist/server/server.js`.
- La smoke instalada es la evidencia minima del paquete publicado.

---

## 4. Validación mínima

```bash
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

---

## 5. Documentos relacionados

- `docs/build/README.md`
- `docs/release/release-process.md`
- `docs/release/ci-cd-architecture.md`# ORCA & PBAutoBuild Architecture

## Principio

ORCA y PBAutoBuild están fuera del hot path y se ejecutan out-of-process.

## Reglas

- ORCA staging no es source canónico.
- No generar EXE/PBD/DLL sin feature flag.
