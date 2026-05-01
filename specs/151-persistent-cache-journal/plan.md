# Plan — Spec 151 Persistent Cache Journal (B167)

## 1. Resumen tecnico

Este slice debe introducir una capa de persistencia transaccional nueva en el runtime del servidor, reutilizable por checkpoints y futuras caches, apoyandose en filesystem y en el modelo topologico por workspace/proyecto.

## 2. Estado actual

- No existe aun persistencia transaccional del runtime.
- analysisCache y caches compartidas preparan la necesidad, pero no resuelven el almacenamiento en disco.

## 3. Diseno propuesto

- Introducir operaciones begin, commit, rollback o recovery equivalentes.
- Registrar en journal los cambios persistentes antes de publicarlos como estables.
- Resolver el arranque leyendo journal y estado final para decidir replay, rollback o descarte.
- Integrar el mecanismo con checkpoints y particiones por proyecto/workspace.

## 4. Impacto en rendimiento

- Positivo en robustez y confianza del resume.
- Riesgo de I/O extra que debe minimizarse con transacciones por lote y formatos compactos.

## 5. Riesgos tecnicos

- Diseñar un journal demasiado complejo para el valor inicial.
- No delimitar bien la unidad transaccional.
- Mezclar recovery con migraciones de schema, que pertenecen a B168.

## 6. Estrategia de validacion

- Tests de commit, fallo intermedio y recovery.
- Casos por workspace y por proyecto cuando aplique.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md
- docs/architecture.md si se añade la capa persistente formal del runtime