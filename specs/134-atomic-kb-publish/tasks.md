# Tasks — Spec 134 Atomic KB Publish (B165)

## 1. Preparacion

- [x] T1. Identificar que estructuras deben entrar en el staged semantic state.
- [x] T2. Delimitar las lecturas interactivas que hoy dependen de estado mutable.

## 2. Implementacion

- [x] T3. Introducir el contenedor de staging para KnowledgeBase e indices.
- [x] T4. Implementar atomicPublishSwap.
- [x] T5. Implementar rollbackOnInvalidPublish y degradacion segura.
- [x] T6. Adaptar el wiring del servidor para publicar solo estados completos.

## 3. Validacion

- [x] T7. Anadir tests de publish valido y rollback.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar tests de features interactivas mas cercanas al KnowledgeBase.

## 4. Cierre

- [x] T10. Reflejar la trazabilidad de B165 en backlog y foco actual.
- [x] T11. Registrar limites temporales si alguna estructura queda fuera del swap atomico inicial.
