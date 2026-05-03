# Plan - Spec 321 telemetry-free observability contract (B271)

## 1. Enfoque técnico

Partir del borde contractual más directo: el runtime ya exponía `ApiServerStats`, `health`, query trace y support bundle, pero sin un descriptor explícito que declarase privacidad local, dominios cubiertos y surfaces disponibles. La estrategia fue añadir ese descriptor al contrato público ya existente y revalidar el carril de redacción del support bundle, evitando crear un segundo rail de reporting.

## 2. Pasos

1. Demostrar el hueco contractual en `publicApi.test.ts`.
2. Añadir `ApiObservabilityContractDescriptor` a `ApiPublicContractDescriptor`.
3. Declarar dominios, surfaces y privacidad sin telemetría externa.
4. Revalidar `publicApi.test.ts` y `supportBundle.test.ts`.
5. Alinear docs canónicas y mover el foco a `B272`.

## 3. Riesgos

- presentar observabilidad local como si fuera telemetría externa o upload automático;
- duplicar `serverStats` y support bundle en otro contrato paralelo;
- cerrar `B271` sin fijar explícitamente la policy de privacidad/redacción del slice.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 5. Resultado ejecutado

1. `ApiPublicContractDescriptor` declara ya observabilidad local versionada y sin telemetría externa.
2. `supportBundle.test.ts` mantiene verde la redacción real del export offline.
3. backlog/current-focus/roadmap/done-log ya dejan `B271` cerrada y mueven el foco a `B272`.