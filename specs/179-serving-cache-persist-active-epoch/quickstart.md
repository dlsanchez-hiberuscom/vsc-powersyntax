# Quickstart - Spec 179 Persistir solo la epoch activa en ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que la snapshot persistida solo conserva entradas de la epoch activa del KB.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del helper de persistencia por epoch activa.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- El snapshot persistido contiene solo entradas válidas para la epoch activa.
- Entradas antiguas o inválidas quedan fuera.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.