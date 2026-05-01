# Tasks — Spec 135 Workspace Semantic Epoch (B166)

## 1. Preparacion

- [x] T1. Delimitar que cambios deben incrementar la epoch semantica.
- [x] T2. Identificar caches y queries que ya requieren binding por epoch.

## 2. Implementacion

- [x] T3. Anadir workspaceSemanticEpoch al estado del runtime.
- [x] T4. Conectar el incremento de epoch al publish atomico del estado.
- [x] T5. Introducir queryEpochBinding en las consultas o caches iniciales.
- [x] T6. Implementar staleEpochDetection en un punto de serving reutilizable.

## 3. Validacion

- [x] T7. Anadir tests de incremento y deteccion stale.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar tests de caches o serving afectados.

## 4. Cierre

- [x] T10. Actualizar trazabilidad documental de B166.
- [x] T11. Registrar cualquier debt si alguna cache relevante queda fuera del primer binding por epoch.
