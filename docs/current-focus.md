# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B369 — Generated-vs-manual catalog adoption decision gate`

Estado actual: `B368` queda cerrada. La taxonomía `manualOverlay` ya existe en el modelo del catálogo (`gap`, `enrichment`, `override`, `candidate`), `registry.ts` clasifica automáticamente las entradas `manual-core` que conviven con `generated`, `catalogConsistency` falla si detecta overlaps manual/generated sin política y `queryService.ts` aplica ya una merge policy provisional en el hot path.

La evidencia vigente que deja `B368` es:

- `types.ts`, `normalization.ts` y `manual/common.ts` materializan `manualOverlay` como contrato estable de entry, con `targetId/targetKey`, `reason`, `evidence`, `sourceUrl` y `reviewedBy` normalizados;
- `registry.ts` deja de depender del orden físico para clasificar la capa curada: los manuales con counterpart lógico `generated` pasan por defecto a `enrichment`, los que no lo tienen quedan como `gap` y casos explícitos como `Clipboard` quedan marcados como `override`;
- `queryService.ts` deja explícita la policy provisional de serving: `override` manual gana, `enrichment` se fusiona sobre base `generated` y `candidate` no entra en el hot path de listas/resolución;
- `systemCatalogQueryHardening.test.ts`, `catalogV2.test.ts`, `catalogConsistency.test.ts` y `catalogProvenanceAudit.test.ts` siguen en verde con esa policy ya ejecutable.

Con el catálogo oficial completo (`B367`) y la gobernanza curada explícita (`B368`), el siguiente cuello de botella ya no es técnico sino decisional: ahora toca cerrar `B369` con métricas y ADR sobre la adopción definitiva `generated` vs `manual` por dominio.

---

## 2. Por qué es prioritario

Con `B368` cerrada, el riesgo principal del bloque cambia otra vez de sitio:

- `B369` debe convertir la policy provisional actual en una decisión arquitectónica explícita y trazable;
- la cadena de localización (`B371-B375`) ya tiene delimitada la frontera entre autoridad oficial, overlay técnico y candidate, pero necesita una decisión de adopción runtime antes de crecer sobre ese contrato;
- el runtime ya no compite silenciosamente por orden físico, así que la siguiente iteración debe decidir si la policy provisional pasa a ser definitiva, se ajusta por dominio o se reemplaza por una variante híbrida sustentada por métricas.

---

## 3. Trabajo permitido ahora

- medir generated vs manual por dominio con counts, overlaps, gaps, enrichments, overrides y utilidad real para hover/signatureHelp/completion;
- redactar el ADR de source-of-truth del system catalog con contexto, evidencia, decisión, consecuencias y rollback;
- endurecer la evidencia de `B369` sin reabrir la taxonomía ya cerrada de `B368` salvo regresión demostrable;
- mantener verdes `systemCatalogQueryHardening`, `catalogV2`, `catalogConsistency` y `catalogProvenanceAudit` mientras se formaliza la decisión.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B367` o `B368` salvo drift real del generador, duplicados lógicos nuevos o serving inconsistente frente a la policy provisional ya fijada;
- empezar localización (`B371-B375`) antes de congelar la decisión arquitectónica de `B369`;
- convertir candidates en autoridad runtime o en diagnósticos agresivos sin evidencia y sin pasar por la decision gate.

---

## 5. Criterios de salida del foco actual

- existe reporte comparativo real `generated` vs `manual` por dominio y por clase de overlay;
- existe ADR de source-of-truth del system catalog con decisión y plan de migración;
- la merge policy definitiva queda documentada y cubierta por tests;
- `architecture`, `testing`, `backlog`, `done-log` y documentación técnica quedan alineados con la decisión resultante.

---

## 6. Siguiente foco natural

1. `B376` — Workspace check command and AI-readable validation report.
2. `B377` — Current object/class check command and AI-readable validation report.
3. `B371` — Catalog localization model and immutable overlay contract.

---

## 7. Regla final

`B369` ya no puede esconderse detrás de overlaps implícitos. `B367` dejó `generated` completo y `B368` dejó `manual` gobernado como overlay explícito; ahora toca decidir con evidencia qué política de adopción runtime queda como contrato arquitectónico del catálogo.