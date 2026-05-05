# Runtime Observability

## 1. Propósito

Documentar la observabilidad operativa real del runtime LSP sin duplicar testing ni performance budget.

---

## 2. Dominios publicados

El contrato público de observabilidad cubre estos dominios:

- readiness
- indexing
- cache
- memory
- latency
- build
- orca
- diagnostics
- query-trace
- support-bundle
- health

---

## 3. Superficies

- `getServerStats()` como método público versionado.
- tool read-only `server-stats`.
- comandos de cliente para stats, health, budgets de memoria y mantenimiento.
- export offline de support bundles y health reports con redacción explícita.

---

## 4. Reglas

- No hay telemetría externa por defecto.
- La observabilidad debe ser local, serializable y versionada.
- Los exports offline requieren acción explícita del usuario.
- Los bundles deben respetar perfiles de redacción `sanitized` o `summary-only` cuando aplique.
- La observabilidad no abre un rail paralelo al runtime; reutiliza el mismo estado publicado por el servidor.

---

## 5. Relación con otros documentos

- `docs/testing.md` define cómo validar estas superficies.
- `docs/performance-budget.md` define límites y gates de rendimiento.
- `docs/ai/ai-integration-architecture.md` describe cómo IA consume este contrato.
