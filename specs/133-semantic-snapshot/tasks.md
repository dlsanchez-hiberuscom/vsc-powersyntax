# Tasks — Spec 133 Semantic Snapshot (B151)

## 1. Preparacion

- [x] T1. Identificar en documentAnalysis todas las piezas que ya forman parte del analisis documental reutilizable.
- [x] T2. Definir el contrato del snapshot canonico y su identidad minima.

## 2. Implementacion

- [x] T3. Construir el snapshot desde el pipeline de analisis documental.
- [x] T4. Introducir la politica base de snapshotMergeOrReplace.
- [x] T5. Adaptar DocumentCache y KnowledgeBase para aceptar el snapshot como unidad primaria.

## 3. Validacion

- [x] T6. Anadir tests unitarios del builder y de snapshotIdentity.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar tests de la capa de analisis y knowledge afectados.

## 4. Cierre

- [x] T9. Revisar backlog y current-focus para dejar trazabilidad explicita con B151.
- [x] T10. Registrar deuda derivada si algun consumidor queda temporalmente fuera del snapshot.
