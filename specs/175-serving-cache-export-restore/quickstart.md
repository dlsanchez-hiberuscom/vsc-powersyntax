# Quickstart - Spec 175 Export y restore de ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que ServingCache puede exportar y restaurar entradas sin perder orden LRU ni compartir referencias mutables.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario de export y restore de ServingCache.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- ServingCache expone una snapshot exportable de sus entradas.
- La restauración respeta el orden LRU y la capacidad.
- El payload restaurado no comparte referencias con el snapshot exportado.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.