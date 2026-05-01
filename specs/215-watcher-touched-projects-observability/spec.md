# Spec 215 - Watcher touched projects observability (B141A/B169A)

## 1. Resumen

Hacer observable qué proyectos afecta cada batch del watcher usando `UnifiedProjectModel`.

## 2. Problema

El watcher ya refresca documentos y routing project-aware, pero su salida seguía ciega respecto al impacto por proyecto, limitando status y diagnóstico de bursts reales.

## 3. Objetivo

Devolver la lista de proyectos tocados por cada batch del intake para reutilizarla en logs y observabilidad runtime.

## 4. Alcance

- añadir `touchedProjects` al resultado del intake;
- derivarlo desde `WorkspaceState` antes y después del refresh del routing;
- incluirlo en el log de flush del servidor;
- cubrir create/delete con tests.

## 5. Fuera de alcance

- agrupación adicional por proyecto en el scheduler;
- UI dedicada de proyectos afectados.

## 6. Requisitos

- R1. El intake debe informar proyectos tocados por create/change/delete.
- R2. Los deletes deben conservar el proyecto afectado aunque el archivo deje de existir.
- R3. La información debe derivarse del modelo unificado, no de lógica duplicada.

## 7. Criterios de aceptacion

- AC1. `WatchedFileIntakeResult` incluye `touchedProjects`.
- AC2. El servidor lo expone en el log del flush.
- AC3. Los tests validan proyectos tocados en create/delete.

## 8. Riesgos y notas

- Esta slice mejora observabilidad; aún no reordena el scheduler por proyecto tocado.