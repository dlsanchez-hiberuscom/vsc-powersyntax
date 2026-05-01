# Spec 151 — Journaling transaccional de cache persistente (B167)

## 1. Resumen

Introducir journaling transaccional en la cache persistente para evitar corrupcion y estados incompletos ante cierres abruptos o fallos durante escrituras.

## 2. Problema

Sin journaling, cualquier futura persistencia de checkpoints o caches puede quedar a medio escribir y dejar al runtime sin una forma segura de saber si el estado en disco es util o no.

## 3. Objetivo

Definir un mecanismo de journal transaccional que garantice commit atomico o recovery seguro para la cache persistente del runtime.

## 4. Alcance

- Definir unidades transaccionales de escritura.
- Persistir journal y estado final con recovery claro.
- Permitir rollback o replay seguros tras fallo.
- Integrar el journal con checkpoints y caches persistentes futuras.

## 5. Fuera de alcance

- Migraciones de schema.
- Cache de queries frecuentes.
- Compactacion avanzada de archivos persistidos.

## 6. Requisitos

- R1. Una escritura persistente debe ser atomica o recuperable con seguridad.
- R2. El runtime debe detectar y sanar estado incompleto tras cierre abrupto.
- R3. El journal debe convivir con checkpoints y particion por proyecto/workspace.
- R4. La solucion debe ser observable y testeable, no una caja negra silenciosa.

## 7. Criterios de aceptacion

- AC1. Existe contrato de journal transaccional para la cache persistente.
- AC2. El runtime detecta y resuelve un estado interrumpido en el arranque.
- AC3. Los tests cubren commit valido y recovery tras fallo.
- AC4. B167 queda trazada como dependencia directa de B168 y B071.

## 8. Riesgos y notas

- Un journal demasiado verboso aumentara I/O sin aportar robustez proporcional.
- Un journal demasiado pobre no permitira recovery fiable.