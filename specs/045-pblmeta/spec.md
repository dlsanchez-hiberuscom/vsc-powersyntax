# Spec 045 — .pblmeta parser (B131)

## Motivación
Los `.pblmeta` describen contenido de PBL exportado. Soporte mínimo
para listar objetos y comentarios.

## Alcance
- `src/server/workspace/pblmeta.ts`:
  - `parsePblMeta(content): PblMetaEntry[]` — `{name, type, comment?}`.
- Tests sobre fixture sintético.

## Criterios
1. Detecta líneas `<name>.<type>` (sru/srw/...).
2. Soporta comentarios `;`.
3. Ignora líneas vacías.
