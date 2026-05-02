# Plan - Spec 260 PBAutoBuild log parser and Problems Panel integration (B184)

## 1. Enfoque técnico

Mantener el parsing y la resolución de problemas en el servidor; el cliente solo debe publicar una colección separada de diagnósticos de build para no pisar el canal semántico principal.

Estado final: completado con parser puro + resolución segura server-side y colección separada de problemas de build en cliente.

## 2. Pasos

1. Crear un parser puro de la salida relevante de PBAutoBuild.
2. Resolver issues a entidades/archivos reales solo cuando haya evidencia suficiente.
3. Publicar problemas de build en una colección separada y reemplazable.
4. Añadir tests focalizados del parser y del wiring básico.

Resultado: el carril moderno ya proyecta errores de build al Problems Panel sin sobrescribir diagnósticos semánticos ni inventar ubicaciones ambiguas.

## 3. Riesgos

- inventar ubicaciones a partir de texto ambiguo del log;
- sobrescribir diagnósticos semánticos al reutilizar `sendDiagnostics` sin separar colecciones;
- duplicar parsing entre runner, health y UX futura.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildLogParser.test.js`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildProblems.test.js out/test/server/unit/pbAutoBuildRunner.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`