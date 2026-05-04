# Plan — Spec 387 / B320

## Enfoque

1. Abrir primero `datawindow-properties` con el subconjunto ya probado en completion/hover/definition/diagnostics.
2. Reusar `manual-core` y los índices del `SystemCatalog` en vez de crear un registry paralelo.
3. Reconsumir después ese catálogo desde `dataWindowPropertyPaths.ts` y ampliar el dominio `datawindow-expression-functions` en slices siguientes.

## Riesgos

- mezclar propiedades DataWindow con símbolos PowerScript generales;
- mover consumers antes de que el catálogo mínimo quede indexado y validado;
- inventar funciones de expresión no verificadas por el repo o la fuente oficial.

## Mitigaciones

- empezar por el subconjunto ya fijado por tests y hardcodes actuales;
- validar primero presencia/indexado en `SystemCatalog`;
- dejar `datawindow-expression-functions` para la siguiente slice si la fuente oficial no está todavía materializada en el repo.