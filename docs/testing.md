# Testing Strategy — PowerBuilder VS Code Plugin

## 1. Propósito

Definir cómo se valida el plugin: unidad, integración, smoke, performance, documentación, VSIX y release.

---

## 2. Principios

- Validar antes de cerrar.
- No fingir resultados.
- Usar fixtures/corpus reales cuando existan.
- Documentar skips honestos cuando falte entorno o corpus.
- Proteger hot path, packaging VSIX y contratos públicos.

---

## 3. Suites principales

```bash
npm test
npm run test:docs:drift
npm run test:architecture:metrics
npm run test:performance:gate
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

---

## 4. Validación por tipo de cambio

### Documentación

```bash
npm run test:docs:drift
```

### Arquitectura/capas

```bash
npm run test:architecture:metrics
```

### Hot path/performance

```bash
npm run test:performance:gate
```

### VSIX/release

```bash
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
npm run release:verify
```

### Catálogo

Usar tests de consistency, coverage y consumers visibles afectados.

### DataWindow

Usar tests de model, hover, definition, completion y diagnostics afectados.

---

## 5. Regla de cierre

Una spec no pasa a `Done` si la validación requerida no fue ejecutada o si el resultado no está documentado.
