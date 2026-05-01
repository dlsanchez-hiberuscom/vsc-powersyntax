# Plan - Spec 199 Completion masked text snapshot consumer (B151A)

## 1. Resumen tecnico

Hacer que `completion` lea el contexto textual inmediato desde `snapshot.maskedText` en lugar de depender de `DocumentAnalysis` directo.

## 2. Estado actual

- Tras `Spec 198`, `documentSymbols` ya habia dejado de depender de `DocumentAnalysis` como fuente primaria.
- `completion` seguia leyendo `strippedLines` y `masks` desde esa estructura.

## 3. Diseno propuesto

- Leer la linea activa desde `snapshot.maskedText.lines`.
- Leer la mascara de comentarios y strings desde `snapshot.maskedText.masks`.
- Mantener intacto el ranking y la resolucion semantica.

## 4. Impacto en el runtime

- Reduce otra dependencia residual de `B151A`.
- Mantiene el comportamiento visible de completion.

## 5. Riesgos tecnicos

- Romper offsets o bloqueo en comentarios/strings.
- Cambiar por error ranking o contenido de sugerencias.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/completion"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`