# Spec 184 - Cierre observable de B071B en ServingCache

## 1. Resumen

Hacer observable el estado de la snapshot persistente de ServingCache y cerrar formalmente `B071B` en backlog y documentación canónica.

## 2. Problema

El circuito técnico de `B071B` ya está implementado, pero el servidor no expone aún un estado claro de cuántas entradas se restauran o persisten por sesión.

## 3. Objetivo

Exponer métricas básicas de la snapshot persistente en `powerbuilder.showStats` y usar ese criterio observable para cerrar `B071B`.

## 4. Alcance

- Registrar cuántas entradas se restauran y se persisten.
- Exponer esos datos en `powerbuilder.showStats`.
- Cerrar `B071B` en backlog y documentos canónicos.

## 5. Fuera de alcance

- Telemetría remota.
- Métricas por feature o por proyecto.
- Nuevas optimizaciones de ServingCache.

## 6. Requisitos

- R1. El servidor debe recordar el último restore/persist de snapshot de ServingCache.
- R2. `powerbuilder.showStats` debe exponer ese estado.
- R3. La documentación debe mover `B071B` a cerrado.

## 7. Criterios de aceptacion

- AC1. `showStats` expone métricas básicas de snapshot persistente.
- AC2. `B071B` deja de figurar como parcial en backlog.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Cerrar `B071B` sin una señal observable dejaría el estado del backlog discutible.
- El slice debe mantener la observabilidad barata y local al servidor.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/roadmap.md, docs/done-log.md.