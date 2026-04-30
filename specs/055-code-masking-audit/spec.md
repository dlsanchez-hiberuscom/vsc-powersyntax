# Spec 055 — Code masking audit (B138)

## Motivación
Asegurar que todo consumidor que escanea identificadores pasa por
`maskDocument` (o regex robustas) y no usa `content` crudo para tokens
sensibles a strings/comments.

## Alcance
- `test/server/unit/codeMaskingAudit.test.ts`:
  - Detecta uso de `content.match(...)` / `content.replace(...)` con
    patrones de identificadores en `src/server/features/**/*.ts` y
    `src/server/parsing/**/*.ts` que no estén ya basados en `mask`.
  - Lista archivos sospechosos; falla si excede whitelist conocida.

## Criterios
1. La whitelist contiene archivos que sí justifican `content` crudo.
2. Cualquier archivo nuevo fuera de whitelist hace fallar el test.
