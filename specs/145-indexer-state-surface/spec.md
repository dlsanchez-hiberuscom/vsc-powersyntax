# Spec 145 — Superficie de estado del indexador (B126)

## 1. Resumen

Exponer una superficie de estado del indexador que muestre colas, trabajo actual, invalidaciones, cancelaciones y ultima actividad util para diagnostico operativo.

## 2. Problema

El indexador sigue siendo parcialmente una caja negra: hay contadores y status dispersos, pero no una superficie unificada y util para entender que esta haciendo el motor en cada momento.

## 3. Objetivo

Definir un estado observable del indexador que pueda alimentar status, diagnostico, comandos de inspeccion y futuras herramientas de salud interna.

## 4. Alcance

- Exponer colas, trabajo actual, ultimo archivo, invalidaciones y cancelaciones.
- Centralizar la obtencion del estado operativo del indexador.
- Reutilizar esta superficie para project status, telemetria y debugging.
- Mantener la salida estable y explicable.

## 5. Fuera de alcance

- Modelo final de progreso agregado.
- Event log tecnico completo.
- Health checker completo.

## 6. Requisitos

- R1. El indexador debe dejar de ser una caja negra para el equipo y para futuras features de observabilidad.
- R2. La superficie debe ser ligera y segura, sin recalculos caros para leer su estado.
- R3. Debe incluir, al menos, colas, trabajo actual, invalidaciones, cancelaciones y ultima actividad.
- R4. Debe integrarse con el runtime y con project status sin duplicar fuentes de verdad.

## 7. Criterios de aceptacion

- AC1. Existe una estructura unificada de estado del indexador.
- AC2. project status o una superficie equivalente consume esa estructura.
- AC3. Los tests cubren lectura de estado en escenarios base.
- AC4. B126 queda trazada como prerequisito de observabilidad para B163 y B176.

## 8. Riesgos y notas

- La superficie puede quedarse obsoleta si se alimenta manualmente desde demasiados puntos.
- Hay que evitar que el status agregue coste sensible al runtime.