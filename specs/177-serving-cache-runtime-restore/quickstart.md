# Quickstart - Spec 177 Restore y persist de ServingCache en runtime (B071B)

## 1. Proposito

Verificar rapidamente que el runtime ya restaura y persiste snapshots de ServingCache usando cacheStore.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del helper de persist/restore.
2. Ejecutar compile y el baseline completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- El helper restaura snapshots desde cacheStore sin romper el runtime.
- El helper persiste las entradas actuales de ServingCache.
- server.ts usa el helper en startup y persistencia estable.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del helper pasa.
- [x] Compile y baseline completo pasan.
- [x] La documentacion quedo alineada.