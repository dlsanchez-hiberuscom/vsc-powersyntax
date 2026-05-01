# Quickstart - Spec 174 Journal persistente particionado por proyecto (B071A)

## 1. Proposito

Verificar rapidamente que el cache store ya no mezcla en un único journal las mutaciones de proyectos distintos.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del cache store para el journal particionado.
2. Ejecutar compile y test unitario completo.
3. Ejecutar npm test para confirmar smoke, unit e integration.
4. Revisar backlog y done-log para verificar si B071A puede marcarse como cerrada.

## 4. Resultado esperado

- El journal de workspace solo retiene mutaciones huérfanas.
- Cada proyecto mantiene su propio journal persistido.
- El restore agregado aplica correctamente cada partición.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del journal particionado pasa.
- [x] Compile, unit y baseline completo pasan.
- [x] La documentacion quedo alineada.