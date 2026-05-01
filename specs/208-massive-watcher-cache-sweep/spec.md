# Spec 208 - Massive watcher cache sweep (B169A)

## 1. Resumen

Activar un modo masivo en el intake del watcher para colapsar invalidaciones repetidas de caches derivadas cuando entra una rafaga grande de archivos fuente.

## 2. Problema

Tras la Spec 207, el watcher ya refresca archivos cerrados, pero una rafaga grande seguía invalidando `ServingCache` y `HotContextCache` una vez por URI, justo el patrón de tormenta que B169A quiere evitar.

## 3. Objetivo

Mantener el refresco documental, pero reducir el trabajo redundante en bursts grandes cambiando de invalidación selectiva a barrido global único.

## 4. Alcance

- añadir umbral de modo masivo al intake;
- devolver observabilidad mínima (`massive`) en el resultado;
- usar invalidación global de caches derivadas en modo masivo;
- cubrir diferencia entre batch pequeño y batch masivo con tests.

## 5. Fuera de alcance

- reindexación total del workspace por bursts masivos;
- thresholds definitivos calibrados con corpus real;
- cambios de markers de proyecto.

## 6. Requisitos

- R1. Los batches pequeños mantienen invalidación selectiva.
- R2. Los batches masivos evitan invalidaciones repetidas por URI.
- R3. El resultado del intake debe indicar si el batch fue masivo.

## 7. Criterios de aceptacion

- AC1. `applyWatchedFileEvents()` distingue modo incremental y modo masivo.
- AC2. En modo masivo, `ServingCache` se invalida globalmente una sola vez lógica.
- AC3. En modo incremental, entradas no afectadas permanecen válidas.

## 8. Riesgos y notas

- El umbral sigue siendo heurístico; habrá que ajustarlo con corpus reales.
- Esta slice reduce churn de caches, pero no cierra aún la estrategia completa de backpressure de B169A.