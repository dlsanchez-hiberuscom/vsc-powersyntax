# Spec 266 - Semantic repro pack export (B175)

**Estado:** cerrada y validada.

## 1. Resumen

Exportar un repro pack semántico reproducible desde el editor activo, reutilizando las surfaces read-only ya cerradas y copias de archivos relacionados para que un bug complejo pueda reabrirse sin reconstrucción manual del contexto.

## 2. Estado real actual

`B175` queda `Closed`: el cliente ya puede generar un bundle bajo `tools/semantic-repros/<slug>-<timestamp>` con `manifest.json`, README, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `serverStats`, diagnostics visibles y copias de archivos relevantes del workspace.

## 3. Objetivo

Reducir el coste de reproducción de bugs semánticos complejos empaquetando el contexto útil del runtime en un artefacto local, versionable y suficientemente trazable.

## 4. Alcance

- crear un builder puro del repro pack;
- añadir un comando visible en VS Code para exportarlo desde el editor activo;
- reutilizar exclusivamente API pública y surfaces read-only existentes;
- capturar snapshots JSON y archivos relacionados del workspace sin abrir un motor semántico paralelo.

## 5. Fuera de alcance

- comprimir o publicar automáticamente el pack fuera del workspace;
- ejecutar fixes automáticos o aplicar cambios write-enabled;
- rediseñar `currentObjectContext`, `impactAnalysis` o `safeEditPlan` más allá de su consumo en el bundle;
- capturar estado mutable opaco del proceso fuera de `serverStats` y artifacts serializables.

## 6. Criterios de aceptacion

- AC1. Existe un comando visible para exportar un repro pack semántico del editor activo.
- AC2. El pack reutiliza las surfaces read-only ya cerradas y no reconstruye semántica localmente.
- AC3. El bundle incluye archivos suficientes y metadata serializable para reabrir el bug sin reconstrucción manual.
- AC4. Hay validación unitaria del builder y smoke de exportación real.
- AC5. La documentación canónica refleja el cierre y el foco se mueve a `B232`.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticReproPack.test.js`
- `npm run test:smoke -- --grep "semantic-repro-pack"`

## 9. Cierre registrado

- `src/client/repro/semanticReproPack.ts` aporta el builder puro del bundle;
- `src/client/extension.ts` y `package.json` añaden el comando `vscPowerSyntax.exportSemanticReproPack` y su wiring en el menú de estado;
- `test/server/unit/semanticReproPack.test.ts` y `test/smoke/semantic-repro-pack.extension.test.ts` fijan el contrato funcional y el recorrido real de exportación.