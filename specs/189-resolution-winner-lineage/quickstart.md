# Quickstart - Spec 189 Winner lineage en semanticQueryService (B172)

## 1. Proposito

Verificar rapidamente que el winner path detallado ya expone lineage listo para features consumidoras.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del winner path en `semanticQueryService`.
2. Ejecutar compile y `npm test`.
3. Revisar backlog y done-log para comprobar el avance real de `B172`.

## 4. Resultado esperado

- `resolveTargetEntityDetailed` devuelve `winnerLineage`.
- `winnerLineage` incluye `resolutionKind` y confianza base útil.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.