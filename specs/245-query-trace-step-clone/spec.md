# Spec 245 - Query trace step cloning (B157/B136)

## 1. Resumen

Hacer que `getLastTrace()` devuelva clones de `TraceStep` para evitar que consumidores externos muten el estado retenido de la última traza.

## 2. Problema

`getLastTrace()` ya copia el array de pasos, pero sigue devolviendo las mismas referencias de `TraceStep`, dejando el snapshot expuesto a mutaciones externas.

## 3. Objetivo

Blindar la salida de `getLastTrace()` clonando cada `TraceStep` devuelto.

## 4. Alcance

- introducir un clonador de pasos de traza;
- usarlo en `getLastTrace()`;
- cubrir la no mutabilidad observable con tests unitarios focalizados.

## 5. Fuera de alcance

- deep clone del campo `detail` arbitrario;
- cambios en `withTrace()`;
- exposición pública adicional.

## 6. Requisitos

- R1. La salida de `getLastTrace()` no debe compartir referencias de `TraceStep` con el snapshot retenido.
- R2. El comportamiento observable de la traza no debe cambiar.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `getLastTrace()` clona cada `TraceStep`.
- AC2. Mutar la salida devuelta no altera lecturas posteriores.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El campo `detail` sigue siendo opaco y no se deep-clona en esta slice.
- Documentacion a revisar: `docs/done-log.md`.