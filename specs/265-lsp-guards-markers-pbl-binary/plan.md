# Plan - Spec 265 Guards LSP para markers y PBL binario (B231)

## 1. Enfoque tecnico

Resolver `B231` en el borde del servidor, no en cada feature por separado. El cliente ya acota el selector, pero el hueco real es la falta de una valla central si un documento no fuente entra al servidor por override de lenguaje o por cambios futuros del wiring.

## 2. Pasos

1. Introducir un helper compartido de URIs semanticas servibles.
2. Aplicar un guard central a diagnostics y providers del `server.ts`.
3. Anadir unit del helper y smoke que fuerce el lenguaje sobre markers/PBL.
4. Actualizar docs canónicas y mover el foco a `B175`.

## 3. Riesgos

- romper soporte de documentos `untitled` o de fuentes SR* legitimas al hacer el guard demasiado agresivo;
- confiar solo en el selector cliente y dejar el servidor vulnerable a overrides de lenguaje;
- escribir una smoke poco discriminante que pase aunque el servidor siguiera parseando markers.

## 4. Validacion

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`

## 5. Resultado ejecutado

1. El servidor solo sirve semanticamente URIs alineadas con el contrato compartido.
2. La smoke demuestra que incluso forzando un lenguaje servido sobre markers/PBL, no aparecen providers ni diagnostics semanticos.
3. El flujo visible de discovery/topologia permanece intacto y el siguiente foco pasa a `B175`.