# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B042 — Soporte avanzado de DataWindow`

Estado actual: `B031`, `B155`, `B032`, `B161`, `B163`, `B176`, `B208`, `B204`, `B206`, `B209`, `B210`, `B207`, `B211`, `B213`, `B212`, `B222`, `B217`, `B218`, `B219`, `B220`, `B117`, `B139`, `B041`, `B224`, `B223` y `B067` ya quedaron cerradas con validación ejecutable y documentación alineada. Además, la spec 045 ya vive cerrada históricamente como `B131` (`.pblmeta` parser). Con el safe mode mínimo `.srd`, el refuerzo legacy-safe, la observabilidad interna del runtime ya materializada y el catálogo/navegación básicos ya integrados, el siguiente hueco estructural visible vuelve a ser `B042`: soporte avanzado de DataWindow sin romper el aislamiento del sublenguaje.

---

## 2. Por qué es prioritario

`B042` capitaliza directamente el trabajo ya cerrado en:

- `sourceOrigin` ya unificado en discovery, lineage, diagnostics y API pública gracias a `B204`;
- metadata contractual de símbolo ya disponible desde `B206` con `ownerName`, `declarationScope`, `implementationKind`, `containerSignature` y `fileObjectName`;
- modelo de invocación ya estabilizado desde `B209` para `this`, `parent`, `super`, `ancestor`, llamadas globales/dinámicas/externas y current object real por línea;
- modelo de eventos ya estabilizado desde `B210` con owner real de `on object.event`, `call super::create` y literales estables de `TriggerEvent/PostEvent` resolubles;
- modelo de dependencias nativas ya estabilizado desde `B207` con clasificación `dll/pbx/unknown`, alias y degradación honesta en rename/references/diagnostics;
- modelo transaccional básico ya estabilizado desde `B211` con `SQLCA` especial, `SetTransObject`/`SetTrans`, `Retrieve`/`Update` y confidence degradada para bindings dinámicos;
- bridge básico PowerScript/DataWindow ya cerrado desde `B212` con `DataObject` literal navegable hacia `.srd`, args de `Retrieve(...)` consumidos desde snapshots `.srd` y degradación honesta para bindings ambiguos o dinámicos;
- modelo lifecycle ya estabilizado desde `B213` con create/destroy, hooks `constructor/destructor`, warnings suaves y evidence compartida en hover/hierarchy inspection/diagnostics;
- `B212` ya conectó `DataObject` literal y `Retrieve(...)` contra snapshots `.srd`, pero todavía como bridge puntual, no como safe mode mínimo explícito para `.srd`;
- `B117` ya cerró el safe mode mínimo con detección `.srd`, SQL base, argumentos, columnas, bandas principales, hover y navegación básica sobre el mismo backbone actual;
- `B139` ya reforzó ese safe mode reaprovechando parser/definition/hover seguros del legacy para navegar bandas y columnas SQL dentro del propio `.srd`, sin stores globales ni soporte avanzado;
- `B041` ya integró catálogo y navegación básicos en `documentSymbols` y `workspace/api symbols`, de modo que DataWindow/DataStore ya existen como entidades visibles y navegables de primer nivel;
- diagnostics, hover y signatureHelp ya reutilizan parte de esa información, lo que reduce el coste de abrir ahora propiedades y expresiones avanzadas sin duplicar semántica;
- evidence/confidence de primera clase ya disponible desde `B157` y gates por feature desde `B158`/`B171`;
- `references` y `rename` ya comparten query engine y degradaciones honestas sobre topología real del workspace.

`B042` desbloquea una base más defendible para:

- abrir expresiones, propiedades avanzadas, controles y relaciones DataWindow sobre un sublenguaje ya visible y navegable;
- ampliar cobertura semántica sin perder los límites claros entre safe mode, catálogo básico y soporte avanzado;
- sostener futuras acciones/diagnósticos avanzados sobre DataWindow con mejor base estructural.

---

## 3. Trabajo permitido ahora

- ampliar el parser/modelo de DataWindow hacia expresiones, propiedades avanzadas, controles y relaciones adicionales sin degradar hot path;
- mantener separación explícita entre safe mode/catalog básico y semántica avanzada de DataWindow;
- cubrir con tests focalizados cada capacidad avanzada antes de abrir automatización dependiente.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- mezclar expresiones y propiedades avanzadas de DataWindow con PowerScript normal;
- reabrir formatter salvo bug o regresión clara sobre la ruta conservadora ya cerrada;
- automatización dependiente de DataWindow avanzado sin confidence/readiness explícitos.

---

## 5. Criterios de salida del foco actual

- existe soporte avanzado adicional de DataWindow por encima del safe mode y del catálogo básico, sin romper los límites del sublenguaje;
- el resultado conserva degradación honesta y no introduce parseo pesado injustificado en el hot path;
- documentación canónica deja claro qué queda en catálogo básico y qué ya entra en soporte avanzado.
- documentación canónica queda alineada con el estado real.

---

## 6. Siguiente foco natural

1. `B181` — PBAutoBuild capability detection.
2. `B216` — Project Health Dashboard.
3. `B070` — Memory budgets de caché e índice.
4. `B162` — Reconciliación parser / symbol model / salida LSP.

---

## 7. Regla final

No abrir automatización dependiente de DataWindow avanzado si antes no existe soporte avanzado explícito, degradable y gobernado sobre el catálogo básico ya cerrado.
