# Quickstart - Spec 190 Bridge de provenance de sistema a lineage (B172)

## 1. Proposito

Verificar rapidamente que el catálogo de sistema puede convertirse al vocabulario común de lineage sin tocar aún las surfaces consumidoras.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario de `systemProvenanceToLineage`.
2. Ejecutar compile y `npm test`.
3. Revisar backlog y done-log para comprobar el avance real de `B172`.

## 4. Resultado esperado

- El bridge devuelve `sourceKind: 'system'`.
- Manual/generated/official se traducen al vocabulario común de lineage.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.