# Quickstart - Spec 184 Cierre observable de B071B en ServingCache

## 1. Proposito

Verificar rapidamente que el servidor expone el estado persistente básico de ServingCache y que `B071B` puede considerarse cerrado con trazabilidad observable.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar compile y test:unit.
2. Ejecutar `npm test`.
3. Revisar `powerbuilder.showStats` y la documentación canónica para confirmar el cierre de `B071B`.

## 4. Resultado esperado

- `showStats` expone métricas de restore/persist de ServingCache.
- `B071B` aparece cerrado en backlog y logs.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] Compile y tests pasan.
- [x] La documentación quedó alineada.
- [x] El siguiente backlog parcial queda identificado.