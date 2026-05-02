# Tasks - Spec 276 ORCA staging provenance and source priority (B192)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en la prioridad efectiva de resolución y no en discovery/routing base ya cerrados en `B190-B191`.

## 2. Implementación

- [x] T2. Aplicar prioridad de `sourceOrigin` en los buckets globales de `KnowledgeBase` para evitar dependencia del orden de ingestión.
- [x] T3. Desempatar el query engine y el `global-fallback` usando la misma prioridad de provenance.
- [x] T4. Revalidar que el manifest read-only sirve primero source real cuando trunca duplicados con `orca-staging`.

## 3. Validación

- [x] T5. Añadir tests focales de KB, query engine y manifest para el conflicto `source real > orca-staging`.
- [x] T6. Ejecutar build/test proporcional antes de mover el foco a `B193`.

## 4. Cierre

- [x] T7. Actualizar docs canónicas y dejar `B193` como siguiente foco natural.