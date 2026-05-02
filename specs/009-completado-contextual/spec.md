# Spec 009 — Completado Contextual Básico (B029)

## 1. Meta

- **Estado:** cerrada históricamente y normalizada por B233
- **Fase del roadmap:** Fase 6 (Diagnósticos y productividad semántica base)
- **Ticket/Backlog:** B029
- **Cierre histórico:** el completado contextual quedó implementado y más tarde fue refinado por specs de scoring y serving, pero la base ya estaba cerrada.

## 2. Contexto

Hasta ahora, VS Code ofrece sugerencias puramente textuales basadas en el buffer actual (Word Based Completions) o simples fragmentos estáticos de sintaxis (snippets).
Dado que ya contamos con un modelo semántico completo (`KnowledgeBase`, `Scopes`, `SystemCatalog` e `InheritanceGraph`), podemos evolucionar el autocompletado para que sea *Context-Aware*.

## 3. Requisitos (Scope)

1. **Activación de LSP:**
   - Habilitar `completionProvider` en el `server.ts` con caracteres desencadenantes (e.g. `.`).
2. **Identificación de Contexto de Completado:**
   - Determinar qué estamos completando analizando la línea actual hacia atrás.
   - Si no hay un `qualifier` (e.g. sólo el inicio de una palabra), sugerir:
     - Variables locales del `Scope` actual.
     - Miembros (variables, funciones, eventos) del propio objeto (`this`).
     - Funciones Globales del `SystemCatalog` o `KnowledgeBase`.
   - Si hay un `qualifier` (e.g. `this.`, `super.`, `dw_1.`, `ls_texto.`):
     - Usar `semanticQueryService` para resolver el tipo base de ese calificador.
     - Sugerir exclusivamente los miembros de ese tipo (resolviendo herencia).
3. **Formateo Visual:**
   - Devolver objetos `CompletionItem` con el `CompletionItemKind` adecuado (Method, Variable, Event, etc.).
   - Incluir la `documentation` y el `detail` extraídos de las entidades semánticas o del catálogo del sistema.

## 4. Fuera de Alcance (Out of Scope)

- Completado avanzado de expresiones DataWindow (cadenas de texto dentro de `Describe`/`Modify`).
- Inferencia de tipos compleja que dependa de inferencia en cascada no declarada (e.g. cuando falta la declaración local o el tipo no está soportado).
- Code Snippets dinámicos avanzados que reconstruyan el control de flujo; el foco es sobre miembros y símbolos semánticos.

## 5. Criterios de Éxito

- Al escribir `this.`, el editor debe desplegar únicamente las funciones, eventos y variables de instancia del objeto actual.
- Al escribir `super.`, debe mostrar los miembros del ancestro.
- Al empezar a escribir en una nueva línea sin cualificador, las variables declaradas localmente deben aparecer como las primeras sugerencias.
- Las respuestas de completado deben resolverse en menos de 100ms para mantener la fluidez interactiva en VS Code.
