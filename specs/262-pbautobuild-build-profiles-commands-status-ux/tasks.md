# Tasks - Spec 262 PBAutoBuild build profiles, commands and status UX (B185)

## 1. Preparación

- [x] T1. Confirmar que la UX actual solo ofrece `run/cancel` y no recuerda builds frecuentes.
- [x] T2. Definir un borde mínimo servidor-cliente para listar build files utilizables.

## 2. Implementación

- [x] T3. Añadir comando server-side para listar build files utilizables.
- [x] T4. Añadir comandos cliente para repetir el último build y elegir un build file utilizable.
- [x] T5. Recordar el último build ejecutado y proyectarlo en menú/status/reportes.

## 3. Validación

- [x] T6. Validar la proyección visible en `statusBarPresentation.test.ts`.
- [x] T7. Validar el registro de comandos y la API pública con la smoke corta del carril moderno.

## 4. Cierre

- [x] T8. Alinear docs, cerrar `B185` y sacar `B043` del backlog activo al cumplirse `B181-B187`.