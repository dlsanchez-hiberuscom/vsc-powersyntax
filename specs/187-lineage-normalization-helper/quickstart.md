# Quickstart - Spec 187 Normalización de lineage en enrichEntity (B172)

## 1. Proposito

Verificar rapidamente que `enrichEntity` completa lineage cuando falta, pero respeta overrides explícitos y mantiene coherencia con prototype/implementation.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario de `enrichEntity` sobre lineage.
2. Ejecutar compile y `npm test`.
3. Revisar backlog y done-log para comprobar el avance real de `B172`.

## 4. Resultado esperado

- `enrichEntity` completa lineage mínimo útil.
- Los overrides explícitos del caller se conservan.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.