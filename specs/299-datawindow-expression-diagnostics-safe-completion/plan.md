# Plan - Spec 299 datawindow expression diagnostics safe completion (B254)

## 1. Enfoque técnico

Reutilizar `dataWindowPropertyPaths` como owning abstraction del slice. Completion debe entrar por una excepción segura al guard de strings solo cuando exista contexto DataWindow reconocible, y diagnostics debe colgar del mismo resolver con heurísticas conservadoras para rutas completas.

## 2. Pasos

1. Añadir un test semilla de completion dentro de `Modify("state_id.")` para confirmar el gap real.
2. Exponer completion segura desde `dataWindowPropertyPaths` y consumirla antes del guard de strings en `completion`.
3. Exponer inspección read-only del path y reutilizarla en `diagnostics` para warnings conservadores.
4. Fijar el contrato en unit y golden, y estabilizar suites con URIs repetidas.
5. Alinear documentación viva y mover el foco a `B255`.

## 3. Riesgos

- abrir completion dentro de strings arbitrarios fuera de contexto DataWindow;
- emitir falsos positivos de diagnostics cuando el binding raíz sea dinámico o ambiguo;
- degradar la estabilidad de la suite por contaminación del `analysisCache` en tests con URIs repetidas.

## 4. Validación

- `npm run build:test`
- unit focal sobre completion, diagnostics y golden DataWindow
- barrido estrecho sobre completion/diagnostics/hover/definition/golden DataWindow

## 5. Resultado ejecutado

1. Completion DataWindow entra solo en contexto defendible.
2. Diagnostics avisa de rutas completas no resolubles sin inventar warnings sobre roots no confiables.
3. El foco canónico del repo pasa a `B255`.