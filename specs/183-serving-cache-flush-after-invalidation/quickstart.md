# Quickstart - Spec 183 Flush tras invalidación y shutdown de ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que las invalidaciones del runtime y el apagado del servidor dejan la snapshot persistente de ServingCache alineada con el estado real.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del helper `invalidateServingCacheEntries`.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- El helper invalida URIs o vacía la caché completa.
- Si existe coordinador, marca dirty y pide flush.
- El shutdown espera el flush final.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.