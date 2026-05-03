# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B346 — Refactor client extension activation and command registration`

Estado actual: `B198`, `B195`, `B251`, `B252`, `B253`, `B254`, `B255`, `B256`, `B257`, `B258`, `B259`, `B260`, `B261`, `B262`, `B263`, `B264`, `B265`, `B266`, `B267`, `B268`, `B269`, `B270`, `B271`, `B272`, `B273`, `B274`, `B275`, `B276`, `B277`, `B278`, `B279`, `B280`, `B281`, `B282`, `B283`, `B285`, `B287`, `B288`, `B289`, `B290`, `B291`, `B293`, `B294`, `B295`, `B296`, `B297`, `B319`, `B322`, `B323`, `B324`, `B325`, `B330`, `B336` y `B347` quedan ya cerradas con trazas canónicas, incluyendo `specs/364-runtime-self-test-command`, `specs/365-enterprise-health-score`, `specs/366-enterprise-configuration-policy`, `specs/367-support-bundle-redaction-policy` y `specs/368-server-lsp-handler-registration-refactor`, además de `docs/done-log.md`. Con el entrypoint del servidor ya descompuesto, el siguiente hotspot útil pasa ahora a `B346`.

Trazas paralelas activas que no desplazan ese foco principal:

- mantenimiento verde del carril `B258-B297` y `B347` únicamente si aparece una regresión real en server/runtime/supportability;
- mantenimiento verde de `B279`/`B280`/`B281`/`B282`/`B283`/`B285`/`B287`/`B288`/`B289`/`B290`/`B291`/`B293`/`B319`/`B322`/`B323`/`B324`/`B325`/`B330`/`B336` únicamente si aparece una regresión real en identity, catálogo o serving interactivo;
- mantenimiento derivado de la auditoría 2026-05-03 sobre catálogo/refactor/real-corpus: `B339` y `B344` siguen abiertos, pero no desplazan `B346` salvo regresión real.

---

## 2. Por qué es prioritario

Tras cerrar `B347`, el hotspot visible siguiente es `src/client/extension.ts`: el cliente sigue fino, pero mezcla activación, wiring, comandos, paneles, build/ORCA, export/support y construcción de API en un único archivo.

- `B346` debe separar bootstrap, command registration, vistas/paneles, build/ORCA, support/export y API construction sin romper command IDs ni la API pública;
- la refactorización debe preservar activación perezosa, no re-registrar comandos y mantener el cliente ligero;
- el cierre debe sostener verdes `architectureImports`, las smokes principales del cliente y el presupuesto de activación.

---

## 3. Trabajo permitido ahora

- extraer boundaries explícitos desde `src/client/extension.ts` hacia bootstrap, comandos, paneles, build/ORCA, support/export y API pública;
- mantener estable el contrato observable del cliente mientras se reduce acoplamiento y tamaño del entrypoint;
- alinear `docs/architecture.md`, `docs/testing.md` y `docs/performance-budget.md` cuando la estructura visible cambie.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- reabrir `B347` sin drift real en `src/server/server.ts`, `handlers/*.ts`, `architectureImports.test.ts` o las smokes focales del servidor;
- mezclar `B346` con `B344` (DataWindow/plugin_old) o con nuevos cambios de catálogo antes de cerrar el slice mínimo del cliente;
- cambiar command IDs, surfaces públicas o el presupuesto de activación sin una validación proporcional que lo vuelva a fijar.

---

## 5. Criterios de salida del foco actual

- `B346` queda cerrada con `src/client/extension.ts` descompuesto en módulos con boundaries explícitos y sin imports indebidos desde `server`;
- command IDs, API pública y comportamiento observable del cliente permanecen intactos;
- `docs/architecture.md`, `docs/testing.md` y `docs/performance-budget.md` quedan alineados con la nueva estructura real del cliente.

---

## 6. Siguiente foco natural

1. `B339` — Catalog provenance audit against official Appeon sources.
2. `B344` — DataWindow binding edge cases from plugin_old.
3. `B353` — Large-file regression guard and architecture metrics.

---

## 7. Regla final

`B346` debe apoyarse en la misma disciplina que `B277/B281/B347`: descomponer entrypoints sin tocar el contrato observable, proteger activación/hot path y reforzar boundaries explícitos entre bootstrap, handlers, commands y runtime.