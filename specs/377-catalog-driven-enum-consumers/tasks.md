# Tasks — Spec 377

## Estado

- done

## Tasks

- [x] Hacer que los identificadores con sufijo `!` conserven el valor completo para consumers basados en catálogo.
- [x] Reutilizar un helper compartido de contexto enumerado en hover, completion, signatureHelp y diagnostics.
- [x] Completar `allowedInParameters` para enums manual-core usados en rutas visibles del lenguaje.
- [x] Clasificar valores enumerados catalogados con `!` como `enumMember` en semantic tokens.
- [x] Añadir cobertura unitaria y cross-surface para hover, completion, signatureHelp, semantic tokens y diagnostics.

## Riesgos residuales registrados

- El slice depende de que `SystemCatalog` siga siendo la única fuente de verdad para miembros enumerados; no debe reintroducir listas paralelas por feature.
- La validación conserva un enfoque conservador: cuando el tipo esperado no es inequívoco, los consumers deben degradar con seguridad en lugar de inferir membresía agresiva.