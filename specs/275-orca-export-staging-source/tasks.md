# Tasks - Spec 275 ORCA export to staging source (B191)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en el bridge staging/routing y no en reabrir discovery moderno ni el runner ORCA base.

## 2. Implementación

- [x] T2. Añadir contrato ORCA compartido y servicio server-side para export, script y state persistido.
- [x] T3. Extender `WorkspaceState`, routing, project model y manifest con aliases explícitos de staging hacia la librería legacy original.
- [x] T4. Publicar comando cliente, setting de DLL de sesión y política local de `.gitignore` para el staging ORCA.

## 3. Validación

- [x] T5. Añadir tests focales para script/layout/alias restore y revalidar workspace/manifest.
- [x] T6. Revalidar el wiring visible del carril ORCA en la extensión real.

## 4. Cierre

- [x] T7. Actualizar docs canónicas y mover el foco a `B192`.