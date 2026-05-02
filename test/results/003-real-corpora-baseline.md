# Baseline de Rendimiento Real — PFC, legacy y OrderEntry

**Fecha de medición:** 2026-05-02  
**Corpus:** PFC 2025 Workspace, PFC 2025 Solution, legacy PBL dump, STD_FC_OrderEntry local  
**Comando principal:** `npm run test:performance`

## 1. Archivo activo

- **Primer hover real sobre PFC Workspace:** `1.05ms`
- **Primer diagnostics real sobre PFC Workspace:** `0.75ms`
- **Budget operativo actual:** hover `< 50ms`, diagnostics `< 100ms`

## 2. Discovery e indexación

- **Discovery PFC Workspace:** `112.09ms` sobre `831` archivos
- **Indexación cold PFC Workspace:** `13333.28ms` con `21575` entidades
- **Indexación warm PFC Workspace:** `0.59ms`
- **Discovery STD_FC_OrderEntry:** `463.63ms` sobre `744` archivos
- **Indexación cold STD_FC_OrderEntry:** `12873.54ms` con `23872` entidades
- **Indexación warm STD_FC_OrderEntry:** `0.75ms`
- **Budgets operativos actuales:** discovery `< 2000ms`, cold `< 15000ms`, warm `< 1000ms`

## 3. Batch documental

- **Análisis + Document Symbols sobre 25 archivos de PFC Workspace:** `121.38ms`

## 4. Smoke sobre corpus reales

- **PFC Workspace smoke:** OK
- **PFC Solution smoke:** OK
- **legacy PBL dump smoke:** OK
- **STD_FC_OrderEntry smoke/perf/semantic baseline:** OK
- **PFC Solution extension smoke:** OK
- **PFC Workspace extension smoke:** OK

## 5. Conclusión

El baseline deja de apoyarse solo en fixtures pequeños. El presupuesto operativo del plugin ya está calibrado sobre corpus reales y la suite de regresión cubre activación, archivo activo, discovery, cold/warm index, corpus legacy exportado y un slot enterprise local sobre OrderEntry con smoke semántica reproducible.