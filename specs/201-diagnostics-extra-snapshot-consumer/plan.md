# Plan - Spec 201 Diagnostics extra snapshot consumer (B151A)

## 1. Resumen tecnico

Hacer snapshot-first la ruta de `runExtraDiagnostics()` para que los diagnosticos SD11/SD12/SD13 consuman `scopes` y texto enmascarado desde el snapshot publicado.

## 2. Estado actual

- `diagnosticsExtra` seguia leyendo `scopes` y `strippedLines` desde `DocumentAnalysis`.
- El snapshot ya publicaba esa informacion en una forma estable y reusable.

## 3. Diseno propuesto

- Consumir `snapshot.scopes` en `runExtraDiagnostics()`.
- Consumir `snapshot.maskedText.lines` para SD11/SD12/SD13.
- Mantener intactas las heuristicas del modulo.

## 4. Impacto en el runtime

- Reduce otra frontera verificable de `B151A` dentro de diagnosticos.
- Mantiene el comportamiento visible de los diagnosticos extra.

## 5. Riesgos tecnicos

- Cambiar el resultado visible de SD11/SD12/SD13.
- Mantener una fuente paralela para scopes o texto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/diagnosticsExtra"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`