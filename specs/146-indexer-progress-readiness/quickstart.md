# Quickstart — Spec 146 Indexer Progress and Readiness (B134)

## 1. Proposito

Comprobar que el servidor expone progreso operativo y readiness semantica como una fuente unica y coherente.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Arrancar discovery e indexacion del workspace.
2. Consultar project status o la superficie equivalente.
3. Verificar que aparecen discovery/indexing y tambien active context ready, project ready y workspace ready.
4. Confirmar que las transiciones avanzan de forma monotona y explicable.

## 4. Resultado esperado

- Progreso y readiness se entienden como conceptos distintos pero coordinados.
- El estado del contexto activo se observa antes que el ready global del workspace.
- Las features pueden usar esta fuente para degradar con seguridad.

## 5. Checklist

- [ ] Existe fuente unica de progreso y readiness.
- [ ] projectStatus o salida equivalente la consume.
- [ ] Los tests cubren transiciones base.
- [ ] La salida es coherente durante indexacion progresiva.