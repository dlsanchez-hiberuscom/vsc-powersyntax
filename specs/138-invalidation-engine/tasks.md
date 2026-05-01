# Tasks — Spec 138 Invalidation Engine (B154)

## 1. Preparacion

- [x] T1. Inventariar invalidaciones actuales en server.ts y caches compartidas.
- [x] T2. Definir la taxonomia minima de change kind.

## 2. Implementacion

- [x] T3. Implementar classifyChangeKind.
- [x] T4. Implementar buildInvalidationPlan.
- [x] T5. Implementar selectiveReindexPlan.
- [x] T6. Conectar el engine al wiring principal del servidor.

## 3. Validacion

- [x] T7. Anadir tests de no-op, cambio local y cambio cross-file.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar tests de caches y scheduler afectados.

## 4. Cierre

- [x] T10. Reflejar trazabilidad documental de B154.
- [x] T11. Registrar deuda derivada si queda algun llamador temporal fuera del engine.
