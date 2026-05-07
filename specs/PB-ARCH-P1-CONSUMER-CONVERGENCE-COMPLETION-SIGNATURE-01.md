# Spec: PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01

## 1. Identificación
- **ID:** PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01
- **Título:** Migrar completion y signature help a proyecciones comunes
- **Estado:** Open
- **Prioridad:** P1
- **Orden recomendado:** 07
- **Área:** Arquitectura, Consumers

## 2. Objetivo
Adaptar `completion` y `signature help` para que operen como proyecciones de `SemanticQueryResult` sin perder sus capacidades únicas (ranking, completion resolve, overloads fallback).

## 3. Principios de Diseño
1. **Resolve Lazy:** Completion no debe abultar su payload inicial con descripciones y firmas completas. Utilizar la projection de la facade en `resolve` para enriquecer la firma.
2. **Target Coincidente:** Completion y Signature Help deben mostrar selecciones provenientes del mismo pool de candidates semánticos usados por Hover.

## 4. Alcance y Tareas
1. **Redactar Spec:** Generar este documento de lineamientos.
2. **Proyección Segura:** Usar el `SemanticQueryResult` de la FASE 5 (Query Contract) como input de `completion` y `signatureHelp`.
3. **Pruebas y Fallbacks:** Confirmar la tolerancia a overloads en parameters, garantizando degradación a confidence más baja.

## 5. Criterios de Aceptación
- Completions y Signatures comparten el target selection logic de la facade.
- Degradación coherente en baja confidence.
- Mantenimiento del performance budget.

## 6. Documentación afectada
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`

## 7. Notas de Dependencia
Depende de `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` y `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
