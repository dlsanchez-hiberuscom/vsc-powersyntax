# Plan — Spec 388 / B327

## Enfoque

1. Empezar por property paths con demanda observable en corpus/tests (`DataWindow.Syntax`) sobre el catálogo `datawindow-properties` ya abierto en B320.
2. Mantener `dataWindowPropertyPaths.ts` como consumer dueño del comportamiento de `Describe/Modify/Object`, pero alimentado por catálogo y no por strings dispersas.
3. Abrir `datawindow-constants` sólo cuando haya una fuente oficial/curada verificable y un consumer claro que pueda falsar la slice.

## Riesgos

- seguir ampliando listas locales dentro del provider en lugar del catálogo;
- poblar `datawindow-constants` sin evidence suficiente o sin consumer real;
- mezclar property paths DataWindow con lookup PowerScript global.

## Mitigaciones

- cada slice debe empezar por catálogo y validarse en `SystemCatalog` antes de tocar el consumer;
- elegir property paths ya presentes en corpus/tests para evitar invención;
- mantener definition/hover/completion limitados al contexto DataWindow ya defendido por `DataWindowModel` y bindings literales.