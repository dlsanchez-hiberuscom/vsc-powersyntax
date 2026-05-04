# Spec 403 — B307 WebBrowser/WebView2 usage analyzer

## Estado

- done

## Relacion backlog

- Backlog item: `B307 — WebBrowser/WebView2 usage analyzer`

## Objetivo

Detectar superficies `WebBrowser`/`WebView2` y proyectar patrones de navegación, bridge JavaScript y settings relevantes en reportes read-only sin inspeccionar contenido web remoto ni abrir un motor nuevo fuera del pipeline ya indexado.

## Resultado de cierre

- `src/server/features/powerBuilderCodeMetrics.ts` cuenta ya `webBrowserUsages` por objeto y en summary global reutilizando `datatype` y `baseTypeName` ya presentes en snapshots/facts;
- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica el hotspot `web-ui-integration` con evidencia `web-ui-surface:*`, `web-ui-pattern:*` y `web-ui-risk:no-content-inspection`, distinguiendo navegación, script bridge y remote debugging sin leer HTML, DOM ni JavaScript remoto;
- `src/client/workspaceCheckReport.ts`, `src/client/extension.ts` y `src/client/support/supportBundle.ts` reutilizan esa misma evidencia visible en health, Markdown y bundle saneado sin abrir un segundo motor de clasificación;
- `src/shared/publicApi.ts` versiona el contrato aditivo a `2.22.0` y las suites de `publicApi`, `powerBuilderCodeMetrics`, `powerBuilderTechnicalDebtReport`, `workspaceCheckReport` y `supportBundle` fijan el shape visible del slice.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle|publicApi)"`

## Fuera de alcance del corte cerrado

- inspeccionar HTML, DOM, JavaScript remoto o payloads del contenido embebido;
- ejecutar navegación real, remote debugging o automatización write-enabled sobre WebView2;
- mezclar este slice WebBrowser/WebView2 con higiene de artefactos SCM, que queda como foco separado en `B309`.