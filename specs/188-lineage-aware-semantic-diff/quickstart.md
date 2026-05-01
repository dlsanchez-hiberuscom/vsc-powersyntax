# Quickstart - Spec 188 Semantic diff consciente de lineage (B172)

## 1. Proposito

Verificar rapidamente que cambios relevantes de lineage ya actualizan el semantic diff y, por tanto, la invalidación semántica.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del diff por lineage.
2. Ejecutar compile y `npm test`.
3. Revisar backlog y done-log para comprobar el avance real de `B172`.

## 4. Resultado esperado

- Un cambio de lineage relevante marca `exportedIdsUpdated`.
- El resto del diff sigue estable.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.