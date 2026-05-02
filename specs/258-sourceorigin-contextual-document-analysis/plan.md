# Plan - Spec 258 sourceOrigin contextual en análisis documental (B229)

## 1. Enfoque tecnico

Resolver `B229` en el slice mínimo que controla hoy el provenance documental: `documentAnalysis`, la caché interactiva y el watcher/indexador que publican snapshots en `KnowledgeBase`.

## 2. Pasos

1. Permitir que `documentAnalysis` reciba `sourceOrigin` contextual.
2. Hacer `analysisCache` sensible a cambios de provenance además de versión/fingerprint.
3. Propagar el valor contextual desde `WorkspaceState` en watcher e indexador.
4. Rematerializar snapshots cuando cambie `sourceOrigin` por topología sin tocar el archivo.
5. Validar con suites focales de análisis, caché y watcher, más regresión semántica/manifest.

## 3. Riesgos

- tratar `unknown` como valor autoritativo y bloquear el fallback contextual;
- duplicar reindexados cuando el mismo batch ya publicó un snapshot con el provenance correcto;
- dejar `KnowledgeBase` o `DocumentCache` con lineage obsoleto tras cambios topológicos.

## 4. Validacion

- unit test focal de `documentAnalysis` con provenance explícito;
- unit test de `analysisCache` para cambio de `sourceOrigin` sin cambio de versión;
- unit test de `watchedFileIntake` para rematerialización por cambio topológico;
- compilación completa y mocha estrecho con `sourceOrigin`, workspace, manifest y golden semántico.

## 5. Resultado ejecutado

1. `documentAnalysis` deja de fijar lineage solo por URI cuando el caller ya conoce un `sourceOrigin` mejor.
2. La caché interactiva reanaliza cuando cambia el provenance contextual aunque el documento no haya cambiado.
3. Watcher e indexador publican snapshots con provenance contextual y rematerializan los ya existentes si la topología cambia.
4. La validación focal queda verde con análisis, caché, watcher y regresión semántica relacionada.