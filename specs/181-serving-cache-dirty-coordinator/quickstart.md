# Quickstart - Spec 181 Coordinador dirty para flush de ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que el coordinador dirty de ServingCache solo flushea cuando procede y se estabiliza si vuelve a ensuciarse durante el flush.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del coordinador dirty.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- El coordinador no flushea en limpio.
- El coordinador flushea cuando está dirty.
- Si vuelve a ensuciarse durante el flush, converge con un segundo flush.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.