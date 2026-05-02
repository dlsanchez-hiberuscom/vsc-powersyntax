# Plan - Spec 251 Corpus enterprise OrderEntry baseline (B226)

## 1. Enfoque tecnico

Extender el baseline existente de forma opt-in/local. El corpus vive en `fixtures-local` y las pruebas deben saltarse limpiamente si no existe.

## 2. Pasos

1. Revisar helpers actuales de OrderEntry.
2. Anadir smoke/semantics pequenos sobre objetos representativos.
3. Medir routing/sourceOrigin/readiness en escenarios parciales.
4. Actualizar docs y resultados si se regeneran baselines.

## 3. Riesgos

- fragilidad por rutas locales;
- tratar archivos de deploy o recursos como source;
- hacer la suite diaria dependiente de corpus privado/local.

## 4. Validacion

- performance OrderEntry;
- tests con skip si falta corpus.
