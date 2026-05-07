# Spec: PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01

## 1. Identificación
- **ID:** PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01
- **Título:** Coordinador de Invalidación Cross-Caché
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Arquitectura, Caché

## 2. Objetivo
Evitar ráfagas de invalidación costosas (global flush) en el sistema de LSP, construyendo un coordinador que evalúe si un cambio físico en un archivo altera genuinamente los "factos" semánticos y requiere purgar los submodelos dependientes.

## 3. Decisiones y Detalles de Implementación

### 3.1 Snapshots y Diff Semántico (No-Op Publish Gate)
La arquitectura emplea el `diffSemanticSnapshots` en `semanticDiff.ts` para evaluar si el estado público de un archivo cambió. Si un usuario introduce espacios, comentarios o variables locales internas que no afectan la API pública del objeto PowerBuilder, se levanta el "No-Op Semantic Publish Gate".
Esto activa un `createDocumentOnlyInvalidationPlan` (en `semanticInvalidation.ts`), el cual limita la invalidación estrictamente a la URI editada.

### 3.2 Planes de Invalidación Selectiva
Cuando hay un impacto real, `createSemanticInvalidationPlan` usa un `SemanticDependencySource` para rastrear las URIs directa y transitivamente impactadas. El coordinador fusiona estas URIs en un `SemanticInvalidationPlan` óptimo, pasándolo a las capas de indexación y a los cachés secundarios (ej. `ServingCache` y `DocumentCache`).

### 3.3 Coordinación Cross-Cache
`ServingCache` expone `invalidate(uri?)`, permitiendo eliminar únicamente las llaves asociadas al archivo modificado sin barrer el caché global. `DocumentCache` también expone `invalidate(uri)` y purga de su `ManagedStringInterner` de manera segregada.

## 4. Criterios de Aceptación Cumplidos
- Cambios puramente textuales que no alteran facts de `KnowledgeBase` no fuerzan recálculo semántico de los archivos dependientes.
- La invalidación puede realizarse granularmente pasando la URI o el conjunto de URIs afectadas.
- Se previene la explosión de memoria sin destruir estado sano.
