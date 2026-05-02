# Tasks - Spec 265 Guards LSP para markers y PBL binario (B231)

## 1. Preparacion

- [x] T1. Confirmar que el cliente ya estrecha el selector y que el hueco real esta en el guard server-side.
- [x] T2. Reutilizar un helper canónico de clasificacion de URIs en vez de dispersar checks por feature.

## 2. Implementacion

- [x] T3. Introducir `isPowerBuilderSemanticUri()` en `src/shared/powerbuilderFiles.ts`.
- [x] T4. Aplicar un guard central a diagnostics y providers semanticos en `src/server/server.ts`.
- [x] T5. Anadir fixtures focales de marker/PBL para probar el borde de forma discriminante.

## 3. Validacion

- [x] T6. Anadir unit del helper compartido.
- [x] T7. Anadir smoke que fuerce un lenguaje servido sobre markers/PBL y confirme ausencia de serving semantico.
- [x] T8. Revalidar el slice con `build:test` + smoke focal.

## 4. Cierre

- [x] T9. Actualizar docs canónicas y mover el foco a `B175`.