# CI/CD Architecture — PowerBuilder VS Code Plugin

## 1. Propósito

Definir la arquitectura de CI/CD para validar el plugin, el VSIX, documentación, performance y release readiness.

---

## 2. Principios

- CI no debe depender de fixtures locales ausentes.
- Los skips deben ser explícitos y honestos.
- Release lane debe reproducir el VSIX real.
- Performance gate no debe convertir CI en soak costoso.
- Workflows manuales deben existir para validaciones pesadas.

---

## 3. Lanes recomendados

### PR / push rápido

```bash
npm test
npm run test:docs:drift
npm run test:architecture:metrics
```

### Performance gate

```bash
npm run test:performance:gate
```

### Release readiness

```bash
npm run release:verify
```

### Soak opt-in

```bash
npm run test:performance:soak
```

---

## 4. Artefactos

- VSIX generado;
- reports de performance;
- docs drift report si existe;
- logs de smoke instalada;
- lista de contenido VSIX.

---

## 5. Reglas

- No publicar si smoke instalada falla.
- No aceptar command ownership duplicado.
- No aceptar referencias documentales rotas conocidas.
- No aceptar corpus claims sin fixtures o skip honesto.
