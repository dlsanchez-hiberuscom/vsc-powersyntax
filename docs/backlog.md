# Backlog — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este backlog contiene trabajo pendiente priorizado del proyecto.

Debe mantenerse siempre alineado con:

- la constitución,
- el roadmap,
- la arquitectura vigente,
- el current focus,
- y el estado real del código.

---

## 2. Reglas de gestión

- No se listan features ya cerradas como si siguieran pendientes.
- No se reabre trabajo cerrado salvo bug o deuda real.
- Toda entrada debe ser concreta y accionable.
- El backlog debe priorizar la base antes que mejoras periféricas.
- Las features grandes deben dividirse en slices pequeños.

---

## 3. Backlog priorizado actual

## P0 — Crítico / base inmediata

### B001. Ajustar activación perezosa definitiva
Garantizar que la extensión no hace trabajo pesado al inicio y que la activación responde solo a uso real.

### B002. Consolidar wiring cliente ↔ servidor LSP
Dejar el bootstrap del LSP limpio, estable, observable y fácil de mantener.

### B003. Medición base de cold start y primer archivo
Añadir forma repetible de medir tiempos reales de carga y tiempo hasta primer servicio útil.

### B004. Estrategia de prioridad para archivo activo
Formalizar y aplicar prioridad estricta del archivo abierto frente al análisis global.

### B005. Esqueleto de índice incremental
Introducir la base del índice e invalidación fina sin todavía cerrar toda la semántica avanzada.

## P1 — Núcleo de valor inmediato

### B006. Document symbols robustos
### B007. Workspace symbols base
### B008. Go to definition fiable en casos base
### B009. Hover base con contexto útil
### B010. Diagnósticos iniciales bien delimitados

## P2 — Semántica y escalabilidad

### B011. Referencias seguras
### B012. Rename controlado
### B013. Caché persistente por workspace
### B014. Cancelación y debounce de tareas costosas
### B015. Validación sobre workspace grande real

## P3 — Profesionalización avanzada

### B016. Semantic tokens por scope
### B017. Signature help robusto
### B018. Owner-aware navigation
### B019. Diagnóstico de variables no usadas
### B020. Detección de shadowing

---

## 4. Entradas candidatas futuras

Estas entradas no deben pasar a prioridad alta sin justificación:

- vistas adicionales no esenciales,
- capacidades ornamentales sin valor técnico claro,
- features avanzadas de IA sin base consolidada,
- automatizaciones que no estén apoyadas en una arquitectura ya estable.

---

## 5. Regla de cierre

Una entrada del backlog solo puede cerrarse si:

- existe implementación real,
- pasa validación suficiente,
- la documentación afectada está actualizada,
- y su cierre queda reflejado en current-focus / roadmap si corresponde.
