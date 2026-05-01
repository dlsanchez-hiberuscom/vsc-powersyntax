# Spec 207 - Watched source intake pipeline (B169A)

## 1. Resumen

Conectar el watcher real de archivos fuente al runtime del servidor mediante un intake con debounce y refresco selectivo de documentos cerrados.

## 2. Problema

El repositorio ya tenía `fileWatcherDebouncer`, pero seguía aislado. El cliente tampoco observaba `.sr*`, así que cambios externos en archivos fuente cerrados no actualizaban `KnowledgeBase`, `DocumentCache` ni invalidaciones relacionadas.

## 3. Objetivo

Hacer que los cambios externos de archivos fuente entren en el runtime por un camino controlado: watcher LSP -> debouncer -> tarea background -> reindexación selectiva o eliminación.

## 4. Alcance

- compartir globs/extensiones de archivos fuente PB entre cliente y servidor;
- observar `.sr*` además de markers de proyecto;
- aplicar eventos coalescidos a `WorkspaceState`, `DocumentCache`, `KnowledgeBase` y caches derivadas;
- limpiar diagnósticos al borrar archivos observados;
- añadir tests unitarios del intake.

## 5. Fuera de alcance

- re-discovery completo ante cambios de `.pbw/.pbt/.pbsln/.pbproj`;
- massive change mode explícito;
- política final de backpressure a nivel de scheduler.

## 6. Requisitos

- R1. Los cambios externos en archivos fuente cerrados deben refrescar el conocimiento publicado.
- R2. Los borrados deben retirar el documento de KB y cachés.
- R3. Los documentos abiertos no deben reindexarse por el watcher.

## 7. Criterios de aceptacion

- AC1. El cliente observa archivos `.sr*` y el servidor recibe `workspace/didChangeWatchedFiles` para ellos.
- AC2. El servidor aplica reindexado selectivo en background para archivos fuente cerrados.
- AC3. Los borrados limpian snapshot, caché documental y diagnósticos publicados.
- AC4. Hay tests unitarios para create/change/delete y skip de documento abierto.

## 8. Riesgos y notas

- Todavía falta un modo explícito para bursts masivos y cambios de markers de proyecto.
- Esta slice abre el intake real de B169A, pero no lo cierra todavía.