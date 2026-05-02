# Tareas: Spec 008 — Ayuda de firmas (Signature Help)

**Estado histórico:** cerrada y normalizada por B233.

## 1. Indexador y Estructura (B028)

- [x] **T1.** Actualizar `Entity` y `SymbolFact` en `src/server/knowledge/types.ts` y `src/server/model/types.ts` para incluir un array de `parameters`.
- [x] **T2.** Modificar `src/server/analysis/documentAnalysis.ts` para extraer y poblar `parameters` al parsear funciones y eventos.

## 2. Integración de `signatureHelpProvider` (B028)

- [x] **T3.** Registrar `signatureHelpProvider` en `src/server/server.ts` para que se dispare con los caracteres `(` y `,`.
- [x] **T4.** Crear el manejador `onSignatureHelp` en `src/server/server.ts` y conectarlo con `connection.onSignatureHelp`.
- [x] **T5.** Enlazar el request de signature help con la `KnowledgeBase` y el `semanticQueryService`.

## 3. Resolución Semántica de Firmas

- [x] **T6.** Asegurar que `semanticQueryService` o un nuevo módulo de firmas pueda identificar en qué llamada a función estamos situados considerando la posición del cursor, analizando el AST/Lexer local hacia atrás.
- [x] **T7.** Extraer los parámetros formales y tipos de retorno usando el catálogo base o la propiedad `parameters` de la `Entity`.
- [x] **T8.** Formatear los datos como `SignatureInformation` y `ParameterInformation` respetando el formato LSP.

## 4. Seguimiento de Parámetro Activo (Active Parameter)

- [x] **T9.** Calcular qué parámetro de la firma corresponde a la posición actual del cursor contando las comas `,` dentro del nivel de paréntesis actual.
- [x] **T10.** Establecer correctamente `activeSignature` y `activeParameter` en la respuesta de LSP para que VS Code resalte el parámetro correcto.

## 5. Validación y Pruebas

- [x] **T11.** Crear tests unitarios en `test/server/unit/signatureHelp.test.ts`.
- [x] **T12.** Compilar y pasar la suite de pruebas (`npm run test:unit`).
