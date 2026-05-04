# Spec 402 — B306 HTTP/REST/JSON usage analyzer

## Estado

- done

## Relacion backlog

- Backlog item: `B306 — HTTPClient/REST/JSON usage analyzer`

## Objetivo

Detectar usos de `HTTPClient`, `RESTClient`, `JsonParser`, `JSONGenerator` y `JSONPackage`, y proyectar patrones de integración moderna en reportes read-only sin exponer secretos ni abrir un motor nuevo fuera del pipeline ya indexado.

## Resultado de cierre

- `src/server/features/powerBuilderCodeMetrics.ts` cuenta ya `httpIntegrationUsages` y `jsonIntegrationUsages` por objeto y en summary global reutilizando `datatype` y `baseTypeName` ya presentes en snapshots/facts;
- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica el hotspot `modern-integration` con evidencia `integration-surface:*`, `integration-pattern:*`, `integration-endpoint:*` redactado e `integration-risk:redaction-required`, sin leer payloads completos ni exponer hosts, paths, tokens o credenciales;
- `src/client/workspaceCheckReport.ts` resume esa misma evidencia moderna en health y `src/client/support/supportBundle.ts` la mantiene visible mediante el debt report saneado, sin un segundo motor de clasificación;
- `src/shared/publicApi.ts` versiona el contrato aditivo a `2.21.0` y las suites de `publicApi`, `powerBuilderCodeMetrics`, `powerBuilderTechnicalDebtReport`, `workspaceCheckReport` y `supportBundle` fijan el shape visible del slice.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle|publicApi)"`

## Fuera de alcance del corte cerrado

- inspeccionar bodies HTTP, responses, HTML, JavaScript remoto o contenido web embebido;
- almacenar o exponer secretos, tokens, credenciales, hosts o paths reales fuera de resúmenes redactados;
- mezclar este slice HTTP/REST/JSON con análisis `WebBrowser`/`WebView2`, que queda como foco separado en `B307`.