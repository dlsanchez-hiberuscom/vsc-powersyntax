# Spec: PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01
- **Título:** Slice Seguro Avanzado para DataWindows
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Semántica, DataWindows

## 2. Objetivo
Definir y documentar explícitamente los límites del "slice defendible" de características analizadas de DataWindow (particularmente los accesos anidados `Object`, matrices `Data` y métodos dinámicos como `Evaluate` y `SyntaxFromSQL`).

## 3. Decisiones y Detalles de Implementación

### 3.1 Degradación Honesta en Accesos Indexados
Las construcciones dinámicas como `Object.column[row]`, `Object.Data.Primary[row,col]` no forman parte del grafo de inferencia estricto, dado que PowerBuilder interpreta esto en runtime devolviendo un tipo `Any`. Para evitar falsos positivos estáticos (warnings infundados), la lógica actual de `shouldDiagnoseDataWindowPropertyPath` en `diagnostics.ts` excluye deliberadamente el escaneo de estas rutas complejas. Se degradan silenciosamente, operando con confianza `medium` o cayendo fuera del motor semántico.

### 3.2 Evaluate y SyntaxFromSQL
`SyntaxFromSQL -> Create` permite generar la definición completa de un DataWindow dinámicamente desde un string SQL que no se materializa hasta su ejecución. Realizar un chequeo estático sobre las columnas de estos DataWindows supera el "performance budget" interactivo del IDE. 
- **Decisión:** Estas funciones se detectan por el sistema base (`SystemCatalog`), pero sus efectos de mutación sobre la instancia del DataWindow subyacente (`Create()`) se ignoran en análisis estático avanzado de campos.

### 3.3 El Slice Seguro Definitivo
Se ha consolidado que el motor semántico de diagnóstico avanzará validaciones solo sobre:
1. Operaciones que afectan a `datawindow.table.select` y `datawindow.dataobject`.
2. Las cadenas vinculadas a `GetChild` (e.g., resolviendo `dddw.name`).
3. El `DataObject` explícitamente asignado y parseado (vía su `.srd` físico) y sus `RetrieveArguments`.

## 4. Criterios de Aceptación Cumplidos
- Límite fijado sobre `Object.Data` y cadenas indexadas: están excluidas explícitamente de la batería de warnings de diagnósticos estáticos.
- Se ha mantenido el presupuesto de rendimiento al no inyectar parsers de sintaxis PB-SQL dinámica dentro del Hot Path del LSP.
