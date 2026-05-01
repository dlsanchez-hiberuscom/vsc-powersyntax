# Quickstart — Spec 135 Workspace Semantic Epoch (B166)

## 1. Proposito

Verificar que el runtime mantiene una epoch semantica del workspace y que las respuestas obsoletas se detectan o invalidan correctamente.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace con varios archivos relacionados por herencia o visibilidad.
2. Ejecutar una query interactiva y registrar la epoch asociada.
3. Introducir un cambio semantico que deba publicarse globalmente.
4. Verificar que la epoch del workspace aumenta y que la respuesta anterior queda marcada como stale o se recalcula.

## 4. Resultado esperado

- Existe una epoch semantica observable.
- Las caches ligadas a epoch no reutilizan respuestas obsoletas.
- El incremento de epoch no se dispara por cambios no semanticos triviales.

## 5. Checklist

- [ ] workspaceSemanticEpoch se mantiene en el runtime.
- [ ] Al menos una cache o query esta ligada a epoch.
- [ ] Los tests de staleEpochDetection pasan.
- [ ] No hay invalidaciones espurias por cambios no semanticos.