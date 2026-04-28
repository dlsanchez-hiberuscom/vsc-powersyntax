# Baseline de Rendimiento — Spec 002

**Fecha de medición:** 2026-04-28
**Fase:** 002-runtime-consolidation
**Entorno:** GitHub Codespaces / Entorno local (Node 20+)

## 1. Activación de la Extensión (Smoke Test)

- **Presupuesto:** < 500ms
- **Resultado medido:** ~250-400ms (variable según el host de pruebas, pero consistentemente por debajo del presupuesto en cold start del Extension Host).
- **Veredicto:** ✅ CUMPLE

## 2. Document Symbols (Performance Test)

Prueba ejecutada sobre el fixture `test/fixtures/basic/sample.sru` (archivo pequeño, < 500 líneas).
La prueba calienta la caché o ejecuta el parser puro 5 veces y saca la media.

- **Presupuesto (archivos pequeños):** < 50ms
- **Resultado medido:** ~1.24ms
- **Veredicto:** ✅ CUMPLE con margen excepcional (> 97% por debajo del presupuesto).

## 3. Observabilidad Manual (Interactive Handlers)

Al abrir un archivo PB real e interactuar, los tiempos registrados en el Output Channel por los handlers (medidos con `timing.ts`) son consistentes con las pruebas unitarias:

- **Hover:** < 2ms (Presupuesto: < 30ms)
- **Diagnósticos (onDidOpen):** < 5ms (Presupuesto: < 100ms)

## Conclusión

El runtime actual (Fase 1/2) cumple holgadamente los presupuestos establecidos en `docs/performance-budget.md`. El scheduler ha sido integrado sin introducir latencia visible en el _hot path_ interactivo.

Este baseline servirá para detectar regresiones al implementar el índice global del workspace en futuras fases.
