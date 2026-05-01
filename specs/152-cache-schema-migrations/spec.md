# Spec 152 — Cache schema versioning + migraciones (B168)

## 1. Resumen

Versionar el schema de la persistencia y decidir de forma segura si una version debe migrarse, invalidarse o reconstruirse.

## 2. Problema

Una vez exista cache persistente, el runtime necesitara distinguir esquemas compatibles e incompatibles para no reutilizar datos obsoletos o corruptos entre versiones del motor.

## 3. Objetivo

Definir versionado explicito del schema persistente y un mecanismo de migracion o invalidacion segura entre versiones del motor.

## 4. Alcance

- Definir identificadores de schema y compatibilidad.
- Introducir una politica de migrate, invalidate o rebuild.
- Integrar la decision con checkpoints, journal y topologia de proyecto.
- Hacer observable la razon de una migracion o descarte.

## 5. Fuera de alcance

- Reescritura completa del formato persistente en cada version.
- Migraciones arbitrarias complejas sin valor real.
- Cache de queries frecuentes.

## 6. Requisitos

- R1. Toda persistencia relevante debe llevar version de schema explicita.
- R2. El runtime debe decidir con seguridad entre migrar, invalidar o reconstruir.
- R3. Debe ser compatible con workspace semantic epoch y journaling transaccional.
- R4. Las migraciones deben ser pequenas, verificables y observables.

## 7. Criterios de aceptacion

- AC1. Existe schema versioning explicito para la cache persistente.
- AC2. El arranque decide correctamente entre migrate, invalidate o rebuild en casos base.
- AC3. Los tests cubren una migracion compatible y un descarte por incompatibilidad.
- AC4. B168 queda trazada como cierre basico del bloque de persistencia robusta inicial.

## 8. Riesgos y notas

- Migrar de mas puede mantener deuda historica innecesaria.
- Invalidar de mas puede eliminar beneficios de warm resume sin necesidad.