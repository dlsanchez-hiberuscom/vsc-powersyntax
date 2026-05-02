# Plan - Spec 207 Watched source intake pipeline

## 1. Estado

Slice historica del watcher incremental sobre archivos fuente PowerBuilder.

## 2. Estrategia

- procesar altas/cambios/bajas sin rediscovery completo;
- invalidar caches afectadas;
- respetar archivo abierto como fuente viva.

## 3. Documentacion

Registrar como parte del cierre del watcher incremental.
