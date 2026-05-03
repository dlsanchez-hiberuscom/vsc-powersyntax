# Plan - Spec 306 technical debt and modernization report (B261)

## 1. Enfoque técnico

Componer el informe sobre surfaces ya cerradas: `code-metrics` aporta hotspots medibles por objeto, `diagnostic.code` aporta señales estables, `sourceOrigin` summary aporta drift canónico y `workspaceMigrationAssistant` cubre layout legacy/ORCA/PBL. El reporte no debe crear diagnósticos nuevos ni un scoring paralelo opaco.

## 2. Pasos

1. Implementar el collector server-side con hotspots y recomendaciones read-only.
2. Exponer el contrato por API pública, tool bridge y comando Markdown cliente-side.
3. Validar collector, contrato, suite unitaria amplia y smoke del host real.
4. Alinear documentación viva y mover el foco canónico a `B262`.

## 3. Riesgos

- duplicar lógica diagnóstica o inventar señales fuera de `diagnostic.code`;
- convertir el reporte en un pseudo score definitivo sin evidence/confidence defendibles;
- mezclar read-only con write-enabled y abrir acciones automáticas sin preflight.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 5. Resultado ejecutado

1. El collector ya prioriza hotspots y recomendaciones defendibles sobre métricas, diagnósticos, sourceOrigin y layout legacy/ORCA-PBL.
2. La extensión ya expone el informe por API pública, tool read-only y comando Markdown.
3. El foco canónico del repo pasa a `B262`.