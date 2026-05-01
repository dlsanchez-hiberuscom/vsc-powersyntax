# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B157 — Semantic evidence de primera clase`

Estado actual: el nucleo de evidence/confidence ya quedo cubierto en las specs `219-248` sobre query engine, `queryTrace`, `queryContext`, hover y policy base de readiness. `B157` sigue abierto solo para cerrar exposicion segura en API/diagnostics/stats y conectar gates finales en callers sensibles.

---

## 2. Por qué es prioritario

`B157` es el siguiente cierre natural tras cerrar:

- `B159` — gobernador de latencia;
- `B156` — query engine unificado;
- `B173` — member closures;
- `B066` — CodeLens fiable;
- `B065` — hierarchy inspection;
- `B109` — API pública mínima;
- `B164` — compactación de memoria;
- `B063` — diagnostics snapshot agrupado.

`B157` permite que el motor explique por qué una resolución ganó o fue descartada, y prepara:

- `B171` — confidence gates;
- `B031` — references robustas;
- `B032` — rename seguro;
- API pública más explicable;
- herramientas futuras para IA.

---

## 3. Trabajo permitido ahora

- exponer evidence/confidence segura en diagnostics/API/stats;
- conectar `FeatureReadinessDecision` y confidence gates con callers sensibles;
- endurecer tests de serving y negativos sobre consumers de B157/B171;
- reforzar observabilidad sin duplicar semantica fuera del query engine;
- actualizar documentación afectada.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- DataWindow avanzado;
- ORCA/PBL import;
- PBAutoBuild profundo;
- API IA ambiciosa;
- formatter;
- nuevas features visuales grandes;
- automatización externa write-enabled.

---

## 5. Criterios de salida de B157

- evidence del ganador y de descartes ya cubierta;
- reason codes, ambigüedad minima y confidence del query engine ya cubiertos;
- integración local con `queryTrace`, `queryContext`, hover y readiness base ya cubierta;
- tests unitarios y negativos de ambigüedad ya cubiertos;
- pendiente final: exposición segura en API/diagnostics/stats y conexión de features delicadas con los gates de confidence;
- documentación actualizada.

---

## 6. Siguiente foco natural

1. `B171` — Confidence gates por feature.
2. `B160` — Query result cache con claves semánticas estables.
3. `B031` — Referencias más precisas y robustas.
4. `B032` — Rename controlado.
5. `B036` — Code actions básicas.
6. `B107` — Status bar con contexto de proyecto.

---

## 7. Regla final

No abrir más superficie funcional hasta que `B157` deje evidence/confidence suficientemente estable para servir features delicadas.
