# Plan — Spec 150 Indexing Checkpoints and Resume (B155)

## 1. Resumen tecnico

La implementacion debe apoyarse en workspaceIndexer, workspaceState, project model unificado, analysisCache y las caches documentales, introduciendo una capa de persistencia nueva en el runtime del servidor.

## 2. Estado actual

- analysisCache ya sincroniza parte del analisis con DocumentCache y KnowledgeBase en memoria.
- No existe una capa persistente de checkpoints ni resume entre sesiones.

## 3. Diseno propuesto

- Definir un checkpoint serializable por workspace y por proyecto.
- Guardar solo artefactos seguros y validados del pipeline.
- Validar compatibilidad por epoch, topologia y schema antes de reanudar.
- Restaurar estado al arranque y reencolar solo lo pendiente o incompatible.

## 4. Impacto en rendimiento

- Positivo en reaperturas grandes y warm indexing.
- Riesgo de I/O extra si el formato es demasiado grande o frecuente.

## 5. Riesgos tecnicos

- Persistir artefactos demasiado acoplados a implementaciones internas transitorias.
- No separar bien checkpoint valido de estado provisional.
- Reanudar sin verificar topologia o version semantica.

## 6. Estrategia de validacion

- Tests del formato de checkpoint y resume.
- Casos de compatibilidad e incompatibilidad.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md
- docs/architecture.md si se introduce una capa de persistencia operativa nueva