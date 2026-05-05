# Support — PowerBuilder VS Code Plugin

## 1. Propósito

Definir cómo recopilar evidencia de soporte sin exponer código o datos sensibles innecesariamente.

---

## 2. Principios

- Soporte local-first.
- Sin telemetría externa por defecto.
- Export offline solo por acción explícita.
- Redacción de rutas, URIs, ejecutables, settings sensibles y endpoints.
- No copiar código bruto salvo repro pack explícito.

---

## 3. Artefactos de soporte

### Support bundle

Uso:

```txt
Diagnóstico offline de runtime, settings, health, build, ORCA, performance y estado general.
```

Debe incluir información saneada, no código bruto por defecto.

### Semantic repro pack

Uso:

```txt
Bug semántico reproducible que requiere contexto de archivos relacionados.
```

Debe ser explícito y acotado.

### Task replay bundle

Uso:

```txt
Rehidratar contexto mínimo de una tarea IA o soporte sin requerir workspace completo.
```

---

## 4. Cuándo usar cada uno

```txt
Problema de activación/VSIX       -> support bundle + logs Extension Host
Problema semántico reproducible   -> semantic repro pack
Problema de performance           -> performance summary + support bundle
Problema ORCA/PBAutoBuild         -> support bundle + build-orca snapshot
Problema de IA/contexto           -> ai-task-context-bundle o task-replay-bundle
```

---

## 5. Qué no enviar

- credenciales;
- tokens;
- certificados;
- rutas privadas sin redacción;
- código fuente bruto salvo repro explícito;
- dumps completos de PBL/PBD;
- logs con secretos sin sanear.

---

## 6. Validación antes de compartir

Antes de compartir un bundle:

1. revisar `manifest.json`;
2. revisar perfil de redacción;
3. confirmar que no hay código bruto salvo intención explícita;
4. confirmar que no hay secretos;
5. adjuntar resumen del problema y comandos ejecutados.
