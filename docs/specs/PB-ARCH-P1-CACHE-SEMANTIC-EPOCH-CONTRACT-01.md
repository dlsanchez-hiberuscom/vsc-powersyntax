# Spec: PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01

## 1. Identificación
- **ID:** PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01
- **Título:** Contrato de Epoch Semántico y Llaves de Caché
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Arquitectura, Caché

## 2. Objetivo
Formalizar el modelo de caché semántico para características interactivas (hover, completion, definitions), asegurando que los resultados calculados se anclen a una versión específica (epoch) de la base de conocimiento y a coordenadas precisas, sin introducir bloqueos en el hot path.

## 3. Decisiones y Detalles de Implementación

### 3.1 Llaves Estructuradas (Structured Keys)
El módulo `ServingCache` utiliza `ServingKeyParts` para formar llaves de la forma:
`feature|uri|line|character|kbVersion|extra`
Esto garantiza que los hits de caché sean inmutables para un `kbVersion` (epoch) particular. Cuando la KnowledgeBase avanza de versión, las llaves antiguas provocan un `miss` y eventualmente son desalojadas, eliminando la necesidad de iterar sobre el mapa de caché entero para purgar de manera bloqueante.

### 3.2 Particiones con Presupuesto (Bounded Partitions)
El `ServingCache` divide su capacidad en particiones (hover, completion, signatureHelp, definition) usando pesos predefinidos (e.g., hover 30%, completion 35%). Esto previene que una ráfaga de consultas de autocompletado evicte el caché de hover de los usuarios.

### 3.3 TTL y Telemetría
El caché provee TTL opcional para datos fríos y emite eventos observables (`ServingCacheObserver`) sobre hits, misses, y evictions (`getStats()`). Esto permite telemetría profunda sobre el uso de la memoria.

## 4. Criterios de Aceptación Cumplidos
- Cada feature interactivo genera llaves atadas a `kbVersion`.
- Exposición de métricas (`ServingCacheStats`).
- La memoria está acotada por `maxEntries` y se desalojan elementos usando una política LRU.
