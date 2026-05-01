# Quickstart — Spec 137 Reverse Semantic Dependencies (B153)

## 1. Proposito

Comprobar que el motor calcula documentos impactados a partir de dependencias semanticas reales y no por invalidacion masiva.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un conjunto de archivos relacionados por herencia o tipo.
2. Cambiar una firma o visibilidad en el archivo propietario.
3. Verificar que el grafo inverso identifica los documentos dependientes esperados.
4. Confirmar que documentos no relacionados no entran en la recomputacion.

## 4. Resultado esperado

- El runtime devuelve un conjunto impactado pequeno y explicable.
- La invalidacion futura puede apoyarse en el grafo sin barridos globales innecesarios.
- Se preserva la prioridad del archivo activo.

## 5. Checklist

- [ ] extractSemanticDependencies esta cubierto por tests.
- [ ] reverseDependencyGraph resuelve impactos cross-file base.
- [ ] impactedDocumentsResolver evita falsos positivos obvios.
- [ ] No se introduce recomputacion global innecesaria en casos simples.