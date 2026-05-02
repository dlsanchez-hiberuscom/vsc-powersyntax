# Plan - Spec 250 Ancestros nativos PowerBuilder (B225)

## 1. Enfoque tecnico

Extender el catalogo compartido antes de tocar consumidores. Los consumers deben preguntar al mismo servicio y no recrear listas locales.

Estado final: completado con un backbone compartido de ancestros nativos del runtime reutilizado por `SystemCatalog` e `InheritanceGraph`.

## 2. Pasos

1. Identificar gaps reales en tests/corpus.
2. Ampliar dataset/indice del system catalog.
3. Conectar consumidores existentes solo si ya usan el servicio compartido.
4. Anadir tests positivos/negativos.

Resultado: los gaps reales se concentraban en raices runtime como `powerobject`/`throwable` y en la prolongacion de la cadena nativa cuando la KB terminaba en `window` o en un owner type del runtime.

## 3. Riesgos

- ocultar errores reales marcando tipos desconocidos como sistema;
- duplicar aliases en diagnostics o hierarchy.

## 4. Validacion

- tests unitarios del catalogo y consumers semanticos afectados.

Validacion ejecutada:

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/systemCatalog.test.js out/test/server/unit/inheritanceGraph.test.js out/test/server/unit/hierarchyInspection.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/diagnostics.test.js`
- `npx mocha --ui tdd out/test/server/unit/impactAnalysis.test.js`
