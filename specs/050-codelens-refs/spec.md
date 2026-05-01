# Spec 050 — CodeLens references (B066)

## Motivación
Insertar CodeLens "N referencias" sobre cada función/evento del
documento usando el `references` ya implementado.

## Alcance
- `src/server/features/codeLensReferences.ts`:
  - `provideReferenceCodeLenses(symbols, countByKey)` retorna `CodeLens[]`.
  - Acepta lista de símbolos enriquecidos con `key`, metadata opcional de `override` y estado degradado.
  - Devuelve un CodeLens por símbolo con título de referencias y jerarquía cuando aplica.
- `src/server/server.ts`:
  - calcula conteos por símbolo usando el motor compartido de `references`;
  - consume `member closures` para enriquecer overrides/herencia;
  - cachea resultados por documento/epoch;
  - degrada la lens cuando `references` no está lista.

## Criterios
1. count = 0 → `"sin referencias"`.
2. count = 1 → `"1 referencia"`.
3. count > 1 → `"N referencias"`.
4. si el símbolo sobreescribe un ancestro, el título incluye `override`.
5. si hay descendientes que sobreescriben el símbolo, el título incluye `N overrides`.
6. si `references` no está lista, la lens no publica un comando engañoso.
