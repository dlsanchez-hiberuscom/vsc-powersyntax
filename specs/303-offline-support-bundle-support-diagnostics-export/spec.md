# Spec 303 - offline support bundle / support diagnostics export (B258)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B258` con un support bundle offline versionado, acotado y saneado, construido desde surfaces read-only ya publicadas y útil para soporte sin exportar código bruto por defecto.

## 2. Estado real actual

La extensión ya exporta `PowerSyntax: Exportar Support Bundle Offline` y genera un bundle bajo `tools/support-bundles/<workspace>-<timestamp>` con runtime health, stats saneadas, diagnostics snapshot saneada, manifest semántico reducido, runtime journal tail, performance summary, settings gobernados/saneados, snapshot build/ORCA y inventario API/tool.

## 3. Objetivo

Dar un artefacto offline reproducible para troubleshooting y soporte que reutilice el backbone read-only existente sin abrir un rail nuevo en servidor ni mezclar este caso con el repro pack semántico que sí puede copiar archivos relacionados.

## 4. Alcance

- implementar un builder cliente-side de support bundle saneado;
- exponer un comando de exportación offline en la extensión;
- incluir runtime health, server stats saneadas, diagnostics snapshot saneada, manifest reducido, runtime journal tail, performance summary, settings saneados, snapshot build/ORCA e inventario API/tool;
- fijar redacción de rutas/URIs/ejecutables y ausencia de código bruto por defecto;
- alinear documentación viva y mover el foco canónico a `B259`.

## 5. Fuera de alcance

- copiar source code del workspace por defecto dentro del bundle;
- abrir un endpoint nuevo del servidor solo para soporte offline;
- añadir telemetría externa o exfiltración automática de datos.

## 6. Criterios de aceptación

- AC1. la extensión exporta un support bundle offline reproducible desde el workspace activo.
- AC2. el bundle incluye stats, health, diagnostics snapshot, manifest reducido, runtime journal tail, performance summary, settings saneados, snapshot build/ORCA e inventario API/tool.
- AC3. rutas, URIs, ejecutables y artefactos locales se redaccionan y el bundle no copia código bruto por defecto.
- AC4. la validación cubre unit del builder, test de redacción y smoke del comando real.
- AC5. backlog, roadmap y current-focus dejan de tratar `B258` como deuda activa y pasan a `B259`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "support-bundle-extension"`

## 9. Cierre registrado

- el producto exporta soporte offline reutilizando el backbone read-only ya publicado;
- la redacción deja fuera rutas locales y código bruto por defecto;
- el siguiente foco canónico del repo pasa a `B259`.