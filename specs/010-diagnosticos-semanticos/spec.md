# [010] Diagnósticos Semánticos Iniciales

## 1. Resumen

Implementar la primera capa de diagnósticos semánticos del plugin, detectando en tiempo real errores que requieren resolución de tipos y miembros: variables no declaradas, tipos inexistentes, y llamadas a funciones/eventos que no existen en la jerarquía del objeto. Esto eleva la utilidad del plugin más allá de los diagnósticos puramente estructurales (bloques abiertos/cerrados) que ya existen.

## 2. Problema

Actualmente el plugin solo detecta errores estructurales (bloques no cerrados, secciones mal formadas). Si un desarrollador escribe `ls_name = this.of_GetNaem()` (con un typo en el nombre de la función), el plugin no emite ningún diagnóstico. Tampoco detecta variables no declaradas ni tipos base inexistentes. Esto limita significativamente el valor profesional del plugin en edición diaria.

## 3. Objetivo

Proporcionar diagnósticos semánticos que:
- detecten variables no declaradas dentro de funciones/eventos,
- detecten llamadas a funciones/eventos que no existen en la jerarquía del objeto,
- detecten tipos base (`from`) inexistentes en la KnowledgeBase,
- se integren con el sistema de diagnósticos existente (scheduling, debounce),
- mantengan la latencia controlable en el archivo activo.

## 4. Usuarios / actores

- Desarrollador PowerBuilder que edita código en VS Code y espera feedback inmediato sobre errores semánticos.

## 5. Alcance

Lo que entra en este slice:

- **SD1**: Detección de variables no declaradas dentro de funciones/eventos (no están en el scope local, ni en variables de instancia, ni en la KnowledgeBase). **Diferida**: posponemos su emisión hasta disponer de resolución fuerte (Fase 7A) que minimice falsos positivos sobre globales y miembros heredados; el pipeline soporta su incorporación sin cambios estructurales.
- **SD2**: Detección de llamadas a funciones/subroutines/eventos inexistentes en la jerarquía del objeto actual (usando InheritanceGraph.getMembers + SystemCatalog).
- **SD3**: Detección de tipos base inexistentes (`type w_main from nonexistent_type`).
- **SD4**: Detección de variables locales no usadas dentro de funciones/eventos.
- **SD5**: Detección de variables de instancia privadas no usadas en el objeto.
- **SD6**: Integración con el pipeline de diagnósticos existente (`validateStructure` + nueva `validateSemantics`).
- **SD7**: Tests unitarios para cada regla de diagnóstico.

## 6. Fuera de alcance

Lo que **no** entra en este slice:

- inferencia de tipos completa,
- detección de tipos de retorno incorrectos,
- detección de shadowing (→ B035),
- diagnósticos sobre expresiones complejas (e.g., `dw_1.Object.DataWindow`),
- diagnósticos de DataWindow,
- owner resolution para llamadas cualificadas más allá de `this.` y `super.`,
- code actions de corrección automática (→ B036).

## 7. Requisitos

- **R1**: Las variables a validar se extraen del scope actual (KnowledgeBase.getScopeAt) y de las variables de instancia del objeto.
- **R2**: Las funciones/eventos se validan contra InheritanceGraph.getMembers + SystemCatalog.findFunction.
- **R3**: Los tipos base se validan contra KnowledgeBase.findDefinition + SystemCatalog (tipos built-in).
- **R4**: Los diagnósticos semánticos se publican junto con los estructurales, no los reemplazan.
- **R5**: La severidad debe ser `Warning` (no `Error`) mientras la resolución no sea 100% fiable — para evitar falsos positivos agresivos.
- **R6**: Se deben excluir de validación las líneas dentro de secciones `forward`, `prototypes` y `variables` (ya declarativas).
- **R7**: Se debe respetar el presupuesto de latencia del archivo activo (< 50ms para diagnósticos).
- **R8**: Para variables locales no usadas, se rastrea cada declaración en el scope y se busca si el nombre aparece en alguna línea posterior del mismo scope (excluyendo la propia declaración).
- **R9**: Para variables de instancia privadas no usadas, se busca si el nombre aparece en algún scope de función/evento del mismo archivo.

## 8. Criterios de aceptación

- **AC1**: Al escribir una variable no declarada dentro de un evento/función, aparece un diagnóstico Warning indicando que la variable no está declarada.
- **AC2**: Al escribir `this.of_NonExistentFunction()`, aparece un diagnóstico Warning indicando que la función no existe en la jerarquía.
- **AC3**: Al definir `type w_main from nonexistent_type`, aparece un diagnóstico Warning indicando que el tipo base no se encuentra.
- **AC4**: Los diagnósticos semánticos no generan falsos positivos sobre variables de parámetros de la función/evento.
- **AC5**: Los diagnósticos se publican con debounce (scheduling existente).
- **AC6**: Al declarar una variable local que no se usa en el cuerpo de la función/evento, aparece un diagnóstico Hint indicando que no se usa.
- **AC7**: Al declarar una variable de instancia `private` que no se referencia en ningún método/evento del archivo, aparece un diagnóstico Hint.
- **AC8**: Existen tests unitarios para cada regla de diagnóstico.
- **AC9**: La latencia total de diagnósticos (estructurales + semánticos) no supera 50ms en un archivo típico.

## 9. Riesgos / dudas abiertas

- **Riesgo 1**: Falsos positivos por resolución incompleta. Mitigación: usar severidad Warning y excluir patrones donde la resolución no es segura (ej: variables globales no en scope, expresiones complejas).
- **Riesgo 2**: Coste de rendimiento al escanear la KB por cada línea. Mitigación: validar solo identificadores que parezcan llamadas o asignaciones, no cada token.
- **Riesgo 3**: Keywords del lenguaje confundidas con variables no declaradas. Mitigación: mantener una lista de keywords conocidas (o delegar al SystemCatalog) para excluirlas.
- **Duda 1**: ¿Validar sólo en funciones/eventos implementados, o también en el cuerpo principal del archivo? → Propuesta: solo dentro de scopes Function/Event para esta fase.
