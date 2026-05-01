# Tasks — Spec 143 Watcher Backpressure (B169)

## 1. Preparacion

- [x] T1. Inventariar el flujo actual de watchers y debounce.
- [x] T2. Definir claves de coalescing y criterio de modo masivo.

## 2. Implementacion

- [x] T3. Implementar watcherEventCoalescing.
- [x] T4. Implementar backpressurePolicy.
- [x] T5. Implementar massiveChangeMode.
- [x] T6. Conectar la salida del intake al scheduler e invalidacion.

## 3. Validacion

- [x] T7. Anadir tests de burst pequeno y burst masivo.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar pruebas del runtime afectado por eventos FS.

## 4. Cierre

- [x] T10. Reflejar trazabilidad documental de B169.
- [x] T11. Registrar ajustes pendientes de umbrales sobre corpus reales.
