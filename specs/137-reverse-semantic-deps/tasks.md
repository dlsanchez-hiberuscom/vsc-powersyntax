# Tasks — Spec 137 Reverse Semantic Dependencies (B153)

## 1. Preparacion

- [x] T1. Inventariar relaciones semanticas ya modeladas en KnowledgeBase, InheritanceGraph y projectRegistry.
- [x] T2. Definir el contrato minimo de dependencia inversa y de razon de impacto.

## 2. Implementacion

- [x] T3. Implementar extractSemanticDependencies sobre snapshots documentales.
- [x] T4. Construir reverseDependencyGraph.
- [x] T5. Implementar impactedDocumentsResolver reutilizable por invalidacion y scheduler.

## 3. Validacion

- [x] T6. Anadir tests de herencia, visibilidad y firma con impacto cross-file.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar tests de knowledge y resolucion afectados.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B153.
- [x] T10. Registrar limites del primer corte si alguna dependencia se deja para una wave posterior.
