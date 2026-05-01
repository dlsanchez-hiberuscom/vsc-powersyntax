# Spec 150 — Checkpoints reales de indexacion y resume robusto (B155)

## 1. Resumen

Persistir checkpoints utiles del pipeline para reabrir workspaces grandes con resume seguro sin recomputar discovery, parseo y readiness desde cero.

## 2. Problema

El runtime puede reconstruir estado en memoria durante una sesion, pero todavia no existe una estrategia robusta para reanudar el pipeline entre sesiones aprovechando trabajo ya consolidado.

## 3. Objetivo

Definir checkpoints persistibles del pipeline y un mecanismo de resume seguro que permita recuperar discovery, parse, enrich y readiness sin servir estado incierto.

## 4. Alcance

- Definir que etapas del pipeline generan checkpoints utiles.
- Modelar un formato de checkpoint validable y reanudable.
- Recuperar estado seguro en arranque cuando el checkpoint es valido.
- Integrar el resume con el modelo topologico y el estado publicado.

## 5. Fuera de alcance

- Journaling transaccional completo.
- Migraciones de schema persistente.
- Cache de queries frecuentes.

## 6. Requisitos

- R1. El motor debe poder recuperar estado de discovery, parse, enrich y readiness sin recomputar todo cuando sea seguro.
- R2. Los checkpoints deben estar ligados a version semantica y topologia de proyecto.
- R3. Un checkpoint invalido o incompatible debe descartarse con seguridad.
- R4. El resume no debe exponer estado a medias ni saltarse validaciones criticas.

## 7. Criterios de aceptacion

- AC1. Existe contrato explicito de checkpoint del pipeline.
- AC2. El runtime puede cargar y validar un checkpoint compatible al arrancar.
- AC3. Los tests cubren resume valido e invalidacion de checkpoint incompatible.
- AC4. B155 queda formalizada como entrada directa de B071 y B071A.

## 8. Riesgos y notas

- Persistir demasiado pronto puede fijar un estado aun no seguro.
- Persistir demasiado tarde reducira el beneficio de warm resume.