# Plan - Spec 229 QueryContext evidence kinds (B157)

## 1. Resumen tecnico

Proyectar a `DocumentQueryContext` una lista compacta de los tipos de evidencia disponibles en la resolución detallada.

## 2. Estado actual

- la evidence existe y ya es estable;
- falta una surface resumida para consumers que no necesitan los payloads completos.

## 3. Diseno propuesto

- anadir `resolutionEvidenceKinds` como lista de `kind`;
- poblarla desde `resolvedTargets?.evidence.map(...)`;
- validarla con casos simple, ambiguo y sin contexto.

## 4. Impacto en el runtime

- simplifica surfaces consumidoras de explicación;
- evita inspección heterogénea cuando solo importa la presencia del tipo de evidence.

## 5. Riesgos tecnicos

- derivar la lista desde una fuente distinta a la evidence canónica;
- no degradar correctamente a vacío fuera de contexto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryContext"`

## 7. Documentacion a actualizar

- `docs/done-log.md`