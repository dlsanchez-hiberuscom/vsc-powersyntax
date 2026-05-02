# Plan - Spec 259 PBAutoBuild command runner out-of-process (B183)

## 1. Enfoque técnico

Mantener el cliente fino: el cliente aporta la ruta efectiva del ejecutable y el servidor resuelve el build file utilizable y controla el proceso hijo.

Estado final: completado con runner server-side dedicado, cancelación/timeout y proyección mínima en `showStats`/cliente sin meter el build en el scheduler general.

## 2. Pasos

1. Crear un runner puro server-side y un selector seguro del build file.
2. Exponer comandos mínimos run/cancel en el borde `executeCommand`.
3. Proyectar estado mínimo en stats/runtime journal y cliente.
4. Añadir tests focalizados de runner y proyección visible básica.

Resultado: el carril moderno de build ya puede ejecutarse desde VS Code sobre un build file JSON utilizable sin reutilizar tareas genéricas del workspace.

## 3. Riesgos

- mezclar el runner con el scheduler general y cancelar builds por preempciones no relacionadas;
- duplicar en servidor la detección del ejecutable ya resuelta por el cliente;
- acoplar `WorkspaceState` a estado efímero del proceso en lugar de mantenerlo como inventario read-only.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`