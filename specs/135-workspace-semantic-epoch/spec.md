# Spec 135 — Versionado semantico interno del workspace (B166)

## 1. Resumen

Introducir epochs o versiones semanticas internas del workspace para invalidar resultados, caches y staging por estado semantico y no solo por archivo.

## 2. Problema

El estado actual puede invalidarse por URI o por cambios locales, pero no existe una version semantica unificada del workspace que permita detectar resultados obsoletos de forma transversal.

## 3. Objetivo

Definir una workspace semantic epoch que avance de forma controlada cuando cambia la semantica publicada del workspace y que pueda ligarse a queries, caches y operaciones de invalidacion.

## 4. Alcance

- Definir el contrato de epoch semantica del workspace.
- Asociar queries y caches a la epoch publicada.
- Detectar resultados stale cuando la epoch ya no coincide.
- Preparar el uso de epoch para persistencia, invalidacion fina y publish atomico.

## 5. Fuera de alcance

- Journaling persistente.
- Migraciones de cache.
- Diff semantico detallado por documento.

## 6. Requisitos

- R1. La epoch debe avanzar solo cuando cambia el estado semantico publicado, no por cualquier evento de archivo.
- R2. Las queries interactivas y caches relevantes deben poder asociarse a una epoch concreta.
- R3. Debe existir deteccion explicita de staleEpoch para resultados o staging obsoletos.
- R4. La solucion debe ser compatible con B165, B154, B167 y B168.

## 7. Criterios de aceptacion

- AC1. El runtime dispone de una workspace semantic epoch observable internamente.
- AC2. Al menos una cache y una query relevante quedan ligadas a la epoch.
- AC3. Los tests cubren cambio de epoch y deteccion de stale results.
- AC4. B166 queda trazada como pieza puente entre atomicidad y persistencia.

## 8. Riesgos y notas

- Si la epoch sube demasiado a menudo, se perdera reutilizacion.
- Si sube demasiado poco, se serviran resultados obsoletos.