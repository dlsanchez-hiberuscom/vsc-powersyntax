# Spec 265 - Guards LSP para markers y PBL binario (B231)

**Estado:** cerrada y validada.

## 1. Resumen

Blindar el borde LSP para que markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios sigan participando en discovery/topologia, pero no entren en providers semanticos PowerScript aunque el lenguaje del editor se fuerce por error o por cambios futuros del selector.

## 2. Estado real actual

`B231` queda `Closed`: el runtime ya dispone de un guard server-side basado en `isPowerBuilderSemanticUri()`, y la smoke real fuerza un lenguaje servido sobre markers y `.pbl` para comprobar que no aparecen `Document Symbols` ni diagnostics semanticos, mientras una `.sru` real sigue respondiendo.

## 3. Objetivo

Evitar regresiones en la frontera cliente/servidor donde artefactos de topologia o binarios terminen tratados como documentos PowerScript servibles por el LSP.

## 4. Alcance

- definir un helper compartido de URIs servibles semanticamente por el LSP;
- aplicar un guard central en diagnostics y providers semanticos del servidor;
- fijar el comportamiento con unit del helper y smoke que fuerce el lenguaje sobre markers/PBL;
- mantener intacto el uso de esos artefactos en discovery/topologia/watchers.

## 5. Fuera de alcance

- cambiar el catalogo de extensiones de lenguaje o los iconos publicados al editor;
- reclasificar `.srj/.srq` mas alla del contrato actual del selector cliente;
- tocar parsing de topologia o discovery salvo la reutilizacion del helper compartido;
- abrir nuevas surfaces UX sobre markers o build files.

## 6. Criterios de aceptacion

- AC1. `.pbw/.pbt/.pbproj/.pbsln/.pbl` no reciben serving semantico PowerScript aunque se fuerce un lenguaje servido.
- AC2. `.sru/.srw/.srd` y el resto de fuentes SR* siguen servidas normalmente.
- AC3. Discovery/topologia/watcher siguen consumiendo markers y `.pbl` sin regresion.
- AC4. Existe smoke o integration focalizada que cubre el caso real de borde.
- AC5. README y workflows reflejan la separacion entre topologia y serving semantico.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`

## 9. Cierre registrado

- `src/shared/powerbuilderFiles.ts` expone `isPowerBuilderSemanticUri()`;
- `src/server/server.ts` bloquea diagnostics/providers semanticos en markers y `.pbl` binarios;
- `test/server/unit/powerbuilderFiles.test.ts` y `test/smoke/lsp-guards.extension.test.ts` dejan trazado el comportamiento de borde y el control positivo sobre `.sru`.