# Plan - Spec 269 Project Health Dashboard (B216)

## 1. Enfoque técnico

Resolver `B216` enteramente en cliente. El runtime ya publica stats, health report, manifest semántico y build health; el trabajo nuevo es proyectarlo en una vista UX única y read-only sin reabrir cálculo en servidor.

## 2. Pasos

1. Crear un builder puro del dashboard read-only.
2. Registrar un comando cliente y añadirlo a la status bar/menu de mantenimiento.
3. Consumir `showStats` y `semanticWorkspaceManifest` desde el cliente.
4. Añadir validación unitaria del builder y smoke del comando visible.
5. Actualizar docs canónicas y mover el foco a `B214`.

## 3. Riesgos

- duplicar formateo/estado que ya existe en stats/health en lugar de reutilizarlo;
- abrir accidentalmente una dependencia nueva en servidor para algo que ya está disponible;
- vender ORCA o build legacy como disponible cuando todavía no existe ese carril.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "dashboard de salud del proyecto"`

## 5. Resultado ejecutado

1. El usuario puede abrir un dashboard read-only desde la status bar.
2. La vista reutiliza únicamente surfaces ya cerradas.
3. `B214` pasa a ser el siguiente foco UX/read-only.