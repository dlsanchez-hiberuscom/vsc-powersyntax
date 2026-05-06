# Developer Workflows — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define los **flujos operativos de desarrollo** del plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> ¿Qué pasos debe seguir un desarrollador para abrir, modificar, probar, depurar y validar el plugin de forma segura y consistente?

La arquitectura objetivo vive en `docs/architecture.md`. La estrategia de pruebas vive en `docs/testing.md`. Los presupuestos de rendimiento viven en `docs/performance-budget.md`. El trabajo accionable vive en `docs/backlog.md` y el foco inmediato en `docs/current-focus.md`.

---

## 2. Principios de trabajo

### 2.1. Trabajar desde el foco activo

Antes de modificar código o documentación, revisar:

```text
docs/current-focus.md
docs/backlog.md
docs/architecture-status.md
```

El objetivo es evitar trabajar sobre tareas fuera de foco o reabrir decisiones ya cerradas.

### 2.2. Cambios pequeños, validables y documentados

Cada cambio debe poder explicarse, probarse y documentarse. Si un cambio afecta arquitectura, testing, performance, IA o workflows, se deben actualizar los documentos correspondientes.

### 2.3. Separar operación de diseño

Este documento explica **cómo trabajar**. No debe convertirse en arquitectura, backlog, roadmap ni testing profundo.

### 2.4. No tocar históricos congelados salvo instrucción explícita

Durante la fase actual de normalización documental, no modificar:

```text
docs/done-log.md
docs/architecture-implementation-map.md
```

Pueden consultarse como histórico/evidencia, pero no normalizarse todavía.

---

## 3. Flujo 1 — Preparar entorno de desarrollo

### Objetivo

Dejar el repositorio listo para compilar, probar y depurar el plugin.

### Pasos

1. Clonar o actualizar el repositorio.
2. Instalar dependencias.
3. Revisar versión de Node/npm requerida por el proyecto.
4. Ejecutar typecheck/build inicial.
5. Ejecutar smoke tests mínimos.
6. Abrir VS Code en modo desarrollo si aplica.

### Validación mínima

```text
- El proyecto instala dependencias sin error.
- El código compila o typecheck pasa.
- Los tests rápidos pasan.
- La extensión puede arrancar en Extension Development Host si aplica.
```

### Documentos relacionados

```text
docs/testing.md
docs/performance-budget.md
```

---

## 4. Flujo 2 — Abrir un workspace PowerBuilder y validar activación

### Objetivo

Comprobar que el plugin detecta correctamente un proyecto PowerBuilder y arranca sus componentes básicos.

### Pasos

1. Abrir un workspace fixture o proyecto real controlado.
2. Verificar que la extensión se activa solo cuando corresponde.
3. Verificar que el cliente VS Code arranca el Language Client.
4. Verificar que el Language Server inicia sin errores críticos.
5. Abrir un fichero PowerScript.
6. Comprobar logs básicos de activación, discovery y sincronización de documento.

### Validación mínima

```text
- La extensión se activa en workspace PowerBuilder.
- El servidor LSP arranca.
- El documento se sincroniza.
- No aparecen errores críticos en output/logs.
- La activación no bloquea perceptiblemente VS Code.
```

---

## 5. Flujo 3 — Desarrollar una feature LSP

### Objetivo

Añadir o modificar una feature como hover, completion, signature help, definition, references, diagnostics, document symbols o semantic tokens.

### Pasos

1. Revisar arquitectura objetivo de providers en `docs/architecture.md`.
2. Revisar estado actual en `docs/architecture-status.md`.
3. Confirmar si existe trabajo accionable en `docs/backlog.md`.
4. Implementar cambios en provider/formatter/result model sin duplicar resolución semántica.
5. Consumir `RequestContext`, `SemanticQueryFacade` y caches cuando aplique.
6. Añadir o actualizar tests según `docs/testing.md`.
7. Validar budgets si afecta hot path.
8. Actualizar documentación afectada.

### Validación mínima

```text
- El provider no reimplementa resolución global si ya existe en la fachada semántica.
- El handler LSP sigue siendo fino.
- Hay test unitario/contract/integration según riesgo.
- No se rompe budget de performance si es hot path.
- La documentación afectada queda alineada.
```

---

## 6. Flujo 4 — Modificar parser, indexer o symbol graph

### Objetivo

Cambiar la base semántica sin romper navegación, diagnostics ni providers LSP.

### Pasos

1. Identificar qué capa se modifica: parser, indexer, workspace model o symbol graph.
2. Revisar contratos en `docs/architecture.md`.
3. Añadir fixtures mínimos que reproduzcan el caso.
4. Implementar cambio con tolerancia a documentos incompletos.
5. Validar invalidación incremental.
6. Ejecutar tests unitarios y de integración.
7. Ejecutar performance smoke si afecta workspace/indexación.

### Validación mínima

```text
- Parser mantiene recuperación ante errores.
- Indexer invalida solo lo necesario.
- Symbol graph conserva identidades estables.
- Providers consumidores siguen funcionando.
- No hay regresión en apertura/indexación de workspace representativo.
```

---

## 7. Flujo 5 — Modificar Cache Layer

### Objetivo

Añadir o modificar caches sin introducir datos obsoletos, fugas de memoria ni respuestas incorrectas.

### Pasos

1. Justificar qué coste evita la cache.
2. Definir contrato: owner, scope, key, value, lifecycle, invalidation, metrics y fallback.
3. Implementar cache aislada y testeable.
4. Añadir tests de hit, miss, invalidation y eviction si aplica.
5. Añadir métricas mínimas.
6. Validar hot path afectado.
7. Actualizar `docs/performance-budget.md` si cambia un budget o métrica.

### Validación mínima

```text
- La cache no devuelve datos para versión incorrecta.
- La invalidación está probada.
- Existe fallback seguro.
- Hay métricas de hit/miss.
- No aumenta memoria sin límite.
```

---

## 8. Flujo 6 — Trabajar con DataWindow

### Objetivo

Modificar soporte DataWindow sin mezclarlo indebidamente con el parser PowerScript principal.

### Pasos

1. Revisar modelo DataWindow objetivo en `docs/architecture.md`.
2. Identificar si el cambio afecta extractor, parser, model, SQL model, binding resolver, cache o provider.
3. Añadir fixture DataWindow específico.
4. Implementar en el subdominio DataWindow correspondiente.
5. Integrar por fachada semántica o provider, no mediante lógica dispersa.
6. Añadir tests de modelo, binding, cache y provider si aplica.
7. Validar budgets de DataWindow si afecta hot path.

### Validación mínima

```text
- DataWindow sigue siendo subdominio propio.
- No se parsean todas las DataWindows para una request interactiva simple.
- Los bindings tienen tests.
- La cache DataWindow invalida por source/hash.
```

---

## 9. Flujo 7 — Trabajar con ORCA o PBAutoBuild

### Objetivo

Integrar herramientas externas sin acoplarlas al core semántico ni bloquear el servidor LSP.

### Pasos

1. Confirmar si el cambio afecta adapter, locator, runner, parser o mapper.
2. Implementar detrás de una interfaz aislada.
3. Añadir fakes/mocks para tests.
4. Probar herramienta disponible y no disponible.
5. Mapear errores a modelos internos.
6. Evitar ejecución en hot paths interactivos.
7. Documentar workflow si afecta al usuario.

### Validación mínima

```text
- La ausencia de herramienta externa no rompe el servidor.
- La operación larga es cancelable o controlada.
- Los errores se mapean sin exponer salida cruda innecesaria.
- Hay tests con fake/mock.
```

---

## 10. Flujo 8 — Ejecutar pruebas antes de cerrar cambios

### Objetivo

Asegurar que el cambio no introduce regresiones.

### Pasos recomendados

```text
1. Ejecutar static/typecheck.
2. Ejecutar unit tests afectados.
3. Ejecutar contract tests si cambia una interfaz.
4. Ejecutar integration tests si cambia interacción entre capas.
5. Ejecutar smoke tests si afecta activación, LSP o comandos críticos.
6. Ejecutar performance tests si afecta hot paths, cache, indexación o DataWindow.
7. Ejecutar E2E solo cuando afecte interacción real con VS Code.
```

Los nombres exactos de comandos pueden variar. La separación conceptual debe seguir `docs/testing.md`.

### Validación mínima

```text
- Pasa la suite mínima aplicable.
- Los fallos se corrigen o quedan documentados como bloqueo real.
- No se cierran cambios con tests relevantes omitidos sin justificación.
```

---

## 11. Flujo 9 — Depurar cliente VS Code

### Objetivo

Diagnosticar problemas de activación, comandos, vistas, configuración o Language Client.

### Pasos

1. Arrancar Extension Development Host.
2. Revisar consola del Extension Host.
3. Revisar output channel del plugin si existe.
4. Verificar eventos de activación.
5. Verificar registro de comandos y vistas.
6. Verificar arranque y parada del Language Client.
7. Confirmar que el cliente no ejecuta trabajo pesado.

### Señales de problema

```text
- Activación demasiado temprana.
- Comandos no registrados.
- Language Client no arranca.
- Logs de cliente con errores de configuración.
- Trabajo pesado ejecutándose en Extension Host.
```

---

## 12. Flujo 10 — Depurar Language Server

### Objetivo

Diagnosticar problemas de parsing, indexación, providers, diagnostics, caches o integración externa.

### Pasos

1. Activar logs del servidor.
2. Reproducir con fixture mínimo.
3. Identificar request LSP afectada.
4. Revisar `traceId` o logs equivalentes si existen.
5. Separar si el fallo está en handler, provider, semantic facade, cache o domain model.
6. Añadir test antes o junto al fix.
7. Validar que no se introducen resultados obsoletos.

### Señales de problema

```text
- Reparseo excesivo.
- Cache hit incorrecto.
- Diagnostics de versión anterior.
- Resolución semántica duplicada.
- Handler LSP con demasiada lógica.
- Bloqueos en operaciones externas.
```

---

## 13. Flujo 11 — Revisar rendimiento

### Objetivo

Detectar y corregir regresiones de latencia, memoria o indexación.

### Pasos

1. Identificar hot path afectado.
2. Consultar budget en `docs/performance-budget.md`.
3. Medir latencia antes/después.
4. Revisar cache hit/miss.
5. Revisar invalidación.
6. Confirmar que no hay lectura de disco innecesaria en hot path.
7. Añadir performance smoke si el riesgo es recurrente.

### Validación mínima

```text
- La métrica queda dentro de presupuesto o existe fallback justificado.
- La regresión queda protegida por test/medición.
- No se introduce trabajo global en request interactiva.
```

---

## 14. Flujo 12 — Modificar documentación

### Objetivo

Actualizar documentación sin duplicar fuentes de verdad.

### Pasos

1. Revisar `docs/constitution.md`.
2. Identificar documento propietario del tema.
3. Modificar la fuente canónica.
4. Sustituir duplicados por enlaces en documentos relacionados.
5. No tocar documentos congelados salvo instrucción explícita.
6. Validar enlaces relativos.
7. Indicar siguiente documento o bloque si aplica.

### Validación mínima

```text
- Cada documento mantiene un papel claro.
- No se duplican specs, arquitectura, roadmap o histórico.
- Los documentos afectados quedan alineados.
```

---

## 15. Flujo 13 — Trabajar con agentes IA

### Objetivo

Usar agentes IA sin perder contexto ni romper la estructura documental.

### Pasos

1. Dar al agente `docs/constitution.md` como regla principal.
2. Indicar el documento o bloque exacto a modificar.
3. Especificar documentos congelados si aplica.
4. Pedir revisión final de duplicidades, enlaces y documentación afectada.
5. Exigir que no cree documentos nuevos salvo necesidad justificada.
6. Pedir que actualice backlog/current-focus si genera trabajo accionable.

### Validación mínima

```text
- El agente no duplica fuentes de verdad.
- El agente no deja trabajo accionable fuera de backlog/specs.
- El agente actualiza documentación afectada.
- El agente no toca done-log ni mapa si están congelados.
```

---

## 16. Checklist antes de commit

```text
[ ] El cambio parte de current-focus/backlog o tiene justificación clara.
[ ] La arquitectura afectada sigue alineada con architecture.md.
[ ] El estado afectado queda reflejado en architecture-status.md si aplica.
[ ] Hay tests adecuados según docs/testing.md.
[ ] No se rompe performance-budget.md.
[ ] No se duplica documentación.
[ ] No se toca done-log.md ni architecture-implementation-map.md salvo instrucción explícita.
[ ] Los comandos/workflows afectados están documentados.
[ ] El cambio es pequeño y revisable.
```

---

## 17. Checklist antes de cerrar una tarea

```text
[ ] Código implementado o documentación normalizada.
[ ] Tests aplicables ejecutados.
[ ] Performance validada si aplica.
[ ] Documentación afectada actualizada.
[ ] Backlog/current-focus alineados si aplica.
[ ] No quedan TODOs o workarounds sin registrar.
[ ] El resultado se puede explicar en una frase.
[ ] El siguiente paso queda claro.
```

---

## 18. Relación con backlog y specs

Este documento no lista specs concretas. Si un workflow revela una tarea pendiente, debe moverse a:

```text
docs/backlog.md
docs/specs/
```

Si un workflow cambia por una tarea concreta, actualizar aquí solo la parte operativa estable, no el detalle de la spec.

---

## 19. Límites de este documento

Este documento no debe usarse para:

- definir arquitectura objetivo completa;
- guardar backlog;
- listar specs por ID;
- registrar histórico cerrado;
- repetir estrategia de testing completa;
- repetir budgets extensos;
- almacenar prompts largos;
- sustituir documentación IA.
