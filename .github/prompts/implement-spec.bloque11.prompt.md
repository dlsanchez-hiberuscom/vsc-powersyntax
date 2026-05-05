# BLOQUE 11 — Build, Release, VSIX, ORCA/PBAutoBuild & CI/CD Rails

> Objetivo: consolidar una línea profesional de build/release para el plugin VS Code y una integración segura, observable y opcional con herramientas PowerBuilder externas (`PBAutoBuild`, ORCA, build logs, support matrix y troubleshooting), sin contaminar el hot path interactivo ni bloquear el desarrollo local cuando esas herramientas no estén instaladas.

---

## Base técnica y patrones aplicados

Este bloque se basa en los bloques anteriores y en el estado esperado del proyecto:

- El plugin debe poder compilar, empaquetar y validar un VSIX instalable de forma reproducible.
- El release no debe depender de acciones manuales no documentadas.
- Los comandos externos de PowerBuilder (`PBAutoBuild`, ORCA, PowerBuilder Runtime, PowerServer Toolkit si aplica) deben ser carriles externos, no parte del hot path LSP.
- El servidor LSP debe seguir siendo rápido aunque no exista PowerBuilder IDE, Runtime, PBAutoBuild u ORCA en la máquina.
- Build/release debe tener health checks, support matrix, troubleshooting, logs y failure reasons accionables.
- La automatización de publicación debe separar claramente package/local VSIX, pre-release, marketplace publish y release notes.
- Los secretos como PATs, credenciales de source control o passwords de PBAutoBuild no deben entrar en logs, bundles ni repositorio.

Patrones oficiales y externos aplicados:

- **VSIX packaging con vsce:** `@vscode/vsce` es la herramienta oficial para empaquetar y publicar extensiones VS Code. El comando `vsce package` genera un `.vsix` y `vsce publish` publica en Marketplace.
- **Marketplace publish con PAT seguro:** la publicación con `vsce` usa Personal Access Tokens y, en CI, debe manejarse mediante secretos como `VSCE_PAT`, nunca hardcodeado.
- **CI para extensiones VS Code:** las pruebas de extensión pueden ejecutarse en CI; en Linux headless puede requerirse `xvfb` para tests que arranquen VS Code Desktop.
- **PBAutoBuild como tool externo:** Appeon documenta `PBAutoBuild250.exe` como herramienta standalone de línea de comandos para automatizar build/deploy de proyectos PowerBuilder sin requerir PowerBuilder IDE/licencia en ejecución, pero sí con requisitos runtime/toolkit según escenario.
- **PBAutoBuild por JSON o PBC:** PBAutoBuild permite build por archivo de configuración `/f` o modo PBC con `/pbc` y parámetros relacionados; también permite generar passwords cifrados con `/p`.
- **ORCA como API avanzada:** ORCA permite automatizar tareas de librerías PowerBuilder, importar/compilar objetos, consultar objetos y crear ejecutables/dynamic libraries, pero debe tratarse como carril avanzado y no como dependencia básica del plugin.

---

## Dependencia de Bloques previos

Este bloque se apoya especialmente en:

- `TEST-STRATEGY-01` — Test matrix canónica y lanes oficiales.
- `TEST-CI-01` — CI/local validation parity.
- `ARCH-MODULE-02` — Build/report/runtime handlers sin semántica duplicada.
- `AI-SAFEEDIT-01` — Safe edit plan, impact analysis, receipts y rollback, si agentes automatizan release.
- `AI-SECURITY-01` — Tool permissions, workspace trust y data exposure guardrails.

Este bloque NO debe introducir features de hot path, ni cambios semánticos, ni parsing nuevo.

---

## Estado de ítems anteriores

### Relacionados / consolidados

- Los ítems históricos de ORCA/PBAutoBuild, release readiness, VSIX smoke, CI y external rails quedan gobernados por este bloque.
- Los carriles ORCA/PBAutoBuild no se deben abrir sin support matrix, troubleshooting y health checks.
- Automated publishing no se debe activar sin secrets, approval y release checklist explícitos.

---

## Cadena recomendada — Bloque 11

Orden recomendado dentro del bloque:

1. `RELEASE-01` — Release readiness lane y VSIX packaging contract.
2. `RELEASE-02` — VSIX installed smoke hardening.
3. `RELEASE-03` — Versioning, changelog, release notes y artifact policy.
4. `RELEASE-04` — Marketplace/pre-release/publish policy con secrets.
5. `CI-RELEASE-01` — CI/local release parity y artifact retention.
6. `BUILD-RAILS-01` — External build rails architecture y no-hot-path boundary.
7. `BUILD-PBAUTO-01` — PBAutoBuild discovery, support matrix y health.
8. `BUILD-PBAUTO-02` — PBAutoBuild JSON/PBC command runner safe wrapper.
9. `BUILD-PBAUTO-03` — PBAutoBuild logs, diagnostics y troubleshooting.
10. `BUILD-ORCA-01` — ORCA readiness, support matrix y advanced lane.
11. `BUILD-ORCA-02` — ORCA adapter boundary y no-runtime dependency.
12. `BUILD-SECURITY-01` — Secrets, credentials, workspace trust y external command policy.
13. `BUILD-DOCS-01` — Build/release/ORCA/PBAutoBuild docs alignment.

---

# FASE A — Release y VSIX

## RELEASE-01 — Release readiness lane y VSIX packaging contract

- **Priority:** P1.
- **Status:** Open.
- **Area:** release, VSIX, packaging, validation.
- **Problem:**
  - El plugin necesita un carril reproducible para compilar, testear, empaquetar y validar un VSIX local.
  - Sin contrato de release, un agente puede generar un paquete sin ejecutar tests críticos o sin smoke de instalación.
- **Goal:**
  - Definir el carril oficial de release readiness y empaquetado VSIX.
- **Acceptance criteria:**
  - Existe script o documentación para ejecutar release readiness local.
  - El carril ejecuta, como mínimo:
    - install/restore si aplica;
    - compile/typecheck;
    - unit tests;
    - architecture rapid;
    - docs drift;
    - performance gate si está disponible;
    - VSIX package.
  - Si falta un script, queda documentado como `missing` y se crea backlog específico.
  - El VSIX se genera en una ruta/artifact conocida.
  - El carril no publica automáticamente.
  - El output final indica versión, commit, package path y validaciones ejecutadas.
- **Implementation notes:**
  - Usar `@vscode/vsce` o script existente si ya está integrado.
  - No introducir publish en esta spec.
  - No incluir tests, fixtures pesadas o secretos dentro del VSIX salvo decisión explícita.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
  - `npm run test:performance:gate` si aplica.
  - package VSIX command real.
- **Docs:**
  - `docs/testing.md`
  - `docs/developer-workflows.md`
  - `docs/release.md` si existe o debe crearse.
- **Dependencies:**
  - `TEST-STRATEGY-01`
  - `TEST-CI-01` recomendado.
- **Risk:** medio; package script mal definido puede generar VSIX incompleto o no reproducible.
- **Exit criteria:**
  - Existe carril claro y reproducible para generar VSIX validado localmente.

---

## RELEASE-02 — VSIX installed smoke hardening

- **Priority:** P1.
- **Status:** Open.
- **Area:** release, smoke, VS Code, activation.
- **Problem:**
  - Un VSIX puede empaquetar correctamente pero fallar al instalarse, activarse o arrancar Language Server.
- **Goal:**
  - Endurecer smoke test de VSIX instalado.
- **Acceptance criteria:**
  - Existe smoke test o checklist automatizable que instala el VSIX generado en un entorno limpio.
  - Verifica que la extensión se activa con workspace PowerBuilder mínimo.
  - Verifica que el Language Client arranca y el Language Server responde a initialize.
  - Verifica comandos críticos registrados.
  - Verifica que no hay errores críticos en activation/runtime journal.
  - Verifica comportamiento sin PowerBuilder IDE/PBAutoBuild/ORCA instalados.
  - Si no puede automatizarse todo, docs incluyen checklist manual explícito.
- **Implementation notes:**
  - Reutilizar `@vscode/test-cli`/Extension Development Host si procede.
  - Mantener fixtures mínimas.
  - No depender de corpora real.
- **Tests:**
  - `npm test` si cubre extension tests.
  - `npm run test:smoke` si existe.
  - `npm run test:docs:drift`.
- **Docs:**
  - `docs/testing.md`
  - `docs/release.md`
  - `docs/troubleshooting.md` si existe.
- **Dependencies:** `RELEASE-01`.
- **Risk:** medio-alto; smoke incompleto puede dejar pasar VSIX roto.
- **Exit criteria:**
  - El VSIX generado se valida instalado y activado, no solo empaquetado.

---

## RELEASE-03 — Versioning, changelog, release notes y artifact policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** release, versioning, changelog, artifacts.
- **Problem:**
  - Release sin política de versión, changelog y artifacts puede generar paquetes difíciles de rastrear.
- **Goal:**
  - Definir política de versionado y artifacts para releases y pre-releases.
- **Acceptance criteria:**
  - Se define cómo actualizar `package.json version`.
  - Se define cuándo actualizar `CHANGELOG.md` o release notes.
  - Se define naming del VSIX artifact.
  - Se define qué artifacts se guardan y durante cuánto tiempo en CI si existe.
  - Se documenta diferencia entre local package, pre-release y release estable.
  - Done-log/backlog se actualizan solo para specs realmente cerradas.
- **Implementation notes:**
  - No automatizar bump/publish sin decisión explícita.
  - Mantener changelog conciso y orientado a usuario/desarrollador.
- **Tests:**
  - `npm run test:docs:drift`
  - release readiness lane.
- **Docs:**
  - `CHANGELOG.md`
  - `docs/release.md`
  - `docs/backlog.md`
  - `docs/done-log.md`
- **Dependencies:** `RELEASE-01`.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Releases quedan trazables por versión, changelog y artifacts.

---

## RELEASE-04 — Marketplace/pre-release/publish policy con secrets

- **Priority:** P2.
- **Status:** Open.
- **Area:** release, marketplace, publishing, security.
- **Problem:**
  - Publicar en Marketplace requiere PAT/secret y una política clara para stable/pre-release.
  - Automatizar publish sin guardrails puede publicar paquetes no validados.
- **Goal:**
  - Definir política de publicación, sin activar publish automático por defecto.
- **Acceptance criteria:**
  - Se documenta cuándo usar `vsce package`, `vsce publish`, `--pre-release` o manual VSIX distribution.
  - PAT se maneja mediante secret (`VSCE_PAT`) o equivalente; nunca en repo/logs.
  - Publish requiere release readiness verde y approval explícita.
  - Se documentan constraints de Marketplace relevantes: imágenes, HTTPS, package metadata, publisher id.
  - Si no se va a publicar todavía, queda explícito y se mantiene solo VSIX local.
- **Implementation notes:**
  - No crear PAT ni workflows con secretos en esta spec.
  - Si se añade script, no debe publicar salvo comando explícito.
- **Tests:**
  - release readiness lane.
  - `npm run test:docs:drift`.
- **Docs:**
  - `docs/release.md`
  - `docs/developer-workflows.md`
- **Dependencies:**
  - `RELEASE-01`
  - `RELEASE-03`
  - `BUILD-SECURITY-01` recomendado.
- **Risk:** alto; publicación accidental o filtrado de secretos.
- **Exit criteria:**
  - Marketplace/pre-release/publish queda gobernado por política segura.

---

## CI-RELEASE-01 — CI/local release parity y artifact retention

- **Priority:** P2.
- **Status:** Open.
- **Area:** CI, release, artifacts.
- **Problem:**
  - Local release readiness y CI pueden divergir.
  - Artifacts de VSIX pueden no conservarse o no ser reproducibles.
- **Goal:**
  - Alinear carriles locales y CI para build/test/package/artifacts.
- **Acceptance criteria:**
  - CI ejecuta carriles mínimos equivalentes a local release readiness o docs explican la brecha.
  - CI produce artifact VSIX en ramas/tags definidos si se decide.
  - Artifact retention está documentado.
  - Linux headless VS Code tests tienen configuración adecuada (`xvfb` si aplica).
  - Publishing automático queda separado de packaging automático.
- **Implementation notes:**
  - No introducir CI complejo si el repo aún no lo necesita.
  - Empezar por compile/test/package artifact.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
  - package VSIX command.
- **Docs:**
  - `docs/testing.md`
  - `docs/release.md`
  - `docs/developer-workflows.md`
- **Dependencies:**
  - `TEST-CI-01`
  - `RELEASE-01`
- **Risk:** medio.
- **Exit criteria:**
  - Local/CI release validation queda alineada o brecha documentada.

---

# FASE B — External build rails architecture

## BUILD-RAILS-01 — External build rails architecture y no-hot-path boundary

- **Priority:** P1.
- **Status:** Open.
- **Area:** build, architecture, external-tools, hot-path-boundary.
- **Problem:**
  - Integraciones con PBAutoBuild, ORCA o PowerBuilder Runtime pueden aportar mucho valor, pero no deben afectar discovery/indexing/hover/completion.
- **Goal:**
  - Definir la arquitectura de carriles externos de build como capa opcional, async, observable y fuera del hot path.
- **Acceptance criteria:**
  - Build rails viven en módulos separados de LSP interactive serving.
  - No se importan desde providers de hover/completion/signatureHelp/definition.
  - Build rails se activan por comando explícito, task, report o workflow; no por apertura de archivo.
  - Ausencia de herramientas externas no degrada features LSP.
  - Health status indica tool missing/config missing sin errores ruidosos.
  - External commands tienen timeout, cancellation y log redaction.
- **Implementation notes:**
  - Reutilizar build handlers/runners existentes.
  - No mezclar ORCA y PBAutoBuild en el mismo adapter.
  - Mantener estado de build separado de runtime semantic state.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md` si existe.
- **Dependencies:**
  - `ARCH-MODULE-02`
  - `AI-SECURITY-01` recomendado.
- **Risk:** alto; build rails mal aislados pueden bloquear editor o contaminar semántica.
- **Exit criteria:**
  - Carriles externos quedan aislados y no pueden entrar en hot path interactivo.

---

## BUILD-PBAUTO-01 — PBAutoBuild discovery, support matrix y health

- **Priority:** P2.
- **Status:** Open.
- **Area:** PBAutoBuild, health, support-matrix.
- **Problem:**
  - PBAutoBuild puede no estar instalado o depender de Runtime/Toolkit según tipo de proyecto.
  - Sin discovery/health claro, los errores serán opacos.
- **Goal:**
  - Detectar PBAutoBuild de forma segura y publicar health/support matrix accionable.
- **Acceptance criteria:**
  - Se detecta ubicación/version de `PBAutoBuild250.exe` o se informa missing.
  - Se documentan requisitos por modo:
    - PowerBuilder traditional C/S;
    - PowerClient;
    - PowerServer;
    - JSON `/f`;
    - PBC `/pbc`.
  - Health report indica installed/missing/version/unsupported/config missing.
  - No se ejecuta PBAutoBuild durante startup normal.
  - No se loguean secrets ni paths sensibles innecesarios.
- **Implementation notes:**
  - Discovery debe ser bajo demanda o cached con TTL/config version.
  - Soportar configuración explícita de path.
  - No asumir Windows tooling en Linux/macOS; reportar unsupported.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:** `BUILD-RAILS-01`.
- **Risk:** medio.
- **Exit criteria:**
  - PBAutoBuild tiene discovery y support matrix clara, sin impactar startup/hot path.

---

## BUILD-PBAUTO-02 — PBAutoBuild JSON/PBC command runner safe wrapper

- **Priority:** P2.
- **Status:** Open.
- **Area:** PBAutoBuild, command-runner, safety.
- **Problem:**
  - Ejecutar PBAutoBuild directamente desde comandos puede exponer secretos, bloquear UI o producir errores difíciles de interpretar.
- **Goal:**
  - Crear wrapper seguro para ejecutar PBAutoBuild en modos JSON `/f` y PBC `/pbc`.
- **Acceptance criteria:**
  - Wrapper acepta configuración validada, no strings shell arbitrarios.
  - Soporta modo `/f` con build JSON.
  - Soporta o planifica modo `/pbc` con `/c` y `/d` si aplica.
  - Tiene timeout, cancellation, process output capture y redaction.
  - No ejecuta en Restricted Mode/Workspace Trust no confiable sin aprobación.
  - Devuelve result object con exitCode, logs, errorLog, duration, mode y reasonCodes.
  - No bloquea Extension Host ni LSP server event loop.
- **Implementation notes:**
  - Usar child process de forma segura, sin shell injection.
  - Validar que paths estén dentro de workspace o config explícita aprobada.
  - No meter credenciales en arguments si puede evitarse.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md`
- **Dependencies:**
  - `BUILD-PBAUTO-01`
  - `BUILD-SECURITY-01`
- **Risk:** alto; ejecución externa insegura puede filtrar secretos o bloquear procesos.
- **Exit criteria:**
  - PBAutoBuild se ejecuta mediante wrapper seguro, observable y cancelable.

---

## BUILD-PBAUTO-03 — PBAutoBuild logs, diagnostics y troubleshooting

- **Priority:** P2.
- **Status:** Open.
- **Area:** PBAutoBuild, logs, diagnostics, troubleshooting.
- **Problem:**
  - PBAutoBuild genera logs y error logs; sin parsing/resumen, el usuario verá errores poco accionables.
- **Goal:**
  - Convertir logs PBAutoBuild en diagnostics/reportes útiles sin ruido ni secretos.
- **Acceptance criteria:**
  - Se capturan log normal y error log.
  - Se redaccionan secrets y credenciales.
  - Se extraen reason codes básicos:
    - tool missing;
    - runtime missing;
    - config JSON missing/invalid;
    - source control auth failure;
    - compile error;
    - deploy error;
    - timeout/cancelled;
    - unsupported platform.
  - Se muestra resumen accionable y ruta segura a logs completos.
  - No se publican logs enormes en UI por defecto.
  - Support bundle incluye resumen, no secretos.
- **Implementation notes:**
  - Empezar por parsing defensivo basado en patterns mínimos.
  - No depender de idioma exacto del log si no es estable; usar exit code + known markers.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/troubleshooting.md`
  - `docs/developer-workflows.md`
- **Dependencies:** `BUILD-PBAUTO-02`.
- **Risk:** medio.
- **Exit criteria:**
  - PBAutoBuild failures son accionables y seguros de compartir.

---

# FASE C — ORCA advanced lane

## BUILD-ORCA-01 — ORCA readiness, support matrix y advanced lane

- **Priority:** P3.
- **Status:** Open.
- **Area:** ORCA, build, advanced-tools.
- **Problem:**
  - ORCA es potente pero más avanzada y con constraints propios. No debe convertirse en dependencia básica.
- **Goal:**
  - Definir ORCA como carril avanzado opcional con readiness/support matrix.
- **Acceptance criteria:**
  - Se documenta qué problemas resuelve ORCA frente a PBAutoBuild.
  - Se documenta qué NO debe hacer el plugin con ORCA en fase inicial.
  - Health indica ORCA available/missing/unsupported.
  - No se carga ORCA en startup ni en hot path.
  - No se implementan operaciones destructivas sin safe-edit-plan y approval.
  - Backlog separa discovery/readiness de operaciones reales.
- **Implementation notes:**
  - Empezar por documentación/health, no ejecución compleja.
  - Evitar dependencia nativa opcional obligatoria.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:** `BUILD-RAILS-01`.
- **Risk:** medio-alto.
- **Exit criteria:**
  - ORCA queda como advanced lane opcional y no como runtime dependency.

---

## BUILD-ORCA-02 — ORCA adapter boundary y no-runtime dependency

- **Priority:** P3.
- **Status:** Open.
- **Area:** ORCA, adapter, boundaries.
- **Problem:**
  - Si se implementa ORCA adapter sin boundary clara, puede introducir dependencias nativas, plataforma o estado mutable en el core.
- **Goal:**
  - Definir boundary técnica para cualquier futuro ORCA adapter.
- **Acceptance criteria:**
  - ORCA adapter vive en módulo externo/optional rail.
  - No se importa desde hot path, KnowledgeBase, parser, features LSP ni client activation.
  - Adapter expone operations explícitas y typed result objects.
  - Operations write-enabled requieren `AI-SAFEEDIT-01`/approval si aplica.
  - Tests/import guards bloquean dependencias indebidas.
- **Implementation notes:**
  - Puede ser spec de diseño sin implementación de ORCA calls reales.
  - Si se implementa, usar lazy loading y platform checks.
- **Tests:**
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/developer-workflows.md`
- **Dependencies:** `BUILD-ORCA-01`.
- **Risk:** alto.
- **Exit criteria:**
  - Futuro ORCA adapter queda encapsulado y sin dependencia runtime accidental.

---

# FASE D — Seguridad y documentación

## BUILD-SECURITY-01 — Secrets, credentials, workspace trust y external command policy

- **Priority:** P1.
- **Status:** Open.
- **Area:** security, build, external-tools, workspace-trust.
- **Problem:**
  - Build rails pueden manejar PATs, source control credentials, encrypted passwords, paths internos y comandos externos.
- **Goal:**
  - Definir política de seguridad para secretos y comandos externos.
- **Acceptance criteria:**
  - Secrets nunca se guardan en repo, logs, support bundles ni output visible.
  - PBAutoBuild password encryption `/p` se documenta sin capturar passwords en logs.
  - Source control credentials de build JSON se tratan como sensibles.
  - Workspace Trust/Restricted Mode bloquea o pide aprobación para comandos externos.
  - Command runner usa args seguros, no shell strings arbitrarios.
  - Support bundle redacta tokens, passwords, user/pass, PATs y rutas sensibles configurables.
  - Docs explican riesgos y cómo configurar secrets en CI.
- **Implementation notes:**
  - Compartir redaction utilities con support bundle si existen.
  - Mantener allowlist de commands externos.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md`
  - `docs/release.md`
- **Dependencies:**
  - `AI-SECURITY-01` recomendado.
- **Risk:** alto.
- **Exit criteria:**
  - Build/release external commands tienen política de secretos y trust segura.

---

## BUILD-DOCS-01 — Build/release/ORCA/PBAutoBuild docs alignment

- **Priority:** P2.
- **Status:** Open.
- **Area:** docs, build, release, troubleshooting.
- **Problem:**
  - Build/release y external rails suelen requerir varias docs; si se duplican, se desalinean rápido.
- **Goal:**
  - Alinear documentación de release, CI, PBAutoBuild, ORCA, troubleshooting y support matrix sin duplicar.
- **Acceptance criteria:**
  - `docs/release.md` o equivalente cubre VSIX/package/publish/release readiness.
  - `docs/developer-workflows.md` cubre flujos locales.
  - `docs/troubleshooting.md` cubre errores comunes de PBAutoBuild/ORCA/release.
  - `docs/architecture-implementation-map.md` refleja rails externas y boundaries.
  - `docs/testing.md` enlaza release lanes y smoke tests.
  - Backlog enlaza specs sin duplicar pasos largos.
  - `test:docs:drift` queda verde.
- **Implementation notes:**
  - Una sola fuente de verdad por tema.
  - Usar links cruzados en vez de copiar procedimientos completos.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/release.md`
  - `docs/developer-workflows.md`
  - `docs/troubleshooting.md`
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
  - `docs/backlog.md`
- **Dependencies:** puede acompañar a todo el bloque.
- **Risk:** bajo.
- **Exit criteria:**
  - Documentación de build/release/external rails queda coherente y sin duplicación.

---

## Resultado esperado al cerrar el Bloque 11

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existe release readiness lane reproducible.
2. VSIX package se genera como artifact validado.
3. VSIX installed smoke verifica activación, comandos y Language Server.
4. Versioning, changelog, release notes y artifacts tienen política clara.
5. Marketplace/pre-release/publish usa approval y secrets seguros.
6. CI/local release parity queda alineado o la brecha documentada.
7. Build rails externas están fuera del hot path.
8. PBAutoBuild tiene discovery, support matrix, health, wrapper seguro y troubleshooting.
9. ORCA queda como advanced optional lane con boundary clara.
10. Secrets/credentials/workspace trust/external commands están gobernados.
11. Docs de release/build/PBAutoBuild/ORCA/troubleshooting están alineadas.
12. No se ha introducido dependencia runtime obligatoria de PowerBuilder IDE, PBAutoBuild u ORCA para LSP básico.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Build, Release, VSIX, ORCA/PBAutoBuild & CI/CD Rails

## Scope

- RELEASE-01
- RELEASE-02
- BUILD-RAILS-01
- BUILD-SECURITY-01
- BUILD-DOCS-01

## Optional within same focus only if previous items are closed

- RELEASE-03
- CI-RELEASE-01
- BUILD-PBAUTO-01

## Explicitly out of scope

- Automatic Marketplace publish
- Write-enabled ORCA operations
- Mandatory PBAutoBuild/ORCA dependency for basic LSP
- Hot path integration with build tools
- PowerBuilder parser/semantic changes
- CI secrets creation inside repository

## Exit criteria

- Release readiness can generate validated VSIX.
- VSIX installed smoke is documented or automated.
- External build rails are isolated from hot path.
- Secrets/trust policy exists.
- Docs are aligned.
```

---