# Plan - Spec 267 Diagnostic ID contract (B232)

## 1. Enfoque técnico

Resolver `B232` sin renombrado masivo. El problema real no era la ausencia de una nueva taxonomía, sino la falta de un contrato explícito y uniforme para los IDs ya emitidos. La solución correcta es fijar `diagnostic.code` como contrato estable, mantener compatibilidad legacy donde ya existía parsing de `source` y documentar la relación con `PB-*`.

## 2. Pasos

1. Crear un módulo compartido con los IDs diagnósticos emitidos hoy.
2. Emitir `diagnostic.code` en diagnósticos semánticos, extra y de obsoletas.
3. Adaptar consumers focales a `diagnostic.code` con fallback legacy.
4. Revalidar con unit tests focales.
5. Actualizar catálogo, roadmap, current-focus, done-log y spec canónica.

## 3. Riesgos

- romper un consumer puntual que todavía dependa de `source = PowerScript:SDx`;
- documentar como contrato algo que el runtime todavía no emite en todos los casos relevantes;
- mezclar taxonomía documental `PB-*` con IDs runtime de forma aún más confusa.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/obsolete.test.js out/test/server/unit/obsoleteDetectorSanity.test.js`

## 5. Resultado ejecutado

1. `diagnostic.code` queda fijado como contrato estable para las reglas implementadas hoy.
2. Los consumers focales dejan de parsear `source` como contrato primario.
3. `B233` pasa a ser el siguiente foco documental canónico.