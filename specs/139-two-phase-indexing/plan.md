# Plan — Spec 139 Two-Phase Indexing (B152)

## 1. Resumen tecnico

La base tecnica principal es src/server/indexer/workspaceIndexer.ts, con apoyo de src/server/analysis/documentAnalysis.ts, la capa parsing y src/server/workspace/readiness.ts.

## 2. Estado actual

- workspaceIndexer ya organiza parte del trabajo de indexacion.
- readiness existe, pero no expresa aun una frontera formal entre estructura y enriquecimiento.
- Features como hover, completion o diagnostics pueden beneficiarse de una degradacion segura por fase.

## 3. Diseno propuesto

- Hacer que el indexador programe primero structuralPass y despues enrichedPass.
- Publicar readiness local por fase y readiness agregado del contexto activo.
- Reutilizar el snapshot documental como entrada unica entre ambas fases.
- Permitir que determinadas features consuman la fase estructural cuando aun no hay enriquecimiento completo.

## 4. Impacto en rendimiento

- Positivo en tiempo hasta valor percibido.
- Riesgo bajo de overhead organizativo si la separacion es demasiado fina.

## 5. Riesgos tecnicos

- Mezclar artefactos de las dos fases en una misma publicacion.
- No definir bien que features pueden degradar con seguridad.
- Duplicar trabajo entre passes.

## 6. Estrategia de validacion

- Tests del indexador con structuralPass y enrichedPass.
- Tests de readinessByPass.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md si el criterio de salida de Fase A se afina con este modelo