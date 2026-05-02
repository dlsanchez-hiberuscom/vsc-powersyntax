# Tasks - Spec 271 Current Object Context Panel (B215)

## 1. Preparación

- [x] T1. Confirmar que `currentObjectContext` ya contenía casi todo el payload y que el gap real era `visibleVariables`.

## 2. Implementación

- [x] T2. Ampliar `src/shared/publicApi.ts` y `src/server/features/currentObjectContext.ts` con `visibleVariables`.
- [x] T3. Crear el modelo puro del panel y su proyección por secciones read-only.
- [x] T4. Registrar la vista `powerbuilderCurrentObjectContext` con foco, refresco y apertura segura de ubicaciones.

## 3. Validación

- [x] T5. Revalidar `currentObjectContext` con el contrato ampliado.
- [x] T6. Añadir unit del modelo puro del panel.
- [x] T7. Añadir smoke del foco visible sobre el archivo activo.

## 4. Cierre

- [x] T8. Actualizar docs canónicas y mover el foco a `B188`.