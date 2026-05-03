# Plan - Spec 294 Build/ORCA documentation and troubleshooting (B198)

## 1. Enfoque técnico

Resolver `B198` solo en documentación viva. El runtime build/legacy ya existe; el gap real es operativo: falta una guía canónica para decidir entre `PBAutoBuild` y `ORCA`, localizar artefactos persistidos y ejecutar troubleshooting sin releer implementación.

## 2. Pasos

1. Inventariar comandos, settings, env vars y artefactos reales expuestos hoy por cliente/servidor.
2. Actualizar `README.md` con matriz de decisión y troubleshooting rápido.
3. Añadir un workflow explícito en `docs/developer-workflows.md`.
4. Alinear `docs/testing.md`, backlog, roadmap, current-focus y done-log.
5. Revalidar la alineación documental y el build básico del repo.

## 3. Riesgos

- documentar comandos o rutas ya obsoletos;
- duplicar la guía técnica interna en vez de enlazarla de forma clara;
- cerrar la deuda documental sin mover el foco canónico real a `B195`.

## 4. Validación

- auditoría documental local contra `package.json`, comandos visibles, settings y artefactos persistidos;
- `npm run build:test`

## 5. Resultado ejecutado

1. El repo ya explica cuándo usar build moderno y cuándo ORCA legacy.
2. El troubleshooting se apoya en status/dashboard/stats y en artefactos persistidos reales.
3. El siguiente foco canónico pasa a `B195`.
