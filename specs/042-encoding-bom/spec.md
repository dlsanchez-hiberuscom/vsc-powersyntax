# Spec 042 — Encoding UTF-8 BOM (B130)

## 1. Motivación

Los archivos `.sr*` exportados desde PB pueden traer BOM UTF-8.
Necesitamos un helper canónico para retirar BOM y ahorrar parches en
cada lector.

## 2. Alcance

- `src/server/system/encoding.ts`:
  - `stripBom(text: string): string`
  - `bytesToText(buf: Buffer): string` (UTF-8 + strip BOM).
- Tests.

## 3. Criterios de aceptación

1. stripBom retira `\uFEFF` solo cuando es el primer carácter.
2. bytesToText decodifica UTF-8 sin BOM.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B130).
