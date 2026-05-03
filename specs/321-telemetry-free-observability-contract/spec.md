# Spec 321 - telemetry-free observability contract (B271)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B271` formalizando un contrato versionado de observabilidad local dentro de la API pública, declarando privacidad `externalTelemetry = false`, surfaces observables del runtime y export offline saneado para support bundle sin abrir un rail paralelo de reporting.

## 2. Estado real actual

El repo ya dispone de `ApiObservabilityContractDescriptor` embebido en `ApiPublicContractDescriptor`, con dominios readiness/indexing/cache/memory/latency/build/ORCA/diagnostics/query trace/support bundle/health. `publicApi.test.ts` y `supportBundle.test.ts` fijan ya ese descriptor y el carril de redacción asociado.

## 3. Objetivo

Declarar de forma explícita y versionada qué señales de observabilidad son locales, cómo se exponen y qué política de privacidad/redacción las rige, sin telemetría externa y reutilizando las surfaces read-only ya existentes.

## 4. Alcance

- añadir un descriptor versionado de observabilidad local dentro del contrato público;
- cubrir readiness, indexing, cache, memory, latency, build, ORCA, diagnostics, query trace, support bundle y health;
- declarar privacidad `externalTelemetry = false`, `localOnly = true` y export offline explícito para support bundle;
- validar el contrato en `publicApi.test.ts` y mantener verde la redacción real en `supportBundle.test.ts`;
- alinear `README.md`, `docs/architecture.md`, `docs/developer-workflows.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- abrir telemetría remota, sinks externos o upload automático de métricas;
- duplicar `serverStats`/health/support bundle en otro contrato paralelo;
- mezclar `B271` con fuzzing del parser, que pertenece a `B272`.

## 6. Criterios de aceptación

- AC1. `ApiPublicContractDescriptor` expone un descriptor versionado de observabilidad local.
- AC2. el descriptor cubre los dominios readiness/indexing/cache/memory/latency/build/ORCA/diagnostics/query trace/support bundle/health.
- AC3. el descriptor declara `externalTelemetry = false`, `localOnly = true` y export offline explícito para support bundle.
- AC4. `publicApi.test.ts` y `supportBundle.test.ts` quedan verdes como contract/redaction tests del slice.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B272`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 9. Cierre registrado

- la observabilidad del producto ya queda declarada como local y versionada dentro del contrato público;
- support bundle permanece como export offline saneado y explícito, no como telemetría;
- el siguiente foco canónico del repo pasa a `B272`.