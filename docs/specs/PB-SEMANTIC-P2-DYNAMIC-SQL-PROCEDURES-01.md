# Spec: PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01 y PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01 (Absorbe PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01)
- **Título:** Alcance de Host Variables, Dynamic SQL y Stored Procedures
- **Estado:** Done
- **Prioridad:** P2
- **Área:** Semántica, SQL Embebido

## 2. Objetivo
Determinar, limitar y documentar de manera explícita el alcance de la cobertura semántica para variables anfitrionas (Host Variables), SQL Dinámico avanzado (Formatos 2, 3 y 4) y los Stored Procedures dentro del código PowerScript. El objetivo es proporcionar un submodelo fiable sin arruinar el performance.

## 3. Decisiones y Detalles de Implementación

### 3.1 Host Variables e Indicator Variables
- **Decisión:** Mantenido como **Heurístico / Detección Visual (Boundary)**.
- **Razón:** Realizar validación de tipos cruzando PowerScript con la base de datos requiere una conexión en vivo y un parser SQL completo, lo que destruiría la meta de "0-delay" interactivo.
- **Estado Actual:** El lexer las marca para syntax highlighting (`:ls_sql`, `:ll_id:ll_ind`), pero el analizador semántico de diagnósticos no emite advertencias si los tipos no coinciden con la BD o si la variable anfitriona no existe en el scope del código.

### 3.2 Dynamic SQL (Formatos 2, 3 y 4)
- **Decisión:** **Heurístico / Needs official confirmation**.
- **Razón:** El uso de descriptores dinámicos (`SQLDA`), `PREPARE`, `DESCRIBE` y ejecución `EXECUTE DYNAMIC` son analizados puramente como identificadores string por `dynamicStringReferences.ts`.
- **Estado Actual:** Se proveen *CodeLenses* de string literal para su fácil localización en búsqueda cruzada, pero no hay validación de seguridad (ej. inyección SQL) ni comprobación de consistencia semántica contra las columnas.

### 3.3 Procedimientos Almacenados (DECLARE PROCEDURE)
- **Decisión:** Mantenido como **Heurístico**.
- **Razón:** La instrucción `DECLARE ... PROCEDURE FOR ...` es procesada como una región de `embeddedSqlAnchors.ts`, obteniendo *confidence* según la transacción ligada, pero su contenido (los argumentos del SP) no recibe chequeos paramétricos ni firmas de hover del LS.

## 4. Criterios de Aceptación Cumplidos
- La arquitectura renuncia explícitamente a validar el interior de los bloques de ejecución de SQL dinámico y Stored Procedures, considerándolos Cajas Negras (Black Boxes) desde el punto de vista del AST.
- La matriz de soporte es honesta, degradando la validación profunda y enfocándose solo en la identificación visual del *boundary*.
- Cumple con los *performance budgets* interactivos dictados.
