# Plan — Spec 135 Workspace Semantic Epoch (B166)

## 1. Resumen tecnico

El diseno debe apoyarse en src/server/workspace/workspaceState.ts como estado propietario del runtime y coordinarse con server.ts, KnowledgeBase, ServingCache y cualquier cache con reutilizacion semantica.

## 2. Estado actual

- workspaceState ya centraliza estado de topologia y project registry.
- El servidor invalida caches por URI o por eventos puntuales.
- No existe version semantica transversal de workspace.

## 3. Diseno propuesto

- Anadir una workspace semantic epoch al estado del servidor.
- Hacer que el publish atomico incremente la epoch solo cuando el estado semantico visible cambia.
- Asociar la epoch a caches y respuestas con reutilizacion significativa.
- Rechazar o recalcular resultados cuando la epoch ligada ya no coincide con la epoch publicada.

## 4. Impacto en rendimiento

- Positivo porque reduce reutilizacion insegura y prepara invalidacion fina.
- Coste bajo si la comparacion de epoch es constante y se evita recalcular cuando no hace falta.

## 5. Riesgos tecnicos

- Introducir demasiados puntos de incremento de epoch.
- Acoplar la epoch a cambios no semanticos.
- No definir bien la frontera entre epoch documental y epoch global.

## 6. Estrategia de validacion

- Tests unitarios del contador o token de epoch.
- Tests de cache ligada a epoch.
- Compilacion TypeScript y smoke sobre consultas interactivas.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- specs de persistencia y query cache dependientes de B166