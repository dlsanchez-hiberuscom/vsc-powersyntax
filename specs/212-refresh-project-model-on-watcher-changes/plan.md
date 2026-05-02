# Plan - Spec 212 Refresh project model on watcher changes

## 1. Estado

Slice historica para refrescar modelo de proyecto ante cambios de watcher.

## 2. Estrategia

- detectar markers y source nuevos;
- refrescar routing/provenance sin rediscovery completo;
- validar touched projects.

## 3. Documentacion

Registrar como parte del watcher incremental completo.
