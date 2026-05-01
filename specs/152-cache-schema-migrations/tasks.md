# Tasks — Spec 152 Cache Schema Migrations (B168)

## 1. Preparacion

- [x] T1. Definir los metadatos minimos del manifest persistente.
- [x] T2. Clasificar cambios que exigen migrate, invalidate o rebuild.

## 2. Implementacion

- [x] T3. Implementar schemaVersion y manifest persistente.
- [x] T4. Implementar la decision de migrate, invalidate o rebuild al arranque.
- [x] T5. Anadir al menos una migracion pequena y verificable o su politica de descarte segura.

## 3. Validacion

- [x] T6. Anadir tests de compatibilidad e incompatibilidad.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar pruebas de persistencia afectadas.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B168.
- [x] T10. Registrar deuda futura si alguna migracion compleja debe resolverse con rebuild en esta primera fase.
