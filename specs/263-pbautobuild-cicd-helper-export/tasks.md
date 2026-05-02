# Tasks - Spec 263 PBAutoBuild CI/CD helper export (B186)

## 1. Preparacion

- [x] T1. Confirmar que el helper debe ser bundle exportable/versionable y no solo texto efimero.
- [x] T2. Reutilizar el perfil/build file utilizable ya cerrado en `B182-B185`.

## 2. Implementacion

- [x] T3. Crear el builder puro del bundle CI/CD.
- [x] T4. Registrar el comando cliente para exportarlo en `tools/pbautobuild-ci/<perfil>`.
- [x] T5. Generar `manifest.json`, README y scripts PowerShell/CMD/Bash neutrales.

## 3. Validacion

- [x] T6. Anadir unit test focal del builder del helper.
- [x] T7. Revalidar la smoke visible del carril PBAutoBuild con el nuevo comando.

## 4. Cierre

- [x] T8. Actualizar docs canónicas y mover el foco a `B230` tras cerrar `B186`.