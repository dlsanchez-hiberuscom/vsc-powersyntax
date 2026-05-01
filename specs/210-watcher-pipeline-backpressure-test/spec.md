# Spec 210 - Watcher pipeline backpressure test (B169A)

## 1. Resumen

Validar extremo a extremo el pipeline real `watcher -> debouncer -> intake` para demostrar coalescing y backpressure sobre trabajo efectivo de reindexado.

## 2. Problema

Tras las Specs 207 y 208, las piezas del pipeline ya existen, pero faltaba una prueba que demuestre juntas que el debounce y el backpressure reducen trabajo real y no solo estados internos del helper.

## 3. Objetivo

Cubrir el pipeline completo con tests unitarios conectando `createFileWatcherDebouncer()` y `applyWatchedFileEvents()`.

## 4. Alcance

- probar coalescing por URI en el pipeline completo;
- probar flush adelantado por backpressure con batch restante;
- verificar que el conocimiento publicado final coincide con el trabajo esperado.

## 5. Fuera de alcance

- tests de integración VS Code host;
- cambios de markers de proyecto;
- ajustes nuevos del runtime productivo.

## 6. Requisitos

- R1. Múltiples cambios sobre la misma URI no deben reindexarse varias veces.
- R2. Superar `maxPending` debe provocar un flush temprano sin perder el resto del batch.
- R3. La validación debe observar efectos reales sobre `KnowledgeBase` y `WorkspaceState`.

## 7. Criterios de aceptacion

- AC1. Hay test de coalescing e2e con un solo reindexado efectivo.
- AC2. Hay test de backpressure e2e con dos flushes y tres documentos procesados.
- AC3. Ambos tests pasan sobre el pipeline real del watcher.

## 8. Riesgos y notas

- Sigue faltando una prueba contra host real de VS Code, pero el wiring lógico del pipeline queda cubierto.
- Esta slice completa la validación pendiente más directa de `B169A`.