# Constitución — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Esta constitución define las reglas no negociables del repositorio.

Gobierna todo el trabajo:
- manual,
- asistido por IA,
- de arquitectura,
- de implementación,
- de validación,
- y de documentación.

Si hay conflicto entre velocidad aparente, atajos locales o decisiones improvisadas y esta constitución, **prevalece la constitución**.

---

## 2. Meta maestra del producto

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda decisión técnica debe proteger simultáneamente:

1. descubrimiento rápido,
2. indexación progresiva no bloqueante,
3. prioridad real al archivo activo,
4. latencia interactiva baja,
5. persistencia útil entre sesiones,
6. estado observable del motor,
7. y semántica fuerte sin sacrificar tiempo hasta valor.

---

## 3. Principios no negociables

### Artículo 1 — Rendimiento primero
Ningún cambio debe degradar de forma injustificada:
- carga,
- activación,
- latencia interactiva,
- o comportamiento en workspaces grandes.

### Artículo 2 — Cliente fino, servidor pesado
El cliente de VS Code debe ser mínimo.
Toda lógica costosa de:
- análisis,
- indexación,
- semántica,
- resolución,
- diagnósticos,
- o procesamiento intensivo
debe vivir fuera del camino crítico del Extension Host.

### Artículo 3 — Activación perezosa obligatoria
La extensión solo debe activarse cuando exista una necesidad real.
Se prohíben activaciones globales innecesarias o trabajo pesado en arranque.

### Artículo 4 — El archivo activo tiene prioridad
El orden obligatorio de prioridad es:
1. archivo activo,
2. dependencias inmediatas,
3. contexto cercano,
4. trabajo global en segundo plano.

### Artículo 5 — Incrementalidad fina obligatoria
No se debe recomputar más de lo necesario.
Todo cambio debe intentar provocar la recomputación mínima posible.

### Artículo 6 — Cancelación, yielding y no bloqueo
Toda tarea costosa debe diseñarse para:
- ceder,
- cancelarse,
- pausarse,
- o reprogramarse
cuando afecte a la interacción del usuario.

### Artículo 7 — Estado semántico atómico
El sistema no debe exponer estados semánticos a medias.
No se permite publicar mezclas incoherentes de análisis viejo y nuevo.

### Artículo 8 — Degradación segura antes que precisión fingida
Si una feature no tiene suficiente contexto o confianza, debe:
- degradar explícitamente,
- o bloquearse,
antes que devolver resultados aparentemente precisos pero no fiables.

### Artículo 9 — Persistencia robusta y versionada
Toda persistencia relevante debe tener:
- versionado,
- invalidación clara,
- estrategia de recuperación,
- y comportamiento seguro ante corrupción o incompatibilidad.

### Artículo 10 — Observabilidad obligatoria
Toda parte crítica del motor debe exponer estado suficiente para:
- entender qué está haciendo,
- medir progreso,
- depurar problemas,
- y explicar resultados cuando sea necesario.

### Artículo 11 — Fuente única de verdad semántica
Ninguna feature debe reconstruir por su cuenta:
- símbolos,
- scopes,
- resolución,
- tipos,
- referencias,
si ya existe una capa común para ello.

### Artículo 12 — El core del dominio es agnóstico del editor
El modelo interno de PowerBuilder no debe depender directamente de:
- VS Code,
- LSP,
- DTOs externos,
- JSON de integración,
- ni herramientas de IA concretas.

Todo eso debe resolverse en adaptadores de borde.

### Artículo 13 — La spec manda
Todo cambio funcional, arquitectónico u operativo relevante debe estar respaldado por una spec.
Si cambia la intención, primero se corrige la spec y después el código.

### Artículo 14 — La documentación es parte del cambio
Ningún cambio relevante está terminado si no actualiza la documentación afectada.

Como mínimo revisar cuando aplique:
- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- specs afectadas

### Artículo 15 — Nada se cierra en parcial
Una tarea no está cerrada si falta cualquiera de estos puntos:
- implementación funcional,
- validación suficiente,
- documentación alineada,
- criterios de aceptación cumplidos,
- estado reflejado correctamente en los documentos canónicos.

### Artículo 16 — La IA no puede inventar alcance
La IA puede ayudar a:
- especificar,
- planificar,
- implementar,
- probar,
- documentar.

Pero no puede:
- inventar features no pedidas,
- cerrar trabajo sin validación,
- omitir documentación afectada,
- ni presentar como implementado algo que solo es intención o estado parcial.

### Artículo 17 — Bootstrap temporal, nunca permanente por inercia
Toda solución provisional debe:
- identificarse como provisional,
- tener límites claros,
- no absorber responsabilidades permanentes,
- y tener una dirección razonable de migración.

---

## 4. Regla de decisión arquitectónica

Si existen varias alternativas, se elige la que mejor cumpla este orden:

1. menor impacto en carga y arranque,
2. menor coste para el Extension Host,
3. mayor atomicidad y menor riesgo de incoherencia,
4. mejor incrementalidad e invalidación fina,
5. mejor separación de responsabilidades,
6. mayor facilidad de prueba,
7. mejor persistencia y reanudación,
8. mejor observabilidad,
9. mejor escalabilidad,
10. mejor compatibilidad futura con automatización e IA.

---

## 5. Definición de Ready

Una tarea está **Ready** cuando:

- la intención está clara,
- el alcance y fuera de alcance están claros,
- los criterios de aceptación son verificables,
- el plan técnico es suficiente,
- los riesgos principales son entendibles,
- y el trabajo puede dividirse en slices razonables.

---

## 6. Definición de Done

Una tarea está **Done** solo cuando:

- cumple criterios de aceptación,
- pasa validación suficiente,
- no introduce degradación injustificada,
- la documentación afectada está actualizada,
- el estado real coincide con spec y documentación canónica,
- y no deja deuda crítica oculta sin registrar.

---

## 7. Autoridad documental

En caso de conflicto, manda este orden:

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs aprobadas en `specs/`
4. `docs/architecture-status.md`
5. `docs/current-focus.md`
6. `docs/backlog.md`
7. `docs/roadmap.md`
8. `docs/done-log.md`
9. implementación actual

El código funcionando no invalida por sí solo una decisión documental vigente.
Si el código diverge, debe documentarse y corregirse.

---

## 8. Regla operativa para IA

La IA debe trabajar siempre así:

1. leer constitución, arquitectura, spec y current-focus antes de cambios relevantes;
2. respetar el foco vigente;
3. no abrir nuevas capas si la base actual no las sostiene;
4. trabajar en slices pequeños y verificables;
5. actualizar documentación afectada;
6. no cerrar nada en parcial;
7. registrar deuda nueva si detecta un problema real.

---

## 9. Excepciones

Toda excepción debe:
- justificarse explícitamente,
- documentarse,
- indicar alcance,
- indicar duración,
- explicar riesgo asumido,
- y dejar plan de salida.

No se permiten excepciones silenciosas.
