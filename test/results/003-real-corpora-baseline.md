# Baseline de Rendimiento Real — PFC y legacy

**Fecha de medición:** 2026-05-01  
**Corpus:** PFC 2025 Workspace, PFC 2025 Solution, legacy PBL dump  
**Comando principal:** `npm run test:performance`

## 1. Archivo activo

- **Primer hover real sobre PFC Workspace:** `0.96ms`
- **Primer diagnostics real sobre PFC Workspace:** `0.77ms`
- **Budget operativo actual:** hover `< 50ms`, diagnostics `< 100ms`

## 2. Discovery e indexación

- **Discovery PFC Workspace:** `134.78ms` sobre `831` archivos
- **Indexación cold PFC Workspace:** `10473.00ms` con `23663` entidades
- **Indexación warm PFC Workspace:** `0.81ms`
- **Budgets operativos actuales:** discovery `< 2000ms`, cold `< 15000ms`, warm `< 1000ms`

## 3. Batch documental

- **Análisis + Document Symbols sobre 25 archivos de PFC Workspace:** `171.93ms`

## 4. Smoke sobre corpus reales

- **PFC Workspace smoke:** OK
- **PFC Solution smoke:** OK
- **legacy PBL dump smoke:** OK
- **PFC Solution extension smoke:** OK
- **PFC Workspace extension smoke:** OK

## 5. Conclusión

El baseline deja de apoyarse solo en fixtures pequeños. El presupuesto operativo del plugin ya está calibrado sobre corpus reales y la suite de regresión cubre activación, archivo activo, discovery, cold/warm index y corpus legacy exportado.