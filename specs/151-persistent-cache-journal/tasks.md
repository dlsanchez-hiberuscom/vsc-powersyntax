# Tasks — Spec 151 Persistent Cache Journal (B167)

## 1. Preparacion

- [x] T1. Definir la unidad transaccional minima de la cache persistente.
- [x] T2. Definir el formato inicial del journal y la politica de recovery.

## 2. Implementacion

- [x] T3. Implementar escritura transaccional con journal.
- [x] T4. Implementar recovery al arranque.
- [x] T5. Integrar el journal con checkpoints o cache persistente base.

## 3. Validacion

- [x] T6. Anadir tests de commit, fallo intermedio y recovery.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar pruebas del runtime persistente afectado.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B167.
- [x] T10. Registrar mejoras futuras de compactacion o rotacion si el primer journal queda simple.
