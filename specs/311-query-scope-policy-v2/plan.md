# Plan - Spec 311 query scope policy v2 (B266)

## 1. Enfoque técnico

No meter la policy dentro de `semanticQueryService`: mantener el motor semántico compartido y fijar el contrato por consumer en la capa de features. El primer borde falsable debía ser el widening implícito de `referenceSourcePool`, donde un consumer `project` podía caer a `workspace` si faltaba routing explícito.

## 2. Pasos

1. Crear un registro único de policy por consumer con scopes canónicos, budgets, caps, readiness/confidence/fallback y allowances `staging/generated/external`.
2. Conectar `referenceSourcePool` y sus call sites (`references`, `rename`, `CodeLens`) para respetar `project` sin fallback a `workspace` y sin materializar `staging/generated` por defecto.
3. Derivar `featureReadiness` del mismo registro y meter `signatureHelp` en el gate común.
4. Colgar del contrato central los caps por defecto de `completion`, `currentObjectContext` e `impactAnalysis`.
5. Validar con suites focales y con un caso negativo de report pesado sin routing de proyecto.
6. Alinear docs canónicas y mover el foco a `B267`.

## 3. Riesgos

- duplicar la policy en otro mapa local y dejar el registro central como decoración;
- filtrar `staging/generated` de forma demasiado agresiva y romper el documento activo en casos límite;
- empujar la policy dentro del motor semántico y ensuciar `semanticQueryService` con concerns de consumer.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js`

## 5. Resultado ejecutado

1. `queryScopePolicy` ya centraliza la policy v2 de consumers semánticos reales.
2. `referenceSourcePool` ya respeta `project` sin fallback a `workspace` y filtra `staging/generated` adicionales cuando la policy los bloquea.
3. `featureReadiness`, `signatureHelp` y los caps por defecto de `completion/currentObjectContext/impactAnalysis` ya consumen el mismo contrato.