# Spec 294 - Build/ORCA documentation and troubleshooting (B198)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar la deuda operativa residual del carril moderno/legacy dejando una guía única, concreta y alineada al estado real del producto para decidir cuándo usar `PBAutoBuild`, cuándo usar `ORCA legacy` y cómo diagnosticar ambos caminos sin reabrir arquitectura ni inventar tooling nuevo.

## 2. Estado real actual

`B198` queda `Closed`: `README.md`, `docs/developer-workflows.md`, `docs/testing.md` y la guía técnica PowerBuilder ya describen el flujo moderno `PBAutoBuild`, el rail legacy ORCA, los comandos visibles, los settings/env vars soportados, los artefactos persistidos y el troubleshooting mínimo defendible basado en surfaces reales del producto.

## 3. Objetivo

Reducir fricción operativa para mantenimiento, soporte y uso diario del plugin una vez cerrados `B186`, `B187`, `B194`, `B197` y el bloque `B241-B250`.

## 4. Alcance

- documentar el criterio de decisión `PBAutoBuild vs ORCA legacy`;
- documentar comandos, settings, env vars y artefactos persistidos reales de ambos carriles;
- fijar troubleshooting reproducible sin depender de leer código interno;
- alinear backlog, roadmap, current-focus y done-log con el cierre documental.

## 5. Fuera de alcance

- abrir nuevas capacidades de build o packaging legacy (`B195`);
- reabrir runner, parser, health o workflow ORCA ya cerrados;
- añadir surfaces UX nuevas para soporte fuera de las ya existentes.

## 6. Criterios de aceptación

- AC1. `README.md` explica cuándo usar `PBAutoBuild`, cuándo usar `ORCA legacy` y qué artefactos deja cada carril.
- AC2. `docs/developer-workflows.md` incluye un workflow explícito de operación y troubleshooting de build/ORCA.
- AC3. `docs/testing.md` deja trazado el baseline mínimo cuando cambie documentación operativa de build/ORCA.
- AC4. backlog, roadmap, current-focus y done-log ya no tratan `B198` como deuda activa.
- AC5. el siguiente foco canónico pasa a `B195`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- auditoría documental local contra `package.json`, comandos visibles, settings soportados y rutas de artefactos persistidos;
- `npm run build:test`

## 9. Cierre registrado

- la guía operativa y el troubleshooting ya consumen solo surfaces reales del producto;
- la frontera entre guía operativa y guía técnica del runtime queda explícita;
- `B195` queda como siguiente deuda del carril legacy.
