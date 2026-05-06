# Testing — Plugin PowerBuilder 2025 para VS Code

> **Estado:** documento canónico de estrategia de pruebas.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** estrategia de validación, niveles de test, fixtures, corpora, gates, regresión y relación con performance.  
> **No contiene:** arquitectura completa, backlog detallado, specs concretas, histórico cerrado ni roadmap estratégico.  
> **Documentos relacionados:** `docs/constitution.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/performance-budget.md`, `docs/developer-workflows.md`, `docs/backlog.md`.

---

## 1. Propósito

Este documento define la **estrategia de testing** del plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> ¿Cómo validamos que el plugin sigue siendo rápido, correcto, estable y mantenible al evolucionar parsing, indexación, semántica, cachés, providers LSP, DataWindow e integraciones externas?

La arquitectura objetivo vive en `docs/architecture.md`. Los presupuestos de rendimiento viven en `docs/performance-budget.md`. El trabajo accionable vive en `docs/backlog.md` o en specs bajo `docs/specs/`.

---

## 2. Principios de testing

### 2.1. Testear primero lo que rompe el producto

La prioridad de testing debe seguir el riesgo real del plugin:

1. activación y arranque del servidor;
2. apertura de workspace;
3. parsing tolerante;
4. indexación incremental;
5. resolución semántica;
6. cachés e invalidación;
7. providers LSP interactivos;
8. diagnostics;
9. DataWindow;
10. integraciones externas;
11. rendimiento y regresión.

### 2.2. El test debe seguir la arquitectura

Cada capa debe ser testeable de forma aislada. No se debe depender de VS Code completo para validar lógica pura de parsing, indexación, resolución, cache, formatting o diagnostics.

### 2.3. Tests rápidos por defecto

Los tests que se ejecutan en cada iteración deben ser rápidos y deterministas. Los tests pesados con corpora grandes, performance o integración externa deben estar separados y etiquetados.

### 2.4. Performance también se prueba

Cualquier cambio que afecte hot paths, caches, indexación, DataWindow o diagnostics debe validar que no rompe los presupuestos definidos en `docs/performance-budget.md`.

### 2.5. No cerrar sin regresión mínima

Una tarea técnica no debe cerrarse si no deja al menos una prueba que proteja el comportamiento modificado, salvo cambios puramente documentales.

---

## 3. Pirámide de testing

```text
E2E VS Code / Extension Host
  └─ pocos, críticos, más lentos

Integration Tests
  └─ servidor LSP, workspace, indexación, providers conectados

Contract Tests
  └─ interfaces entre capas, adapters, cache contracts, semantic facade

Unit Tests
  └─ parser, resolvers, formatters, caches, utilities

Static / Lint / Typecheck
  └─ siempre rápidos y obligatorios
```

---

## 4. Tipos de prueba

### 4.1. Static checks

Deben validar:

- TypeScript compile/typecheck;
- lint si está configurado;
- imports inválidos;
- errores de formato crítico si aplica;
- ausencia de código muerto evidente en paths críticos.

**Cuándo ejecutar:** en cada cambio de código.

---

### 4.2. Unit tests

Deben cubrir lógica pura:

- parser y tokenización;
- normalización de paths;
- resolución de scopes;
- resolución de símbolos;
- ranking/filtrado de completion;
- formatting de hover/signature/diagnostics;
- invalidación de caches;
- modelos DataWindow;
- parsers de salida de herramientas externas.

**Regla:** un unit test no debe arrancar VS Code ni depender de procesos externos reales.

---

### 4.3. Contract tests

Deben validar contratos entre capas:

- `RequestContext`;
- `SemanticQueryFacade`;
- cache contracts;
- provider result models;
- diagnostics model;
- workspace/index API;
- DataWindow binding API;
- ORCA/PBAutoBuild adapters con fakes.

**Regla:** si una capa publica una interfaz consumida por varias features, debe tener contract tests.

---

### 4.4. Integration tests

Deben validar flujos con varias capas conectadas:

- abrir workspace fixture;
- descubrir targets/libraries/sources;
- parsear e indexar documentos;
- resolver hover/completion/signature/definition/references;
- publicar diagnostics;
- actualizar índices tras cambio de fichero;
- invalidar caches correctamente.

**Regla:** integration tests pueden usar fixtures reales, pero deben seguir siendo deterministas.

---

### 4.5. Smoke tests

Deben confirmar que el producto sigue arrancando y respondiendo lo básico:

- extensión activa en workspace PowerBuilder;
- servidor LSP arranca;
- documento PowerScript abre sin error crítico;
- hover básico responde;
- completion básico responde;
- diagnostics no publican datos obsoletos;
- comandos críticos existen.

**Regla:** smoke tests deben ser pocos, estables y rápidos.

---

### 4.6. Performance tests

Deben validar budgets de `docs/performance-budget.md`:

- latencia de hover;
- latencia de completion;
- latencia de signature help;
- latencia de diagnostics documento abierto;
- indexación incremental;
- cache hit/miss;
- rehidratación de cache persistente si aplica;
- apertura de workspace representativo.

**Regla:** los tests de performance deben guardar métricas comparables y no mezclarse con unit tests rápidos.

---

### 4.7. E2E tests

Deben validar solo flujos críticos de VS Code:

- activación real de extensión;
- comandos principales;
- interacción básica con Language Client/Server;
- vistas o status si existen;
- comportamiento mínimo de usuario final.

**Regla:** E2E debe ser limitado. La lógica profunda debe probarse antes en unit/contract/integration.

---

## 5. Matriz por área funcional

| Área | Unit | Contract | Integration | Smoke | Performance | E2E |
|---|---:|---:|---:|---:|---:|---:|
| Activación cliente | Bajo | Medio | Medio | Alto | Bajo | Alto |
| Server bootstrap | Medio | Alto | Alto | Alto | Medio | Medio |
| Workspace discovery | Medio | Alto | Alto | Alto | Alto | Bajo |
| Parser | Alto | Medio | Alto | Medio | Medio | Bajo |
| Indexer | Alto | Alto | Alto | Medio | Alto | Bajo |
| Symbol Graph | Alto | Alto | Alto | Medio | Medio | Bajo |
| Semantic Query Facade | Alto | Alto | Alto | Medio | Medio | Bajo |
| Cache Layer | Alto | Alto | Alto | Medio | Alto | Bajo |
| Hover | Medio | Alto | Alto | Alto | Alto | Medio |
| Completion | Medio | Alto | Alto | Alto | Alto | Medio |
| Signature Help | Medio | Alto | Alto | Medio | Medio | Bajo |
| Definition/References | Medio | Alto | Alto | Medio | Medio | Bajo |
| Diagnostics | Alto | Alto | Alto | Alto | Alto | Medio |
| Semantic Tokens | Medio | Alto | Alto | Medio | Medio | Bajo |
| DataWindow | Alto | Alto | Alto | Medio | Alto | Bajo |
| ORCA/PBAutoBuild adapters | Alto | Alto | Medio | Bajo | Medio | Bajo |

---

## 6. Fixtures y corpora

### 6.1. Tipos de fixtures

El repositorio debe mantener fixtures de varios tamaños:

```text
small fixtures
  → casos mínimos y unitarios

medium fixtures
  → objetos relacionados, herencia, eventos, funciones, DataWindows

large corpora
  → proyectos reales o representativos para indexación, performance y regresión
```

### 6.2. Reglas de fixtures

- Deben ser deterministas.
- Deben tener propósito claro.
- Deben evitar datos sensibles.
- Deben ser lo bastante pequeños para tests rápidos cuando sea posible.
- Los corpora grandes deben ejecutarse en suites separadas.
- Cada fixture relevante debe tener README o descripción mínima.

### 6.3. Casos mínimos obligatorios

Debe existir cobertura para:

- función de sistema;
- función de usuario;
- evento de usuario;
- variable local;
- variable de instancia;
- shadowing;
- herencia;
- llamada con receiver;
- overload/override cuando aplique;
- DataWindow referenciada;
- columna/control DataWindow;
- diagnóstico sintáctico;
- diagnóstico semántico;
- símbolo no resuelto con fallback seguro.

---

## 7. Testing de hot paths LSP

### 7.1. Hover

Debe validar:

- símbolo de sistema;
- función/evento de usuario;
- variable local/instancia/global;
- objeto PowerBuilder;
- DataWindow;
- símbolo desconocido;
- cache hit;
- cache miss controlado;
- negative cache;
- cancelación si aplica.

### 7.2. Completion

Debe validar:

- candidatos locales;
- candidatos de objeto;
- candidatos de workspace;
- built-ins;
- ranking básico;
- filtrado por contexto;
- resolve bajo demanda;
- cache de lista;
- cache de resolve.

### 7.3. Signature Help

Debe validar:

- función de sistema;
- función de usuario;
- overloads;
- posición de argumento;
- fallback si no hay resolución completa.

### 7.4. Definition y References

Debe validar:

- definición local;
- definición en otro objeto;
- definición heredada;
- references en documento activo;
- references en workspace;
- fallback textual presupuestado;
- no duplicar resultados.

### 7.5. Diagnostics

Debe validar:

- diagnóstico sintáctico;
- diagnóstico semántico;
- severidad;
- código;
- rango;
- fuente;
- related information si aplica;
- invalidación por nueva versión de documento;
- ausencia de diagnostics obsoletos.

### 7.6. Semantic Tokens

Debe validar:

- tokens básicos;
- tokens semánticos basados en symbol graph;
- invalidación por versión;
- respuesta estable sin reparsing innecesario.

---

## 8. Testing de Cache Layer

Cada cache debe tener tests de:

- key estable;
- hit;
- miss;
- invalidación;
- evicción si aplica;
- compatibilidad con versión de documento;
- compatibilidad con versión de workspace/index;
- métricas;
- fallback.

Casos prioritarios:

- active document snapshot;
- hover view model cache;
- negative hover cache;
- completion list cache;
- completion resolve cache;
- catalog lookup cache;
- diagnostics cache;
- semantic tokens cache;
- DataWindow model cache;
- workspace index cache.

---

## 9. Testing de Workspace, Parser e Indexer

### 9.1. Workspace discovery

Debe validar:

- workspace moderno;
- workspace legacy;
- múltiples targets;
- libraries;
- fuentes exportadas;
- paths relativos/absolutos;
- cambios de fichero;
- exclusiones configuradas;
- fallback ante estructura incompleta.

### 9.2. Parser

Debe validar:

- scripts completos;
- scripts incompletos mientras se edita;
- errores recuperables;
- rangos estables;
- comentarios y strings;
- firmas de funciones/eventos;
- declaraciones de variables;
- llamadas;
- estructuras.

### 9.3. Indexer

Debe validar:

- indexación por documento;
- indexación por objeto;
- actualización incremental;
- invalidación mínima;
- eliminación de símbolos al borrar/renombrar;
- consistencia del symbol graph.

---

## 10. Testing de DataWindow

DataWindow debe probarse como subdominio propio.

Debe validar:

- extracción de source DataWindow;
- parseo de modelo DataWindow;
- columnas;
- controles;
- propiedades;
- bindings desde PowerScript;
- cache por hash/source;
- safe mode;
- diagnostics DataWindow;
- integración con hover/completion/diagnostics.

Regla: una request interactiva de PowerScript no debe necesitar parsear todas las DataWindows para responder.

---

## 11. Testing de integraciones externas

### 11.1. ORCA

Debe probarse mediante adapters y fakes/mocks.

Casos mínimos:

- ORCA disponible;
- ORCA no disponible;
- error de sesión;
- lectura/export simulado;
- error mapper;
- cancelación o timeout si aplica.

### 11.2. PBAutoBuild

Debe probarse mediante runner/parser aislado.

Casos mínimos:

- build correcto simulado;
- build con errores;
- salida parcial;
- exit code distinto de cero;
- parser de salida;
- mapping a diagnostics;
- cancelación si aplica.

---

## 12. Testing de documentación

Los cambios documentales deben validar:

- que no se duplica información canónica;
- que no se añaden specs concretas al roadmap;
- que no se añade histórico fuera de `done-log.md`;
- que `architecture.md` no contiene estado granular;
- que `architecture-status.md` no duplica diseño completo;
- que `performance-budget.md` no contiene backlog;
- que `testing.md` no contiene specs accionables;
- que los enlaces relativos siguen siendo válidos.

---

## 13. Gates por tipo de cambio

### 13.1. Cambio de parser

Requiere:

- unit tests del caso sintáctico;
- test de recuperación si afecta edición incompleta;
- integration test si afecta símbolos;
- actualización de fixtures si aplica.

### 13.2. Cambio de indexer/workspace

Requiere:

- test de discovery/indexing;
- test de invalidación;
- test de eliminación/renombrado si aplica;
- performance smoke si afecta workspace grande.

### 13.3. Cambio de semantic facade/resolvers

Requiere:

- unit tests de resolución;
- contract tests de la fachada;
- integration tests con providers consumidores;
- casos de fallback/no resuelto.

### 13.4. Cambio de provider LSP

Requiere:

- unit/contract tests de result model/formatter;
- integration test del provider;
- smoke test si es feature crítica;
- performance check si afecta hot path.

### 13.5. Cambio de cache

Requiere:

- hit/miss tests;
- invalidation tests;
- eviction tests si aplica;
- metrics tests si aplica;
- performance check si afecta hot path.

### 13.6. Cambio de DataWindow

Requiere:

- tests de modelo DataWindow;
- tests de binding;
- tests de cache;
- integration test con provider si impacta UX;
- performance check si afecta hot path.

### 13.7. Cambio de integración externa

Requiere:

- fake/mock tests;
- error mapper tests;
- ausencia de herramienta;
- timeout/cancelación si aplica;
- mapping de salida a modelo interno.

### 13.8. Cambio documental

Requiere:

- revisar `docs/constitution.md`;
- mantener ownership documental;
- eliminar duplicados;
- actualizar documentos relacionados si aplica;
- validar enlaces relativos.

---

## 14. Suites recomendadas

```text
npm run test:unit
  → lógica pura rápida

npm run test:contract
  → contratos entre capas

npm run test:integration
  → servidor/workspace/providers conectados

npm run test:smoke
  → arranque y flujos críticos

npm run test:performance
  → budgets y regresión

npm run test:e2e
  → VS Code Extension Host cuando aplique
```

Los nombres exactos pueden adaptarse al repositorio, pero la separación conceptual debe mantenerse.

---

## 15. Criterios de cierre de una tarea

Una tarea puede cerrarse si:

- el tipo de cambio tiene tests adecuados;
- los tests rápidos pasan;
- los tests de integración/performance aplicables pasan o quedan justificados;
- no se rompen budgets de `docs/performance-budget.md`;
- no se introducen diagnostics obsoletos;
- no se rompe cancelación en hot paths;
- se actualiza documentación afectada;
- el backlog/spec queda alineado si aplica.

---

## 16. Relación con backlog y specs

Este documento no lista specs concretas. Si falta cobertura, debe registrarse como trabajo accionable en `docs/backlog.md` o en una spec bajo `docs/specs/`.

La entrada de backlog/spec debe indicar:

```text
área afectada
tipo de test requerido
fixture/corpus necesario
riesgo que cubre
budget relacionado si aplica
documentos afectados
```

---

## 17. Límites de este documento

Este documento no debe usarse para:

- guardar tareas pendientes concretas;
- listar specs por ID;
- registrar histórico cerrado;
- definir arquitectura objetivo completa;
- repetir budgets extensos ya definidos en `docs/performance-budget.md`;
- duplicar workflows de desarrollador.

---

## 18. Próximo paso documental

Después de normalizar este documento, los siguientes documentos recomendados son:

```text
docs/current-focus.md
docs/backlog.md
docs/developer-workflows.md
```

Objetivo:

- `current-focus.md`: foco inmediato;
- `backlog.md`: specs accionables;
- `developer-workflows.md`: comandos y flujos reales de desarrollo, no estrategia de testing.
