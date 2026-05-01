# Plan - Spec 195 Diff-aware invalidation plan (B170/B153/B154)

## 1. Resumen tecnico

Conectar el semantic diff al engine de invalidacion para distinguir cambios cosmeticos de cambios semanticos reales y resolver el conjunto impactado correcto.

## 2. Estado actual

- El repo ya tenia snapshot diff, grafo inverso y plan transitivo de invalidacion.
- El runtime seguia invalidando dependientes solo por cambio de documento.
- Faltaba usar el diff semantico para evitar flush innecesario y combinar impactos previos y siguientes.

## 3. Diseno propuesto

- Hacer que `diffSemanticSnapshots()` ignore cambios cosmeticos.
- Introducir helpers explicitos para invalidacion local, merge de planes y plan snapshot-aware.
- Usar ese plan desde `server.ts` en `onDidChangeContent`.

## 4. Impacto en el runtime

- Cierra `B170` y completa `B153` y `B154`.
- Reduce invalidaciones innecesarias y mantiene el conjunto impactado correcto.

## 5. Riesgos tecnicos

- Seguir invalidando dependientes por ruido cosmetico.
- Perder dependientes afectados por remove/add si el merge de planes no combina ambos lados.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`