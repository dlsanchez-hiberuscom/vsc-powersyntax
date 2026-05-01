# Quickstart - Spec 156 Clave estable de cache por workspace (B071A)

## 1. Proposito

Verificar rapidamente que la slice queda operativa y alineada con el baseline actual del plugin.

## 2. Prerequisitos

`ash
npm install
npm run compile
`

## 3. Validacion rapida

1. Revisar el codigo afectado por la slice y confirmar que el wiring principal esta presente.
2. Ejecutar npm run test:unit para comprobar la cobertura del area tocada.
3. Ejecutar npm test para validar smoke, unit e integration del repositorio.
4. Revisar backlog y done-log para confirmar la trazabilidad documental.

## 4. Resultado esperado

- La capacidad descrita por la spec existe y esta conectada al runtime o feature correspondiente.
- El baseline del repositorio queda en verde.
- La documentacion refleja la slice como cerrada dentro de la ola 153-172.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El baseline compila.
- [x] Unit y test global pasan.
- [x] La trazabilidad documental quedo actualizada.
