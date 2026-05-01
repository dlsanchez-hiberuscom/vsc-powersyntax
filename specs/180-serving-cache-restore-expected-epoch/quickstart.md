# Quickstart - Spec 180 Restaurar solo la epoch esperada en ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que la rehidratación de ServingCache solo consume entradas coherentes con la epoch esperada del checkpoint restaurado.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del helper de restore por epoch esperada.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- El restore solo rehidrata entradas válidas para la epoch esperada.
- Entradas antiguas o inválidas quedan fuera.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.