# Spec 050 — CodeLens references (B066)

## Motivación
Insertar CodeLens "N referencias" sobre cada función/evento del
documento usando el `references` ya implementado.

## Alcance
- `src/server/features/codeLensReferences.ts`:
  - `provideReferenceCodeLenses(symbols, countByName)` retorna `CodeLens[]`.
  - Acepta lista de pares `{name, range}` y un mapa `name → count`.
  - Devuelve un CodeLens por símbolo con título `"N referencias"`.

## Criterios
1. count = 0 → `"sin referencias"`.
2. count = 1 → `"1 referencia"`.
3. count > 1 → `"N referencias"`.
