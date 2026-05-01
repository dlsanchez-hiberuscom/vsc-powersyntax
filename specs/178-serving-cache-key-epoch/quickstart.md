# Quickstart - Spec 178 Parseo de epoch en clave de ServingCache (B071B)

## 1. Proposito

Verificar rapidamente que ServingCache puede leer la epoch desde sus claves estables sin cambiar el formato existente.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del helper de parseo de epoch.
2. Ejecutar compile y test unitario completo.
3. Revisar backlog y done-log para comprobar el avance real de B071B.

## 4. Resultado esperado

- Las claves válidas devuelven su `kbVersion`.
- Las claves mal formadas devuelven `null`.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del slice pasa.
- [x] Compile y unit completos pasan.
- [x] La documentacion quedo alineada.