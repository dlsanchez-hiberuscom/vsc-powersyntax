# Tasks - Spec 267 Diagnostic ID contract (B232)

## 1. Preparación

- [x] T1. Inventariar los IDs diagnósticos realmente emitidos hoy y los consumers que parseaban `source`.
- [x] T2. Decidir la política de cierre: `diagnostic.code` estable con compatibilidad legacy, sin migración inmediata a `PB-*`.

## 2. Implementación

- [x] T3. Crear el módulo compartido de IDs diagnósticos.
- [x] T4. Emitir `diagnostic.code` estable en diagnósticos semánticos, extra y de obsoletas.
- [x] T5. Adaptar el quick-fix SD7 y el parser de overrides a ese contrato.

## 3. Validación

- [x] T6. Revalidar build y unit tests focales de diagnostics/code actions/obsolete.

## 4. Cierre

- [x] T7. Actualizar catálogo, testing, arquitectura, roadmap, backlog, current-focus y done-log.