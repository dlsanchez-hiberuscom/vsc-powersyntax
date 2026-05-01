# Spec 133 — Semantic snapshot canonico por documento (B151)

## 1. Resumen

Introducir un snapshot semantico canonico por documento como unidad estable de analisis y consumo para el motor del servidor.

## 2. Problema

Hoy el servidor combina datos procedentes de analisis documental, parseo, caches y KnowledgeBase sin una unica unidad semantica estable por documento. Eso dificulta atomicidad, invalidacion fina, readiness local y evolucion del pipeline.

## 3. Objetivo

Concentrar en una sola estructura versionable por documento el fingerprint, el modelo del contenedor, simbolos, scopes, sentencias logicas, texto enmascarado, bloques de control, facts enriquecidos y readiness local.

## 4. Alcance

- Definir el contrato del snapshot documental en el runtime del servidor.
- Construir el snapshot desde src/server/analysis/documentAnalysis.ts y las piezas de parsing reutilizables.
- Dar identidad estable al snapshot para decidir merge, replace y reutilizacion segura.
- Preparar a KnowledgeBase y consumidores cercanos para leer desde el snapshot en lugar de recomponer piezas dispersas.

## 5. Fuera de alcance

- Publicacion atomica del estado global del workspace.
- Diff semantico entre snapshots.
- Persistencia en disco o checkpoints.

## 6. Requisitos

- R1. El snapshot debe nacer en el servidor y no depender de tipos del cliente ni de LSP como fuente de verdad.
- R2. Debe incluir, como minimo, fingerprint, container model, symbols, scopes, logical statements, masked text, control blocks, facts enriquecidos y readiness local.
- R3. Su identidad debe permitir detectar si procede reemplazar, fusionar o conservar informacion derivada segura.
- R4. Debe poder consumirse desde KnowledgeBase, caches documentales y futuras fases de invalidacion sin volver a parsear el documento.
- R5. Debe mantener la prioridad del archivo activo y no introducir trabajo duplicado en el Extension Host.

## 7. Criterios de aceptacion

- AC1. El analisis de un documento produce un snapshot canonico completo y autoconsistente.
- AC2. Los consumidores core inmediatos dejan de depender de recomposicion ad hoc cuando el snapshot ya dispone del dato.
- AC3. Existen tests para identidad del snapshot y para la politica merge-or-replace base.
- AC4. La documentacion del foco actual refleja que B151 queda formalizada por esta spec.

## 8. Riesgos y notas

- Un snapshot demasiado grande puede empeorar memoria y copia de datos si no se define con disciplina.
- La convergencia debe hacerse sin romper contratos ya usados por DocumentCache, KnowledgeBase y features interactivas.