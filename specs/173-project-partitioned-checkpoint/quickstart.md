# Quickstart - Spec 173 Checkpoint persistente particionado por proyecto (B071A)

## 1. Proposito

Verificar rapidamente que el cache store persiste y restaura checkpoints por proyecto sin perder la particion de workspace.

## 2. Prerequisitos

- npm install
- npm run compile

## 3. Validacion rapida

1. Ejecutar el test unitario del cache store para la ruta particionada.
2. Ejecutar compile para validar firmas y wiring.
3. Ejecutar test unitario completo para confirmar que el baseline afectado sigue estable.
4. Revisar backlog, roadmap, current-focus y done-log.

## 4. Resultado esperado

- Existen checkpoints persistidos por proyecto y una particion de workspace para huérfanos.
- El restore recompone correctamente el conjunto de documentos.
- El baseline del slice queda en verde.

## 5. Checklist

- [x] Existe implementacion verificable.
- [x] El test del cache store pasa.
- [x] Compile y test unitario completo pasan.
- [x] La documentacion quedo alineada.