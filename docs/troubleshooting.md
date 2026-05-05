# Troubleshooting — PowerBuilder VS Code Plugin

## 1. Propósito

Guía rápida para diagnosticar problemas comunes del plugin, VSIX, LSP, indexing, DataWindow, catálogo, build y documentación.

---

## 2. La extensión no activa

Revisar:

```txt
1. Extension Host logs.
2. package.json main y activationEvents.
3. dist/client/extension.js.
4. dist/server/server.js.
5. rutas relativas dentro del VSIX.
6. comandos duplicados.
7. estado del LanguageClient.
```

Validar:

```bash
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
```

Errores conocidos a bloquear:

```txt
command 'powerbuilder.inspectHierarchy' already exists
startFailed
Server initialization failed
```

---

## 3. No indexa

Revisar:

- estado del LSP;
- discovery logs;
- readiness;
- workspace roots;
- markers `.pbw`, `.pbt`, `.pbproj`, `.pbsln`;
- exclusiones;
- errores de watcher.

---

## 4. Hover/completion/definition lentos

Revisar:

- hot path scans;
- full catalog clone;
- serving cache;
- query caps;
- latency governor;
- performance budget.

Validar:

```bash
npm run test:performance:gate
```

---

## 5. DataWindow no resuelve

Revisar:

- si `.srd` está indexado;
- si `DataObject` es literal;
- si hay binding dinámico;
- si el caso debe degradar;
- si se está intentando parsear `.srd` como PowerScript.

Documento propietario:

```txt
docs/datawindow/datawindow-architecture.md
```

---

## 6. Build/PBAutoBuild/ORCA falla

Revisar:

- `docs/build/README.md`;
- `docs/build/orca-pbautobuild-architecture.md`;
- tool paths;
- build JSON;
- ORCA session DLL;
- staging;
- ledgers;
- build-orca journal.

---

## 7. Docs drift falla

Revisar:

- `docs/backlog.md`;
- `docs/current-focus.md`;
- `docs/roadmap.md`;
- `docs/done-log.md`;
- referencias a documentos inexistentes;
- IDs de specs activos.

Validar:

```bash
npm run test:docs:drift
```
