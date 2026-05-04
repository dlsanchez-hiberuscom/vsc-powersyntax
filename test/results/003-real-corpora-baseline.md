# Baseline de Rendimiento Real — PFC, legacy y OrderEntry

**Fecha de medición:** 2026-05-03  
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

## 5. Baseline catalog-driven por dominio

- **Corpus cubiertos:** PFC Solution, legacy PBL dump, STD_FC_OrderEntry
- **Surfaces cubiertas:** `hover`, `completion`, `diagnostics`
- **Dominios revisados en probes reales:** `system-globals`, `global-functions`, `datawindow-functions`
- **Misses:** `0`
- **Ambigüedades:** `0`
- **Budget violations:** `0`

## 6. Baseline enum corpus-driven sobre valores con `!`

- **Total detectado:** `13068`
- **Catalogados:** `1554` (`724` oficiales, `830` curados)
- **Unknown:** `5296`
- **Candidates:** `0`
- **False positives textuales:** `6214`
- **Out-of-context:** `4`
- **Duración de scan tras indexación:** PFC Solution `3354.59ms`, STD_FC_OrderEntry `5467.14ms`, legacy PBL dump `138.78ms`
- **Familias encaminadas a `B368/B370`:** `contemporarymenu!`, `contemporarytoolbar!`, `HourGlass!`, `OK!`, `Information!`, `Exclamation!`, `ansi!`, `swiss!`, `Exclude!`

## 7. Conclusión

El baseline deja de apoyarse solo en fixtures pequeños. El presupuesto operativo del plugin ya está calibrado sobre corpus reales y la suite de regresión cubre activación, archivo activo, discovery, cold/warm index, corpus legacy exportado, un slot enterprise local sobre OrderEntry con smoke semántica reproducible, una baseline catalog-driven separada por dominio/surface para PFC, OrderEntry y legacy y ahora también un reporte corpus-driven específico para valores con `!` que distingue cobertura catalogada, ruido textual y gaps reales sin promocionarlos automáticamente al catálogo.