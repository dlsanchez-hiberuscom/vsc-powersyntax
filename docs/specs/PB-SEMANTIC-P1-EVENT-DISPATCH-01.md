# Spec: PB-SEMANTIC-P1-EVENT-DISPATCH-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-EVENT-DISPATCH-01
- **Título:** Dispatch explícito de EVENT, TriggerEvent, PostEvent y ancestor calls especiales
- **Estado:** Open
- **Prioridad:** P1
- **Orden recomendado:** 10
- **Área:** Semántica, Eventos

## 2. Objetivo
Decidir y formalizar el nivel de soporte estructural y advertencias para los operadores y rutinas de *Event Dispatch* (como el keyword `EVENT`, funciones dinámicas `DYNAMIC`, `TriggerEvent`, `PostEvent`, y pseudovariables heredadas como `AncestorReturnValue`).

## 3. Principios de Diseño
1. **Evidencia Oficial Requerida:** Todo dispatch soportado en el engine debe reflejar el comportamiento real del compilador oficial de Appeon. Casos donde la mecánica no está públicamente confirmada se asientan como "Needs official confirmation" y no intentan deducir la ejecución en cascada de eventos.
2. **Contención Dinámica:** Invocaciones `DYNAMIC` y accesos en cadena con strings (como `TriggerEvent(This, "ue_action")`) degradan limpiamente. Si se analiza literal string, se debe proveer el target pero la 'confidence' se capará.

## 4. Alcance y Tareas
1. **Redactar Spec:** Este documento formaliza el contrato.
2. **Definir Matriz de Dispatch:** Mapear en `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` qué eventos se ligan por string-literal match y cuáles usan el árbol real de herencia.
3. **Manejo de Keywords Antiguos:** Oficializar el soporte (o degradación) al uso explícito de la palabra reservada `EVENT` para invocaciones.

## 5. Criterios de Aceptación
- Existe matriz de degradación y soporte para `EVENT`, `TriggerEvent`, `PostEvent`, `DYNAMIC` y `AncestorReturnValue`.
- Definition y References no mienten ni sobreprometen soporte cuando interactúan con dispatching dinámico.
- Completions contextualizan debidamente el uso de `EVENT`.

## 6. Documentación afectada
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-status.md`
- `docs/testing.md`

## 7. Notas de Dependencia
Depende de `PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01` en lo relativo al tratamiento especial de qualificadores base (parent, super).
