# AI Strategy — PowerBuilder VS Code Plugin

## 1. Propósito

Definir la estrategia estable para integrar IA en el repositorio sin romper la arquitectura ni el hot path.

Este documento no describe tools concretas ni catálogo de agentes. Esos detalles viven en `docs/ai/ai-integration-architecture.md` y `docs/ai/ai-agents-catalog.md`.

---

## 2. Principios

- La IA consume contratos públicos, no dominio interno mutable.
- El plugin debe seguir siendo útil sin IA.
- El cliente de VS Code sigue siendo ligero; la semántica vive en el servidor LSP.
- Los flujos read-only son la opción por defecto.
- Los flujos write-enabled requieren safe-edit-plan, receipts, validación y documentación alineada.
- Los context bundles deben ser compactos, con caps, omissions y reason codes.

---

## 3. Prioridades estratégicas

### Estabilidad contractual

Mantener API pública, tool bridge, observabilidad y schemas versionados como única base para automatización externa.

### Seguridad operativa

Bloquear o degradar cuando falten `sourceOrigin`, `readiness`, `evidence` o `confidence` suficientes.

### Coste controlado

No introducir scans completos, clones de catálogo ni rails paralelos de semántica para IA.

### Documentación IA-first

Mantener un mapa corto y consistente entre:

- `AGENTS.md`
- `docs/ai/ai-integration-architecture.md`
- `docs/ai/ai-agents-catalog.md`
- `docs/ai-context/powerbuilder-plugin-context.md`

---

## 4. Regla operativa

Si una capacidad IA necesita detalle técnico adicional, debe enlazar al documento propietario del área en vez de duplicar contenido.

---

## 5. Validación mínima

```bash
npm run test:docs:drift
npm test
```