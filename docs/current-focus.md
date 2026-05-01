# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B157 — Semantic evidence de primera clase`

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

- completar evidence formal para candidatos ganadores y perdedores;
- conectar `queryTrace`, `reasonCodes`, lineage y readiness;
- calcular confidence formal por feature;
- exponer evidence segura en diagnostics/API/stats;
- añadir tests de resolución, descartes y confidence;
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

- evidence del ganador;
- evidence de candidatos descartados;
- reason codes normalizados;
- confidence calculada;
- integración con query engine;
- tests unitarios;
- tests negativos para ambigüedad;
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
