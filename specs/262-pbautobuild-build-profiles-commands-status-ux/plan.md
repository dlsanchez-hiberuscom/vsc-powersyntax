# Plan - Spec 262 PBAutoBuild build profiles, commands and status UX (B185)

## 1. Enfoque técnico

Mantener la UX del build frecuente enteramente en cliente, reutilizando el snapshot de health ya cerrado y un único comando server-side ligero para listar build files utilizables.

Estado final: completado con último build recordado por workspace, comandos visibles de repetición/selección y proyección del perfil en status/menu/reportes.

## 2. Pasos

1. Exponer build files utilizables desde el servidor.
2. Recordar el último build ejecutado como perfil del workspace.
3. Añadir comandos para repetir el último build y elegir/ejecutar uno nuevo.
4. Reflejar el perfil recordado en tooltip, stats, health report y menú.

## 3. Riesgos

- duplicar reglas de disponibilidad ya resueltas por build health;
- recordar perfiles inválidos sin revalidarlos contra el catálogo usable actual;
- mezclar selección UX con lógica del runner o del parser.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`