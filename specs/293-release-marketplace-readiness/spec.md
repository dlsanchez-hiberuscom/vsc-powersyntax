# Spec 293 - Product release hardening and marketplace readiness (B250)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar un carril de release repetible para la extension, con empaquetado real, metadata minima coherente, changelog, workflow de readiness y evidencia suficiente para revisar una publicacion de marketplace sin improvisacion de ultima hora.

## 2. Estado real actual

`B250` queda `Closed`: `package.json` incorpora scripts de empaquetado y verificacion de release, `CHANGELOG.md` fija historial base de producto, `.github/workflows/release-readiness.yml` ejecuta el carril completo y `README.md` documenta el flujo de empaquetado/marketplace; el VSIX se genera en `./.dist/vsc-powersyntax.vsix`.

## 3. Objetivo

Dejar el producto validable y empaquetable de forma repetible al cerrar el bloque `B241-B250`.

## 4. Alcance

- empaquetar un VSIX real con contenido controlado;
- declarar scripts de release y empaquetado inspeccionable;
- publicar changelog y workflow de readiness del release lane;
- alinear metadata publica minima y documentacion de empaquetado.

## 5. Fuera de alcance

- publicacion automatica al marketplace;
- bundling del extension package;
- politicas comerciales, pricing o publisher governance externa.

## 6. Criterios de aceptacion

- AC1. Existe un script reproducible para generar el VSIX.
- AC2. El release lane ejecuta test base, gate de rendimiento y empaquetado real.
- AC3. El VSIX no arrastra artefactos de test ni outputs innecesarios fuera del runtime real.
- AC4. README, changelog y workflow de release quedan alineados con el carril real.

## 7. Documentacion afectada

- `README.md`
- `CHANGELOG.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run package:vsix`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`
- `npm run release:verify`

## 9. Cierre registrado

- `package.json` publica `package:vsix`, `package:vsix:list` y `release:verify`.
- `CHANGELOG.md` fija el historial inicial del producto.
- `.github/workflows/release-readiness.yml` deja el carril de release ejecutable en CI.
- el VSIX queda generado y verificable en `./.dist/vsc-powersyntax.vsix`.
