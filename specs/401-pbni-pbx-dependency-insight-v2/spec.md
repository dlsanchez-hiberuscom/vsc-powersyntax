# Spec 401 — B308 PBNI/PBX dependency insight v2

## Estado

- done

## Relacion backlog

- Backlog item: `B308 — PBNI/PBX dependency insight v2`

## Objetivo

Profundizar la visibilidad de dependencias externas `DLL/PBX/unknown` en reportes read-only reutilizando external functions y `native-dependency`, sin cargar binarios ni abrir un motor nuevo de inspeccion nativa.

## Resultado de cierre

- `src/server/features/powerBuilderTechnicalDebtReport.ts` desglosa ya el hotspot `external-dependency` con evidencia `external-kind:dll|pbx|unknown`, `external-alias:*` y `external-consumers=*`, manteniendo el conteo base `externalDependencies` sin recomputar semantica fuera del snapshot indexado;
- el mismo debt report publica ahora riesgo e impacto operativo defendibles mediante evidencia `external-risk:native-runtime`, `external-build-impact:manual-native-deployment`, `external-risk:pbni-runtime-surface`, `external-orca-impact:manual-pbx-packaging` y `external-risk:unknown-binary-classification` cuando aplica;
- `src/client/workspaceCheckReport.ts` resume esa misma evidencia en health sin ampliar el contrato publico ni abrir un segundo motor de clasificacion;
- `src/client/support/supportBundle.ts` sigue reutilizando el JSON saneado del debt report y los tests fijan que la evidencia externa visible llega intacta al bundle.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(externalFunctions|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle)"`

## Fuera de alcance del corte cerrado

- cargar, inspeccionar o ejecutar binarios nativos reales para validar compatibilidad o arquitectura;
- inferir un tipo `pbni` independiente de `pbx` cuando el workspace solo aporta evidencia declarativa de external functions;
- abrir fixes write-enabled, packaging automatico o validacion de despliegue runtime fuera del carril read-only.
