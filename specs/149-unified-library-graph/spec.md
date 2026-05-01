# Spec 149 — Library graph / project model unificado (B141)

## 1. Resumen

Unificar en una sola fuente de verdad el modelo de proyectos, targets, librerias y dependencias para que scheduler, invalidacion, cache y serving hablen el mismo idioma topologico.

## 2. Problema

El proyecto ya dispone de projectRegistry, topology y libraryOrder, pero la informacion de pertenencia, orden y dependencias no esta todavia consolidada como modelo unico reutilizable por todo el runtime.

## 3. Objetivo

Definir un library graph o project model unificado que sirva como base comun para contexto de proyecto, orden de librerias, serving e invalidacion.

## 4. Alcance

- Unificar projectRegistry, topology y relaciones de librerias relevantes.
- Exponer una fuente de verdad unica desde workspaceState.
- Hacer que scheduler, cache, status, invalidacion y serving consuman el mismo modelo.
- Preparar el modelo para persistencia por proyecto.

## 5. Fuera de alcance

- Persistencia del modelo en disco.
- Query engine unificado completo.
- Features nuevas de UI.

## 6. Requisitos

- R1. Debe existir una unica fuente de verdad para targets, librerias y dependencias de proyecto.
- R2. libraryOrder y serving deben dejar de reconstruir topologia por su cuenta.
- R3. El modelo debe vivir en el servidor y ser agnostico del editor.
- R4. Debe ser compatible con particion por proyecto para caches y checkpoints.

## 7. Criterios de aceptacion

- AC1. workspaceState expone un project model unificado.
- AC2. Al menos dos consumidores actuales reutilizan ese modelo en lugar de recomponer topologia.
- AC3. Los tests cubren orden de librerias, pertenencia de archivo y dependencias base.
- AC4. B141 queda formalizada como entrada de la Fase 2 de persistencia robusta.

## 8. Riesgos y notas

- Un modelo demasiado ambicioso puede reabrir topologia sin necesidad.
- Un modelo demasiado pobre no servira como base comun para persistencia e invalidacion.