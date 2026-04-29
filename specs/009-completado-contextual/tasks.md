# Tareas: Spec 009 — Completado Contextual (B029)

## 1. Integración en `server.ts`

- [x] **T1.** Añadir `completionProvider: { triggerCharacters: ['.'] }` (y quizás `resolveProvider: true` si se carga documentación de manera diferida) en las capabilities del `server.ts`.
- [x] **T2.** Añadir `connection.onCompletion` despachándolo a través del `TaskScheduler` (Interactive).
- [x] **T3.** Enlazarlo a un nuevo módulo `src/server/features/completion.ts`.

## 2. Extracción de Contexto y Resolución

- [x] **T4.** Implementar lógica en `completion.ts` para extraer el prefijo o cualificador antes del cursor (ej. `ls_nombre.`, `super.`, o simplemente `of_`).
- [x] **T5.** Utilizar la `KnowledgeBase` para obtener el `Scope` local y sugerir variables locales si no hay cualificador.
- [x] **T6.** Reutilizar o ampliar `semanticQueryService` para listar miembros (`getMembers`) cuando exista un cualificador claro (ej. resolviendo la variable a su tipo de dato y buscando en el `InheritanceGraph`).
- [x] **T7.** Combinar resultados locales con funciones integradas del `SystemCatalog` cuando proceda.

## 3. Formateo y Mapeo LSP

- [x] **T8.** Mapear las `Entity` y `PbSystemSymbolEntry` encontradas a `CompletionItem` de LSP.
- [x] **T9.** Asignar correctamente `CompletionItemKind` (Variable, Method, Event, Class) y añadir `insertText` y `documentation`.

## 4. Pruebas y Validación

- [x] **T10.** Escribir `test/server/unit/completion.test.ts` verificando:
  - Sugerencias locales (variables del Scope).
  - Sugerencias con `this.` y `super.`.
  - Sugerencias con cualificadores de variables (`n_cst_math calc; calc.|`).
- [x] **T11.** Comprobar rendimiento para asegurar sugerencias casi instantáneas (`npm run test:unit`).
