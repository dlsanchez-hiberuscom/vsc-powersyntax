# CERRAR PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — Limpieza de ruido visual de diagnostics

Actúa como arquitecto senior y ejecutor técnico del plugin **VSC PowerSyntax / PowerBuilder 2025 para VS Code**.

## Objetivo

Cerrar `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01` reduciendo el ruido visual de diagnostics sin ocultar errores reales.

Los patrones normales de PowerBuilder no deben ensuciar `Problems` por defecto si son informativos, contextuales, dinámicos o de baja confianza.

## Contexto actual

El carril runtime/hover/serving/parser ya está cerrado y validado:

- `RuntimeSelfTest` funcional con probes reales.
- Hover built-ins/system functions cerrado.
- Serving cache observable cerrado.
- View providers registrados durante `activate`.
- Discovery/readiness real cerrado.
- Parser/lexer string-safe cerrado.
- DataWindow sublanguages con frontera segura cerrado.
- Health build/ORCA separado del runtime interactivo cerrado.

El siguiente foco activo es:

```txt
PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01
```

No reabras hover, serving, discovery, parser o lexer salvo regresión demostrada por tests.

---

## Fuentes obligatorias

Lee antes de modificar:

- `backlog.md`
- `current-focus.md`
- `done-log.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/performance-budget.md`
- código real de diagnostics/analyzers/linter
- tests existentes de diagnostics
- `package.json`

No trabajes de memoria. No cierres el ítem sin código, tests, validación y documentación.

---

## Reglas globales

1. No añadir nuevas reglas de diagnostics salvo necesidad real.
2. No convertir patrones normales de PowerBuilder en warnings visibles por defecto.
3. No convertir confidence baja en warning automáticamente.
4. No ocultar errores reales.
5. No romper tests ya cerrados de runtime/hover/serving/parser.
6. No introducir full scans en hot paths.
7. No tocar parser/lexer salvo regresión demostrada.
8. No tocar discovery/indexing salvo evidencia directa.
9. No contaminar runtime interactivo con build/ORCA.
10. Si un diagnostic no es accionable, moverlo a hint/info/context panel/hover según corresponda.
11. Si queda deuda, registrarla en backlog con evidencia, riesgo, plan y validación.
12. Actualizar documentación afectada y `done-log.md` solo si queda completamente cerrado.

---

# FASE 1 — Auditoría de diagnostics actuales

Ejecuta la suite completa de diagnostics y localiza todos los diagnostics activos.

Clasifica cada diagnostic por:

- error real de corrección;
- warning accionable;
- hint útil;
- info contextual;
- ruido visual;
- baja confianza;
- patrón normal PowerBuilder;
- caso dinámico no resoluble estáticamente;
- caso PFC/framework normal;
- caso DataWindow/dynamic string;
- caso que debe vivir en hover/context panel y no en Problems.

Presta especial atención a:

- `dataobject-dynamic`;
- `transaction-binding-dynamic`;
- lifecycle hooks;
- empty hooks;
- symbols con confidence baja;
- ancestors/framework PFC;
- DataWindow/dynamic strings;
- patrones normales de PowerBuilder que no requieren acción.

Para cada diagnostic, documenta internamente:

```md
### Diagnostic <code>

- Severidad actual:
- Severidad recomendada:
- Visible en Problems por defecto: sí/no
- Debe moverse a hover/context panel: sí/no
- Confidence requerida:
- Es accionable: sí/no
- Es patrón normal PowerBuilder/PFC: sí/no
- Motivo:
- Casos reales:
- Tests existentes:
- Tests faltantes:
```

No implementes todavía. Primero entiende todo el mapa de ruido.

---

# FASE 2 — Política de severidad

Formaliza una política clara y consistente.

Usa esta base:

```txt
Error:
- Solo errores reales, deterministas y accionables.
- Deben indicar algo que probablemente rompe compilación, ejecución o semántica básica.

Warning:
- Problemas probables con impacto real y evidencia suficiente.
- Deben ser accionables por el usuario.

Information:
- Contexto útil, no invasivo.
- No debe ensuciar Problems por defecto si describe un patrón normal.

Hint:
- Ayudas suaves, sugerencias o explicaciones de patrones dinámicos.
- Preferible para baja confianza o casos framework.

Context panel / hover / diagnostics explainability:
- Baja confianza.
- Patrones dinámicos normales.
- Explicaciones de framework.
- Casos donde el usuario no debe corregir código.
```

Reglas específicas:

- `dataobject-dynamic` no debe ser warning visible por defecto si representa un patrón normal de PowerBuilder/DataWindow.
- `transaction-binding-dynamic` no debe ser warning visible por defecto si no hay evidencia accionable.
- Lifecycle hooks normales no deben generar ruido por defecto.
- Empty hooks normales no deben generar warning si son patrón framework/PFC válido.
- Confidence baja debe preferir hint/context panel, no warning.
- Si el usuario activa modo estricto, puede mostrarse más señal, pero el default debe ser limpio.

---

# FASE 3 — Implementación

Implementa los cambios mínimos necesarios.

Objetivos:

1. Ajustar severidades.
2. Ajustar routing hacia Problems, hover, context panel o diagnostics explainability.
3. Añadir reason codes si faltan.
4. Añadir configuración solo si ya existe patrón de configuración o es estrictamente necesario.
5. Mantener el editor limpio por defecto.

Preferencias:

- Mover información contextual a hover/context panel.
- Mantener Problems para errores y warnings accionables.
- Mantener explainability para casos dinámicos y baja confianza.
- No añadir una matriz gigante de settings si no es necesaria.

Si existe configuración, respétala:

- strict mode;
- show informational diagnostics;
- show dynamic binding hints;
- framework/PFC mode;
- diagnostic severity overrides.

Si no existe, evita crear configuración nueva salvo que sea imprescindible.

---

# FASE 4 — Tests obligatorios

Amplía o corrige tests de diagnostics.

Validar como mínimo:

```txt
Errores reales siguen saliendo como Error.
Warnings accionables siguen saliendo como Warning.
dataobject-dynamic no ensucia Problems por defecto si es patrón normal.
transaction-binding-dynamic no ensucia Problems por defecto si no es accionable.
Lifecycle hooks normales no generan ruido visual por defecto.
Empty hooks normales no generan warning si son patrón framework/PFC válido.
PFC/framework patterns degradan con contexto, no con warning agresivo.
Confidence baja no se convierte automáticamente en warning.
Strict mode conserva capacidad de mostrar más señales si aplica.
Diagnostics explainability conserva reason codes útiles.
```

Ejecuta como mínimo:

```bash
npm run build:test
```

Ejecuta tests de diagnostics existentes, por ejemplo si existen:

```bash
npx mocha --ui tdd diagnostics.test.js diagnosticsExtra.test.js
```

Ejecuta regresiones relevantes ya cerradas:

```bash
npx mocha --ui tdd runtimeSelfTest.test.js featureHandlers.test.js interactiveLoopGuard.test.js
```

Ejecuta parser/lexer regression tests si están relacionados:

```bash
npx mocha --ui tdd codeMasking.test.js codeMaskingAudit.test.js comments_stripper.test.js statementSplitter.test.js powerbuilderParserResilienceFuzz.test.js
```

Si existe docs drift:

```bash
npm run test:docs:drift
```

Si existe performance gate:

```bash
npm run test:performance:gate
```

No inventes resultados. Si un comando no existe, localiza el equivalente real en `package.json` o documenta el skip honestamente.

---

# FASE 5 — Validación UX/runtime

Valida que el comportamiento por defecto queda limpio.

Comprobar:

```txt
Problems no se llena de info/hints no accionables.
Diagnostics dinámicos normales aparecen como hint/info/context, no warning agresivo.
Los errores reales siguen visibles.
Las explicaciones permanecen disponibles en hover/context panel/Diagnostics Explainability.
No se rompe RuntimeSelfTest.
No se rompe hover built-in.
No se rompe serving cache.
No se rompe view providers.
No se rompe parser/lexer string-safe.
```

Si puedes validar con fixture PFC/PowerBuilder real, hazlo. Si no, documenta el skip y usa fixture representativa.

---

# FASE 6 — Documentación

Actualiza documentación afectada.

Mínimo:

- `backlog.md`
- `current-focus.md`
- `done-log.md` si queda Done
- `docs/troubleshooting.md`
- `docs/testing.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` si se formaliza política de diagnostics PowerBuilder
- `docs/performance-budget.md` si cambia hot path o presupuesto

Reglas:

- No duplicar responsabilidades entre docs.
- `backlog.md` solo trabajo activo.
- `done-log.md` solo trabajo completamente cerrado.
- `architecture-status.md` describe estado real.
- `architecture-implementation-map.md` describe rutas, hot paths e implementación.
- `testing.md` documenta comandos y criterios.
- `troubleshooting.md` documenta síntomas, causas y diagnóstico operativo.

---

# FASE 7 — Cierre del ítem

Decide estado final de `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`.

## Marcar Done solo si:

- código implementado;
- tests pasan;
- validación ejecutada;
- docs actualizadas;
- `done-log.md` actualizado;
- backlog activo ya no lo contiene como pendiente;
- no quedan diagnostics ruidosos conocidos sin clasificación.

## Marcar Partial si:

- hay mejora real;
- queda una parte concreta;
- queda `Pendiente exacto` en backlog.

## Mantener Open si:

- no hay implementación;
- no hay tests;
- no hay validación;
- quedan fallos conocidos sin plan.

---

# FASE 8 — Salida final obligatoria

Entrega este formato final:

```md
# Resultado PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01

## 1. Resumen ejecutivo
- ...

## 2. Diagnostics revisados
- `code` — severidad anterior — severidad nueva — routing — motivo

## 3. Cambios de severidad/routing
- ...

## 4. Cambios implementados
- ...

## 5. Tests ejecutados
- comando
- resultado
- número de tests
- fallos si quedan

## 6. Validación runtime/UX
- Problems limpio por defecto:
- Errores reales visibles:
- Dynamic diagnostics:
- PFC/framework patterns:
- Strict mode/configuración:
- Diagnostics Explainability:

## 7. Documentación actualizada
- ...

## 8. Estado final del backlog
- Done/Partial/Open:
- Motivo:
- Done-log:
- Current-focus:

## 9. Riesgos residuales
- ...

## 10. Siguiente foco recomendado
- ...
```

---

## Restricción final

No cierres el ítem si solo cambias severidades sin demostrar con tests que el ruido visual baja y que los errores reales siguen visibles.
