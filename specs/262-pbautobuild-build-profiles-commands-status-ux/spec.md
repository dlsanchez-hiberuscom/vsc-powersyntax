# Spec 262 - PBAutoBuild build profiles, commands and status UX (B185)

## 1. Resumen

Permitir que el usuario ejecute builds frecuentes del carril moderno sin recordar rutas ni comandos manuales, apoyándose en el snapshot de health ya cerrado y en los build files utilizables descubiertos por el servidor.

## 2. Estado real actual

`B185` queda `Closed`: el cliente ya expone comandos para repetir el último build o elegir un build file utilizable, recuerda el último perfil ejecutado por workspace y lo proyecta en menú, tooltip y reportes visibles.

## 3. Objetivo

Completar la UX básica del build moderno con acciones frecuentes y un perfil recordado reutilizable sin abrir una segunda máquina de estado en cliente.

## 4. Alcance

- exponer build files utilizables al cliente mediante un comando ligero del servidor;
- recordar el último build file ejecutado como perfil workspace-scoped;
- añadir comandos para repetir el último build y elegir/ejecutar un build file utilizable;
- proyectar el perfil recordado en menú, tooltip y reportes visibles.

## 5. Fuera de alcance

- export de perfiles/ayudas a CI/CD (`B186`);
- reabrir runner, parser o health unificada ya cerrados;
- automatización ORCA o integración legacy.

## 6. Criterios de aceptación

- AC1. Existen comandos para repetir el último build frecuente y para elegir/ejecutar un build file utilizable.
- AC2. El último build file ejecutado se recuerda por workspace y reaparece en menú/status.
- AC3. La UX visible reutiliza el snapshot de build health ya cerrado y no duplica reglas de disponibilidad.
- AC4. Tests cubren la proyección visible y la smoke del registro de comandos.

## 7. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 8. Cierre registrado

- `src/server/server.ts` expone la lista de build files PBAutoBuild utilizables al cliente;
- `src/client/extension.ts` añade comandos para repetir el último build, elegir un build file utilizable y recordar el último perfil workspace-scoped;
- `src/client/statusBarPresentation.ts`, `package.json` y `test/smoke/extension.test.ts` fijan la proyección visible y el registro de los nuevos comandos del carril moderno.