# Plan - Spec 227 QueryContext ambiguity flag (B157)

## 1. Resumen tecnico

Proyectar a `DocumentQueryContext` una bandera booleana que indique si la resolución detallada contiene evidencia de ambigüedad.

## 2. Estado actual

- la ambigüedad se conserva en la evidence del query engine;
- `queryContext` todavía no ofrece una lectura rápida de esa condición.

## 3. Diseno propuesto

- anadir `hasResolutionAmbiguity: boolean`;
- derivarla comprobando `distance-ambiguity` en `resolvedTargets?.evidence`;
- cubrirla con un test unitario de un caso ambiguo.

## 4. Impacto en el runtime

- simplifica el consumo de ambigüedad en capas superiores;
- evita inspección repetitiva de evidence estructurada.

## 5. Riesgos tecnicos

- derivar la bandera desde una señal distinta de la evidence estabilizada;
- no degradar correctamente a `false` cuando no hay contexto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryContext"`

## 7. Documentacion a actualizar

- `docs/done-log.md`