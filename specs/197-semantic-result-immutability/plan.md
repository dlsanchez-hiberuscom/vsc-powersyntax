# Plan - Spec 197 Semantic result immutability (B174)

## 1. Resumen tecnico

Blindar las lecturas y escrituras publicas de `KnowledgeBase`, `DocumentCache` y `HotContextCache` con copias defensivas para evitar mutacion accidental desde consumers.

## 2. Estado actual

- `Specs 159-160` ya habian endurecido export/restore y parte del payload persistente.
- Seguian existiendo lecturas vivas en memoria en caches y readers publicados.

## 3. Diseno propuesto

- Aplicar copias defensivas al entrar y salir de `KnowledgeBase`.
- Aplicar copias defensivas al entrar y salir de `DocumentCache`.
- Aplicar copias defensivas al entrar y salir de `HotContextCache`.

## 4. Impacto en el runtime

- Cierra `B174` en los boundaries internos relevantes.
- Refuerza seguridad interna a costa de un coste de copia controlado.

## 5. Riesgos tecnicos

- Dejar un boundary sin copiar y mantener contaminacion del estado publicado.
- Introducir sobrecoste innecesario fuera del boundary minimo.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/(knowledge|HotContextCache)"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`