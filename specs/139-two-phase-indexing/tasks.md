# Tasks — Spec 139 Two-Phase Indexing (B152)

## 1. Preparacion

- [x] T1. Delimitar que produce la fase estructural y que queda para la enriquecida.
- [x] T2. Identificar features que pueden consumir resultado structural-only.

## 2. Implementacion

- [x] T3. Implementar structuralPass en el indexador.
- [x] T4. Implementar enrichedPass.
- [x] T5. Introducir readinessByPass.
- [x] T6. Adaptar al menos una feature para degradar con seguridad por fase.

## 3. Validacion

- [x] T7. Anadir tests de orden y readiness del pipeline.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar pruebas de indexador y de la feature degradada.

## 4. Cierre

- [x] T10. Reflejar trazabilidad documental de B152.
- [x] T11. Registrar limites temporales de la degradacion si algun consumidor sigue exigiendo enrich completo.
