# Tasks - Spec 258 sourceOrigin contextual en análisis documental (B229)

## 1. Preparacion

- [x] T1. Localizar el punto real donde `documentAnalysis` sellaba `sourceOrigin` solo por URI.
- [x] T2. Confirmar que el flujo interactivo pasaba por `analysisCache` y no solo por watcher/indexador.

## 2. Implementacion

- [x] T3. Añadir `sourceOrigin` contextual opcional a `documentAnalysis`.
- [x] T4. Hacer `analysisCache` sensible a cambios de provenance contextual.
- [x] T5. Propagar `sourceOrigin` desde `WorkspaceState` en watcher e indexador.
- [x] T6. Rematerializar snapshots cuando un cambio topológico altere `sourceOrigin`.

## 3. Validacion

- [x] T7. Añadir tests focales de análisis, caché y watcher.
- [x] T8. Ejecutar compilación y mocha estrecho sobre `sourceOrigin`, manifest y golden semántico.

## 4. Documentacion

- [x] T9. Actualizar docs canónicas y mover `B229` a cierre antes de abrir `B226`.