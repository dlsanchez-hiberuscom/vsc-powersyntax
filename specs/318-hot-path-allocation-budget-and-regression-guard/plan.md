# Plan - Spec 318 hot path allocation budget and regression guard (B276)

## 1. Enfoque técnico

Partir del borde más falsable: localizar operaciones visibles de split/clonación/materialización dentro de hot path ya existente. La comprobación local mostró tres defectos concretos y baratos de corregir (`queryContext`, diagnostics de una línea y completion/referenceSourcePool), así que la estrategia útil fue reparar esos puntos y congelarlos con un guard estructural en vez de abrir un microbenchmark nuevo.

## 2. Pasos

1. Sustituir lecturas `document.getText().split(...)` por acceso a la línea activa.
2. Evitar clonaciones globales del catálogo del sistema y renormalizaciones redundantes del workspace.
3. Añadir un guard local/CI que inspeccione las features interactivas vigiladas.
4. Revalidar el carril focal `queryContext|completion|diagnostics|referenceSourcePool|references|definition|rename`.
5. Cerrar docs canónicas y mover el foco a `B270`.

## 3. Riesgos

- maquillar el problema con un benchmark frágil sin quitar las operaciones estructuralmente caras del código real;
- introducir un helper de línea incorrecto y romper las features que dependen de `queryContext` o diagnostics puntuales;
- añadir un guard que mire el árbol compilado equivocado o no lea los fuentes reales del repo.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/definition.test.js out/test/server/unit/rename.test.js out/test/server/unit/hotPathAllocationBudget.test.js`

## 5. Resultado ejecutado

1. `documentLineText.ts` fija el acceso por línea activa y `queryContext`/diagnostics dejan de partir todo el documento.
2. completion y `referenceSourcePool` dejan de clonar estructuras globales evitables.
3. `hotPathAllocationBudget.test.ts` deja el guard integrado y backlog/focus/roadmap/done-log mueven el foco a `B270`.