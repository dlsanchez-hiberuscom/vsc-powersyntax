# Quickstart - Spec 185 Contrato base de lineage para símbolos (B172)

## 1. Proposito

Verificar rapidamente que el modelo semántico principal ya expone un contrato común de lineage sin romper consumidores existentes.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar compile y test:unit.
2. Ejecutar `npm test`.
3. Revisar backlog y done-log para comprobar el arranque real de `B172`.

## 4. Resultado esperado

- `Entity` expone `lineage` como campo opcional.
- El vocabulario base de lineage queda disponible para los siguientes pasos.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.
- [x] El siguiente paso de población queda claro.