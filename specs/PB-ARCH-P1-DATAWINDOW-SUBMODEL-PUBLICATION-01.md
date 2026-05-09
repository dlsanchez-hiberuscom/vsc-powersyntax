# Spec: PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01

## 1. Identificación
- **ID:** PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
- **Título:** Publicación del Submodelo DataWindow
- **Estado:** Open by conformance
- **Prioridad:** P1
- **Área:** Arquitectura, DataWindows

## 2. Objetivo
Formalizar el submodelo independiente que gobierna los objetos DataWindow (`.srd` y asignaciones de `DataObject`), separándolo de las estructuras de parsing puras de PowerScript, para proporcionar boundaries seguros de evidencia y nivel de confianza.

Actualización 2026-05:

- Este spec conserva el contrato histórico del submodelo, pero el owner ejecutable activo es `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` en `docs/backlog.md`.
- La evidencia actual ya incluye un boundary mínimo en `src/server/semantic/submodels/datawindow/`, un wrapper bounded para `DataWindow bindings` y receipts read-only en Current Object Context, pero la publicación completa del submodelo y la convergencia de consumers siguen parciales.

## 3. Decisiones y Detalles de Implementación

### 3.1 Aislamiento de Submodelo
Se desarrolló una serie de módulos independientes dedicados al submodelo DataWindow (`dataWindowModel.ts`, `dataWindowBindingModel.ts`, `dataWindowPropertyPaths.ts`). Esto garantiza que la resolución semántica de un DataWindow respete la separación conceptual frente a las variables locales y de instancia estándar de PowerScript.

### 3.2 Binding Models con Evidence y Confidence
Los métodos de vinculación de datos (`findNearestDataObjectLiteralBinding`, `resolveDataWindowDefinitionTargets`) arrojan niveles de confianza (`high`, `medium`, `low`) y emiten un estado del binding transaccional y del DataObject (`known`, `ambiguous`, `dynamic`, `missing`). Esto provee evidencia robusta al LSP sobre por qué un componente ha sido diagnosticado como erróneo.

### 3.3 Boundaries Explícitos
Las validaciones semánticas reconocen los linajes SQL (`dataWindowSqlLineage.ts`) y aíslan de forma segura las expresiones de las propiedades para no inyectar ruido de parseo en el árbol principal de PowerScript.

## 4. Criterios históricos y gap actual
- Documentación e instanciación de un set robusto de entidades "DataWindowModel".
- Diagnósticos basados en `confidence` respecto a los DataWindow bindings.
- El servidor soporta referencias de submodelos a nivel de runtime sin recargar el motor PowerScript base.

Pendiente exacto 2026-05:

- Mantener un boundary/facade explícito para el submodelo DataWindow sin mover el parser principal sin paridad.
- Converger consumers read-only/advisory adicionales hacia caps/receipts homogéneos.
- Cerrar la reconciliación final con `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` antes de considerar este histórico como `Done`.
