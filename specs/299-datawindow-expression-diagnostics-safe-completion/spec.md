# Spec 299 - datawindow expression diagnostics safe completion (B254)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B254` como capa interactiva segura sobre expresiones DataWindow, añadiendo completion y diagnósticos conservadores para property paths defendibles sin abrir completion genérica en strings ni parseo paralelo del subdominio DataWindow.

## 2. Estado real actual

El backbone DataWindow ya resolvía hover, definition, signatureHelp, lineage SQL y child routes. El gap real estaba en `completion`, que abortaba dentro de strings antes de reconocer `Describe/Modify`, y en `diagnostics`, que no emitía warnings sobre property paths completas no resolubles.

## 3. Objetivo

Dar completion segura y diagnósticos conservadores sobre expresiones DataWindow reutilizando `dataWindowPropertyPaths`, `DataWindowModel` y bindings `DataObject` ya indexados, manteniendo degradación honesta cuando el root no sea defendible.

## 4. Alcance

- habilitar completion DataWindow dentro de `Describe/Modify`, `.Object` y `GetChild()` solo en contexto reconocible;
- añadir warnings para rutas DataWindow completas no resolubles cuando el root sea único y estable;
- fijar el contrato compartido en suites unitarias y golden;
- estabilizar la validación vecina del backbone DataWindow cuando existan URIs repetidas entre suites;
- alinear documentación viva y mover el foco canónico a `B255`.

## 5. Fuera de alcance

- abrir completion genérica dentro de strings arbitrarios;
- diagnosticar rutas parciales o incompletas mientras el usuario sigue escribiendo;
- introducir un parser DataWindow separado del backbone ya publicado.

## 6. Criterios de aceptación

- AC1. completion ofrece sugerencias seguras dentro de property paths DataWindow resolubles.
- AC2. diagnostics avisa solo en rutas completas no resolubles cuando el root es defendible y no inventa warnings si el binding es dinámico.
- AC3. hover/definition/signatureHelp siguen reutilizando el mismo backbone sin regresiones.
- AC4. la suite golden fija que completion y diagnostics comparten el mismo modelo DataWindow ya usado por el resto de surfaces.
- AC5. backlog, roadmap y current-focus dejan de tratar `B254` como deuda activa y pasan a `B255`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(Modify|ruta DataWindow|binding raíz es dinámico|property paths DataWindow)"`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(DataWindow|DataObject|GetChild|Modify|Describe|property paths DataWindow)"`

## 9. Cierre registrado

- el producto sirve completion y diagnósticos DataWindow sobre el mismo backbone ya reutilizado por hover, definition, signatureHelp y lineage;
- la excepción al guard de strings queda limitada a contexto DataWindow reconocible;
- el siguiente foco canónico pasa a `B255`.