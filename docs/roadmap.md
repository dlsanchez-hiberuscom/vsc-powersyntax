# Roadmap — Plugin PowerBuilder 2025 para VS Code

## 1. Objetivo del roadmap

Este roadmap organiza la evolución del plugin en fases orientadas a entregar valor real sin comprometer la base técnica.

La prioridad estratégica del proyecto es:

1. fortalecer muchísimo la base,
2. garantizar velocidad de carga y estabilidad,
3. cubrir el núcleo profesional del lenguaje,
4. escalar correctamente en proyectos grandes,
5. y después ampliar capacidades avanzadas.

---

## 2. Principios de priorización

Se prioriza siempre, en este orden:

1. rendimiento y carga,
2. robustez arquitectónica,
3. calidad del núcleo semántico,
4. experiencia del archivo abierto,
5. validación real sobre workspaces grandes,
6. documentación canónica alineada,
7. capacidades avanzadas adicionales.

---

## 3. Fases del roadmap

## Fase 0 — Bootstrap profesional

Objetivo: dejar una base limpia y profesional.

Entregables esperados:

- manifiesto bien definido,
- estructura cliente / servidor / shared,
- wiring LSP mínimo,
- docs base del repositorio,
- constitución y flujo SDD,
- build y test base.

## Fase 1 — Carga rápida y activación correcta

Objetivo: asegurar arranque limpio y activación perezosa.

Entregables esperados:

- activación mínima,
- cliente ligero,
- sin trabajo pesado en startup,
- comandos mínimos,
- ciclo de vida correcto del LSP,
- primeras validaciones de carga.

## Fase 2 — Núcleo sintáctico y estructura del lenguaje

Objetivo: cubrir correctamente el soporte básico del lenguaje.

Entregables esperados:

- gramática sólida,
- configuración de lenguaje,
- tokens básicos,
- parseo base,
- modelado inicial de archivos y símbolos.

## Fase 3 — Núcleo semántico inicial

Objetivo: habilitar navegación y análisis base de valor real.

Entregables esperados:

- símbolos por archivo,
- definition,
- document symbols,
- workspace symbols,
- hover básico,
- diagnósticos iniciales.

## Fase 4 — Indexación incremental y rendimiento real

Objetivo: escalar correctamente en workspaces grandes.

Entregables esperados:

- índice incremental,
- invalidación fina,
- prioridades de archivo activo,
- colas y cancelación,
- persistencia de caché,
- pruebas sobre corpus real.

## Fase 5 — Semántica avanzada profesional

Objetivo: acercar el plugin a un nivel profesional sólido.

Entregables esperados:

- references robusto,
- rename seguro,
- owner-aware navigation,
- tipos en dot notation,
- signature help,
- semantic tokens por scope.

## Fase 6 — Diagnósticos y calidad de código

Objetivo: aportar valor directo al desarrollador en calidad y mantenimiento.

Entregables esperados:

- variables no usadas,
- shadowing,
- usos sospechosos,
- reglas configurables,
- quick fixes selectivos cuando aplique.

## Fase 7 — Hardening y explotación avanzada

Objetivo: consolidar producto y abrir superficie avanzada de valor.

Entregables esperados:

- hardening del motor,
- pruebas de regresión amplias,
- contratos públicos internos bien definidos,
- soporte mejorado para automatización e IA,
- documentación avanzada.

---

## 4. Estado actual esperado del roadmap

Estado de referencia del proyecto:

- Fase 0: en curso / consolidación inicial.
- Fase 1: prioridad inmediata.
- Fases 2–4: siguientes objetivos naturales.
- Fases 5–7: solo tras base suficientemente robusta.

---

## 5. Regla de avance entre fases

No se debe avanzar de forma agresiva a la siguiente fase si la anterior no está razonablemente consolidada.

Consolidar significa:

- implementación estable,
- validación mínima real,
- impacto en rendimiento controlado,
- documentación actualizada,
- y backlog ajustado al estado real.

---

## 6. Política de revisión del roadmap

El roadmap debe revisarse y actualizarse cada vez que:

- se cierra una fase relevante,
- cambia la arquitectura,
- aparecen bloqueos técnicos graves,
- cambian prioridades de producto,
- o una validación real obliga a replantear el orden.
