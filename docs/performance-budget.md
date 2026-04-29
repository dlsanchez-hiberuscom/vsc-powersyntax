# Performance Budget — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define los **presupuestos de rendimiento** del plugin: los límites y objetivos que deben guiar decisiones de diseño, detectar regresiones y asegurar que la experiencia del usuario sigue siendo rápida y fluida a medida que el plugin crece.

Los presupuestos no son reglas absolutas e inamovibles, pero toda violación debe justificarse, documentarse y tener plan de mitigación.

---

## 2. Principios

1. **El rendimiento es una restricción de diseño, no una optimización posterior.** Toda feature debe considerar su coste antes de implementarse.
2. **El archivo activo tiene presupuesto privilegiado.** La experiencia interactiva del editor no debe degradarse por trabajo global.
3. **Medir antes de optimizar.** No se asume mejora ni degradación sin evidencia.
4. **Los presupuestos escalan con la fase del roadmap.** Las fases tempranas son más estrictas; las avanzadas añaden trabajo pero con mitigaciones.

---

## 3. Presupuestos de activación

### 3.1 Cold start (arranque de VS Code sin archivos PB abiertos)

| Métrica | Presupuesto | Notas |
|---|---|---|
| Contribución de la extensión al arranque | **< 5 ms** | La extensión no debe activarse hasta que haya un archivo PB |
| Trabajo del Extension Host al arrancar | **0** | No debe ejecutarse código del plugin hasta activación |

### 3.2 Activación (primer archivo PowerBuilder abierto)

| Métrica | Presupuesto | Notas |
|---|---|---|
| Tiempo desde apertura hasta cliente LSP listo | **< 500 ms** | Incluye arranque del servidor |
| Tiempo hasta primer Document Symbols visible | **< 1 s** | Debe sentirse instantáneo para archivos pequeños |
| Tiempo hasta primer Hover disponible | **< 1 s** | |
| Tiempo hasta primera publicación de diagnósticos | **< 1.5 s** | Incluye debounce |

---

## 4. Presupuestos por operación (archivo activo)

### 4.1 Archivos pequeños (< 500 líneas)

| Operación | Presupuesto |
|---|---|
| Document Symbols | **< 50 ms** |
| Hover | **< 30 ms** |
| Diagnósticos | **< 100 ms** (sin debounce) |
| Análisis completo del documento | **< 100 ms** |

### 4.2 Archivos medianos (500–2000 líneas)

| Operación | Presupuesto |
|---|---|
| Document Symbols | **< 150 ms** |
| Hover | **< 50 ms** |
| Diagnósticos | **< 300 ms** |
| Análisis completo del documento | **< 300 ms** |

### 4.3 Archivos grandes (2000–10000 líneas)

| Operación | Presupuesto |
|---|---|
| Document Symbols | **< 500 ms** |
| Hover | **< 100 ms** |
| Diagnósticos | **< 1 s** |
| Análisis completo del documento | **< 1 s** |

> **Nota:** Los archivos PowerBuilder legacy pueden ser muy grandes. Un archivo de 10.000 líneas es un caso real en proyectos enterprise. El plugin debe mantener valor práctico incluso en estos escenarios.

---

## 5. Presupuestos de workspace

Estos presupuestos aplican ahora que existe descubrimiento de workspace e indexación global (implementados en Fases 2–3).

### 5.1 Workspace pequeño (< 100 archivos)

| Operación | Presupuesto |
|---|---|
| Descubrimiento de workspace | **< 1 s** |
| Indexación completa | **< 5 s** |
| Uso de memoria por índice | **< 50 MB** |

### 5.2 Workspace mediano (100–500 archivos)

| Operación | Presupuesto |
|---|---|
| Descubrimiento de workspace | **< 2 s** |
| Indexación completa | **< 15 s** |
| Uso de memoria por índice | **< 150 MB** |

### 5.3 Workspace grande (500–5000 archivos)

| Operación | Presupuesto |
|---|---|
| Descubrimiento de workspace | **< 5 s** |
| Indexación completa | **< 60 s** (incremental, cancelable) |
| Uso de memoria por índice | **< 500 MB** |
| Warm indexing (con caché persistente) | **< 10 s** |

> **Nota:** Un proyecto PowerBuilder enterprise puede tener miles de objetos. La indexación debe ser incremental y cancelable; estos presupuestos son para el caso completo. El warm indexing debe ser significativamente más rápido gracias a la caché persistente.

---

## 6. Presupuestos de memoria

| Recurso | Presupuesto |
|---|---|
| Memoria base del servidor LSP (sin documentos) | **< 30 MB** |
| Caché por documento abierto (archivo mediano) | **< 1 MB** |
| Total del servidor con 10 archivos abiertos | **< 80 MB** |
| Pico durante indexación de workspace mediano | **< 200 MB** |

---

## 7. Presupuestos de latencia interactiva

Estos presupuestos protegen la sensación de fluidez del editor.

| Criterio | Presupuesto |
|---|---|
| El editor no debe "congelarse" al escribir | **Nunca** |
| El servidor no debe bloquear respuestas interactivas por trabajo global | **Nunca** |
| Toda operación costosa debe ser cancelable | **Siempre** |
| Debounce mínimo para diagnósticos al editar | **200–500 ms** |
| Toda tarea > 1 s debe poder reportar progreso | **Siempre** |

---

## 8. Estrategia de medición

### 8.1 Qué medir ahora (Fase 1–2)

- tiempo de activación del cliente,
- tiempo desde apertura de archivo hasta primer Document Symbols,
- tiempo hasta primer Hover,
- tiempo hasta primera publicación de diagnósticos,
- tiempo de análisis por documento (por tamaño),
- y memoria base del servidor.

### 8.2 Cómo medir

| Método | Cuándo usar |
|---|---|
| `console.time` / `console.timeEnd` | Mediciones rápidas durante desarrollo |
| `performance.now()` en el servidor | Mediciones precisas de operaciones LSP |
| Performance tests automatizados | Verificación repetible en CI |
| VS Code Developer Tools (F12) | Inspección de activación y Extension Host |
| `--prof` / heap snapshots | Análisis profundo de memory leaks o CPU hotspots |

### 8.3 Cuándo medir

- al cerrar un item del backlog relacionado con rendimiento,
- al cerrar una fase del roadmap,
- cuando se sospeche una regresión,
- y antes de publicar una release.

---

## 9. Política de regresión

Una regresión de rendimiento es:

- un aumento > 50% en tiempo de una operación respecto a la medición anterior,
- un aumento > 30% en memoria base del servidor,
- un bloqueo visible del editor que antes no existía,
- o la pérdida de la capacidad de cancelar una operación costosa.

Ante una regresión:

1. documentar la medición antes/después,
2. identificar la causa,
3. decidir si se revierte, se mitiga o se acepta con justificación,
4. y registrar la decisión en la spec o documento técnico correspondiente.

---

## 10. Evolución del presupuesto

Los presupuestos deben revisarse y ajustarse cuando:

- se cierre una fase del roadmap que añada trabajo nuevo (ej: indexación global),
- se midan valores reales sobre corpus representativos,
- cambien las capacidades del servidor (ej: nuevo pipeline de parsing),
- o la experiencia real del usuario contradiga los presupuestos teóricos.

Los presupuestos de workspace (§5) son estimaciones iniciales y deberán calibrarse con datos reales sobre PFC 2025 y otros corpus cuando se alcance la Fase 8.

---

## 11. Relación con otros documentos

- `docs/constitution.md` (Art. I) establece rendimiento como principio no negociable.
- `docs/architecture.md` (§4.6, §11) define las métricas de validación arquitectónica.
- `docs/testing.md` (§3.4) define los performance tests que verifican estos presupuestos.
- `docs/roadmap.md` (§11) exige revisión de rendimiento en todas las fases.
