# Spec 140 — Priorizacion por dependencias semanticas cercanas (B122)

## 1. Resumen

Cambiar la prioridad del trabajo de indexacion para que siga valor semantico cercano al archivo activo y no solo orden fisico o de descubrimiento.

## 2. Problema

Aunque el proyecto ya protege el archivo activo, el trabajo cercano todavia puede ordenarse de forma demasiado fisica o superficial, desaprovechando relaciones reales de herencia, ownership o tipo.

## 3. Objetivo

Construir una politica de priorizacion semantica que ordene trabajo en torno a activo, ancestros, owners, tipos y llamadas probables antes de escalar al resto del proyecto o workspace.

## 4. Alcance

- Definir una heuristica semantica de cercania.
- Integrar esa heuristica en scheduler e indexador.
- Reutilizar dependencias del grafo inverso, projectRegistry e InheritanceGraph.
- Mantener fairness basica para que el trabajo global no se hambrune indefinidamente.

## 5. Fuera de alcance

- Latency governor completo.
- Backpressure del watcher.
- Progress model final.

## 6. Requisitos

- R1. El orden obligatorio debe empezar por activo y dependencias semanticas inmediatas.
- R2. La heuristica debe ser explicable y no depender de matching textual opaco.
- R3. Debe apoyarse en projectRegistry, InheritanceGraph y el grafo inverso cuando existan.
- R4. Debe convivir con yielding y fairness para no bloquear el progreso global.

## 7. Criterios de aceptacion

- AC1. El scheduler puede ordenar trabajo por cercania semantica.
- AC2. Ancestros, owners o tipos cercanos salen antes que archivos lejanos no relacionados.
- AC3. Los tests cubren al menos un caso de prioridad por herencia y otro por proyecto activo.
- AC4. B122 queda documentada como capa de valor semantico sobre B152 y B153.

## 8. Riesgos y notas

- Una heuristica demasiado compleja sera dificil de explicar y mantener.
- Una heuristica demasiado plana no mejorara realmente la UX del archivo activo.