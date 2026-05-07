# Spec: PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01
- **Título:** Anchors SQL y Binding Transaccional Extendido
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Semántica, SQL Embebido

## 2. Objetivo
Endurecer el soporte del binding transaccional, en particular permitiendo que los descendientes del objeto system `Transaction` se reconozcan como transacciones válidas, sin introducir un parser SQL completo de nivel AST que arruine el Hot Path.

## 3. Decisiones y Detalles de Implementación

### 3.1 Soporte para Descendientes de Transaction
Anteriormente, el parser se limitaba a reconocer el término duro `transaction`. Se ha modificado `classifyTransactionBinding` en `src/server/features/diagnostics.ts` para recibir y aprovechar el `InheritanceGraph` global. Ahora, cualquier objeto inyectado en `SetTransObject` que cuente con `transaction` dentro de su cadena de herencia o `ownerTypes` (e.g. `n_tr_desc`, derivado de `n_tr`) será clasificado con estado `'known'`, silenciando falsos positivos en bases de código modulares como las librerías PFC.

### 3.2 SQL Embebido Anclado (Anchors)
El módulo `embeddedSqlAnchors.ts` utiliza regiones de escaneo (`findSqlRegions`) y delimitadores fiables como `CONNECT USING` o referencias `SQLCA` para generar un nivel de `confidence` sobre la transacción en uso en el documento, reportándolo al `ApiEmbeddedSqlAnchor`. Esto proyecta la información transaccional global en el Contexto del Objeto.

### 3.3 Ausencia de Parser SQL Profundo
- **Decisión:** La validación de *Host Variables* sintácticas (variables precedidas por `:`) dentro de cursores u órdenes `SELECT INTO` se captura para decorado, pero NO se resuelve en profundidad contra el modelo de Base de Datos.
- **Razón:** Integrar un AST de SQL nativo es inabarcable bajo la meta de "0 delay" de la etapa LSP.

## 4. Criterios de Aceptación Cumplidos
- El binding transaccional detecta descendientes reales de `Transaction`.
- Excepciones eliminadas para esquemas customizados de transacciones (ej. de uso en subventanas o *n_cst_dwsrv*).
- Se reutilizan los anchors léxicos por documento sin desencadenar parseo pesado extra.
