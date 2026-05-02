# Spec 260 - PBAutoBuild log parser and Problems Panel integration (B184)

## 1. Resumen

Convertir la salida del build moderno en problemas navegables cuando el log aporta evidencia suficiente, sin inventar rutas o posiciones y sin mezclar estos diagnósticos con el flujo semántico normal del LSP.

## 2. Estado real actual

`B184` queda `Closed`: la salida relevante de PBAutoBuild ya se parsea en el servidor, los issues se resuelven a archivos reales solo cuando el objeto es único y el cliente publica una colección separada de problemas de build sin pisar diagnósticos semánticos.

## 3. Objetivo

Parsear la salida relevante de PBAutoBuild, resolver errores de build a archivos/objetos del workspace cuando la evidencia sea suficiente y publicarlos en Problems Panel sin sobrescribir diagnósticos semánticos.

## 4. Alcance

- introducir un parser puro de logs/salida de PBAutoBuild;
- resolver issues estructurados a archivos/entidades del workspace cuando el mapeo sea fiable;
- publicar problemas de build en una surface separada del flujo semántico normal;
- limpiar o reemplazar problemas previos al ejecutar builds nuevos;
- añadir tests focalizados del parser y del wiring básico hacia Problems.

## 5. Fuera de alcance

- UX final de perfiles/comandos recurrentes (`B185`);
- health unificado del build moderno (`B187`);
- heurísticas agresivas de mapeo cuando no exista object/file único;
- persistir histórico completo de builds.

## 6. Criterios de aceptación

- AC1. Existe un parser puro que extrae errores/warnings estructurados desde la salida relevante de PBAutoBuild.
- AC2. Solo se publican problemas cuando existe una resolución fiable a un archivo/objeto del workspace.
- AC3. Los problemas de build no pisan los diagnósticos semánticos del LSP.
- AC4. Una ejecución nueva reemplaza/limpia los problemas previos de build.
- AC5. Tests cubren parser, mapeo seguro y publicación básica en Problems.

## 7. Documentación afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildLogParser.test.js`

## 9. Cierre registrado

- `src/server/build/pbAutoBuildLogParser.ts` introduce el parser puro de salida relevante de PBAutoBuild y su resumen estructurado;
- `src/server/build/pbAutoBuildProblems.ts` resuelve issues a entidades tipo del workspace solo cuando el mapeo es único y seguro;
- `src/server/server.ts`, `src/shared/pbAutoBuildProtocol.ts` y `src/client/extension.ts` transportan y publican los problemas de build en una colección separada del canal semántico principal;
- `test/server/unit/pbAutoBuildLogParser.test.ts` y `pbAutoBuildProblems.test.ts` fijan parser y resolución segura, mientras la smoke corta del carril moderno asegura que la integración no rompe la activación visible del cliente.