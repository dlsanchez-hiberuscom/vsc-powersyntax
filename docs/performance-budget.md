# Performance Budget — PowerBuilder VS Code Plugin

## 1. Propósito

Definir límites de rendimiento que protegen la experiencia del usuario y la meta maestra.

> El plugin debe descubrir e indexar muy rápido sin bloquear.

---

## 2. Rutas protegidas

### Hot path interactivo

- hover;
- completion;
- definition;
- signature help;
- diagnostics del archivo activo;
- document symbols.

Prohibido:

- scans completos;
- full catalog clone;
- `JSON.stringify` masivo;
- rereads globales;
- ORCA/PBAutoBuild execution;
- reports pesados sin caps.

### Background path

- discovery;
- indexing;
- reports;
- cleanup;
- build discovery;
- support bundles.

Debe ser cancelable, observable y no bloquear foreground.

---

## 3. Reglas

- El archivo activo tiene prioridad.
- El background no roba latencia al foreground.
- Toda tarea larga debe ceder o cancelarse.
- Toda degradación debe ser explícita.
- Warm path debe mejorar claramente cold path.

---

## 4. Validación

```bash
npm run test:performance:gate
npm run test:architecture:metrics
```

Si el cambio toca packaging/release, añadir validación VSIX.

---

## 5. Relación con otros documentos

- `docs/testing.md` define cómo ejecutar validación.
- `docs/runtime/runtime-observability.md` define señales runtime.
- `docs/architecture.md` define invariantes.
