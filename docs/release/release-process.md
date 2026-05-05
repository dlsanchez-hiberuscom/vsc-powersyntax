# Release Process — PowerBuilder VS Code Plugin

## 1. Propósito

Definir el proceso para preparar, validar y publicar una release del plugin.

---

## 2. Carril mínimo

```bash
npm run build
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

---

## 3. Criterios de release

- VSIX generado desde runtime productivo correcto.
- `dist/client/extension.js` y `dist/server/server.js` incluidos.
- No depender de `out/` en VSIX productivo salvo fallback explícito de desarrollo.
- Smoke instalada verde.
- Sin `startFailed`.
- Sin comandos duplicados.
- Docs/changelog/backlog/current-focus alineados.

---

## 4. Troubleshooting

Si la extensión no activa:

1. revisar logs del Extension Host;
2. revisar `package.json` `main` y `activationEvents`;
3. revisar paths del servidor LSP;
4. revisar command ownership;
5. ejecutar smoke instalada;
6. revisar contenido VSIX.

---

## 5. Done de release

Una release está lista solo si `release:verify` está verde o si los skips están justificados y documentados.
