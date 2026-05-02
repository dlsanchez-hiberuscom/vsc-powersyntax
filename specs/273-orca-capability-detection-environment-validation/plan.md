# Plan - Spec 273 ORCA capability detection and environment validation (B189)

## 1. Enfoque técnico

Resolver `B189` íntegramente en cliente. El adapter base ya existe en servidor, así que el punto de control real es la lectura/configuración de capability visible: un detector cacheado produce `orcaTooling`, el comando ORCA lo consume y las surfaces read-only lo proyectan sin abrir autodetección difusa ni otro canal semántico.

## 2. Pasos

1. Extender `publicApi` con `ApiOrcaCapabilitySnapshot` y `orcaTooling`.
2. Implementar un detector ORCA cliente-side sobre configuración explícita + `PB_ORCA_PATH`.
3. Integrar el snapshot en `extension.ts`, menú de estado, tooltip, reports y dashboard.
4. Validar el detector, la proyección visible y el smoke ORCA end-to-end.
5. Actualizar docs canónicas y mover el foco a `B190`.

## 3. Riesgos

- reabrir el servidor aunque el hueco real esté en cliente;
- inventar autodetección/versionado no sustentado por corpus o docs oficiales;
- mezclar capability legacy con discovery o staging antes de `B190+`.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy"`

## 5. Resultado ejecutado

1. ORCA legacy ya expone una capability clara y reusable sin romper el plugin cuando falta el tool.
2. La UX visible muestra tanto disponibilidad como último runner desde el mismo snapshot.
3. `B190` pasa a ser el siguiente foco del carril legacy.